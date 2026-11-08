import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api/v1";

interface TestResult {
  step: string;
  scenario: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(step: string, scenario: string, passed: boolean, details: string) {
  results.push({ step, scenario, passed, details });
  console.log(`[${passed ? "✓ PASS" : "✗ FAIL"}] [${step}] ${scenario}: ${details}`);
}

async function postJson(endpoint: string, data: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function patchJson(endpoint: string, data: any = {}, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function getJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function runAudit() {
  console.log("==========================================================================");
  console.log(" EYOB SALON — EPIC 3: DYNAMIC CATEGORIES, APPROVALS & NOTIFICATIONS AUDIT ");
  console.log("==========================================================================\n");

  const ts = Date.now();
  let testServiceId: string | null = null;
  let ownerCategoryName = `Owner Couture ${ts}`;
  let branchCategoryName = `Branch Holistic ${ts}`;

  try {
    // -----------------------------------------------------------------
    // SETUP: Authenticate Owner and Branch Admin
    // -----------------------------------------------------------------
    console.log("--- SETUP: Authenticating Credentials ---");
    const ownerLogin = await postJson("/auth/login", {
      identifier: "owner@eyobsalon.com",
      password: "Owner@123",
    });
    const ownerToken = ownerLogin.data.data?.tokens?.accessToken || ownerLogin.data.data?.accessToken;
    if (!ownerToken) throw new Error("Owner login failed");
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    record("SETUP", "Owner Login", true, "Owner authenticated with JWT.");

    // Authenticate Branch Admin
    const adminLogin = await postJson("/auth/login", {
      identifier: "admin.bole@eyobsalon.com",
      password: "Admin@123",
    });
    const adminToken = adminLogin.data.data?.tokens?.accessToken || adminLogin.data.data?.accessToken;
    if (!adminToken) throw new Error("Branch Admin login failed");
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const adminUser = adminLogin.data.data?.user;
    record("SETUP", "Branch Admin Login", true, `Branch Admin (${adminUser.email}) authenticated for branch ${adminUser.branchId}`);

    // Retrieve Bole branch
    const boleBranch = await prisma.branch.findFirst({
      where: { id: adminUser.branchId },
    });
    if (!boleBranch) throw new Error("Bole branch not found");

    // -----------------------------------------------------------------
    // TEST 1: Status & Filter Fix (Active / Inactive / All)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 1: Status & Filter Fix ---");
    const newServiceRes = await postJson(
      "/services",
      {
        name: `Filter Test Ritual ${ts}`,
        basePrice: 900,
        durationMinutes: 45,
        isActive: true,
      },
      ownerHeaders
    );
    testServiceId = newServiceRes.data.data?.id;
    record("TEST 1.1", "Create Test Service", newServiceRes.status === 201 && !!testServiceId, `Created service ID: ${testServiceId}`);

    // Toggle to inactive
    const toggleOff = await patchJson(`/services/${testServiceId}/toggle-status`, {}, ownerHeaders);
    const toggledService = toggleOff.data.data?.service || toggleOff.data.data;
    record("TEST 1.2", "Toggle Service Inactive", toggleOff.status === 200 && toggledService?.isActive === false, "Service set to isActive: false");

    // Query status=active
    const activeListRes = await getJson("/services?status=active", ownerHeaders);
    const inActiveList = (activeListRes.data.data || []).some((s: any) => s.id === testServiceId);
    record("TEST 1.3", "Filter status=active", !inActiveList, "Inactive service correctly omitted from active query");

    // Query status=inactive
    const inactiveListRes = await getJson("/services?status=inactive", ownerHeaders);
    const inInactiveList = (inactiveListRes.data.data || []).some((s: any) => s.id === testServiceId);
    record("TEST 1.4", "Filter status=inactive", inInactiveList, "Inactive service correctly returned in inactive query");

    // Query status=all
    const allListRes = await getJson("/services?status=all", ownerHeaders);
    const inAllList = (allListRes.data.data || []).some((s: any) => s.id === testServiceId);
    record("TEST 1.5", "Filter status=all", inAllList, "Service present in status=all query");

    // Toggle back to active
    await patchJson(`/services/${testServiceId}/toggle-status`, {}, ownerHeaders);

    // -----------------------------------------------------------------
    // TEST 2: Dynamic Categories (Owner vs Branch Admin)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 2: Dynamic Category Creation & Governance ---");

    // Owner creates category -> immediately APPROVED
    const ownerCatRes = await postJson(
      "/services/categories",
      {
        name: ownerCategoryName,
        nameAm: "የባለቤት ምድብ",
        description: "Curated by owner",
      },
      ownerHeaders
    );
    record(
      "TEST 2.1",
      "Owner Category Creation",
      ownerCatRes.status === 201 && ownerCatRes.data.data?.status === "APPROVED",
      `Owner category created with status: ${ownerCatRes.data.data?.status}`
    );

    // Branch Admin creates category -> PENDING_APPROVAL
    const branchCatRes = await postJson(
      "/services/categories",
      {
        name: branchCategoryName,
        nameAm: "የቅርንጫፍ ምድብ",
        description: "Branch proposal",
        reason: "Client demand for holistic therapies",
      },
      adminHeaders
    );
    const branchCat = branchCatRes.data.data;
    record(
      "TEST 2.2",
      "Branch Admin Category Proposal",
      branchCatRes.status === 201 && branchCat?.status === "PENDING_APPROVAL",
      `Branch category created with status: ${branchCat?.status}`
    );

    // Verify GovernanceRequest logged for the category
    const catGovReq = await prisma.governanceRequest.findFirst({
      where: {
        type: "CATEGORY_CREATION",
        branchId: boleBranch.id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });
    record(
      "TEST 2.3",
      "GovernanceRequest Logged",
      !!catGovReq,
      `GovernanceRequest ID: ${catGovReq?.id}`
    );

    // Verify Notification generated for Owner
    const ownerNotifForCat = await prisma.notification.findFirst({
      where: {
        type: "GOVERNANCE_REQUEST",
        title: { contains: "Category" },
      },
      orderBy: { createdAt: "desc" },
    });
    record(
      "TEST 2.4",
      "Owner Notified of Category Proposal",
      !!ownerNotifForCat,
      `Notification ID: ${ownerNotifForCat?.id}, Message: ${ownerNotifForCat?.message}`
    );

    // -----------------------------------------------------------------
    // TEST 3: Change Approval Workflow (Price Update Proposal & Review)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 3: Price Update Proposal & Owner Review Flow ---");

    // Branch Admin submits branch price override for approval
    const priceProposalRes = await postJson(
      `/services/${testServiceId}/branch-price`,
      {
        branchId: boleBranch.id,
        customPrice: 1350,
        customDurationMinutes: 50,
        reason: "Local equipment & specialist rate adjustment",
        submitForApproval: true,
      },
      adminHeaders
    );

    const proposalResult = priceProposalRes.data.data || priceProposalRes.data;
    record(
      "TEST 3.1",
      "Branch Admin Price Override Proposal",
      priceProposalRes.status === 200 && proposalResult?.pendingApproval === true,
      `Submitted for approval: ${proposalResult?.message}`
    );

    const priceGovReq = await prisma.governanceRequest.findFirst({
      where: {
        type: "PRICE_UPDATE",
        branchId: boleBranch.id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });
    record(
      "TEST 3.2",
      "Price GovernanceRequest Logged",
      !!priceGovReq,
      `GovernanceRequest ID: ${priceGovReq?.id}, Reason: ${priceGovReq?.reason}`
    );

    // Owner reviews and APPROVES the request
    const reviewRes = await postJson(
      `/admin/governance/${priceGovReq!.id}/review`,
      {
        decision: "APPROVE",
        reviewNote: "Approved for Bole location based on local demand",
      },
      ownerHeaders
    );

    record(
      "TEST 3.3",
      "Owner Reviews and Approves Proposal",
      reviewRes.status === 200 && reviewRes.data.data?.status === "APPROVED",
      `Review status: ${reviewRes.data.data?.status}`
    );

    // Verify live branch price was updated
    const updatedBranchPrice = await prisma.branchServicePrice.findUnique({
      where: {
        branchId_serviceId: {
          branchId: boleBranch.id,
          serviceId: testServiceId,
        },
      },
    });
    record(
      "TEST 3.4",
      "Live Branch Price Applied",
      Number(updatedBranchPrice?.customPrice) === 1350,
      `Branch price updated to: ${updatedBranchPrice?.customPrice} ETB`
    );

    // Verify ServicePriceHistory audit record created
    const priceHistory = await prisma.servicePriceHistory.findFirst({
      where: {
        serviceId: testServiceId,
        branchId: boleBranch.id,
      },
      orderBy: { effectiveFrom: "desc" },
    });
    record(
      "TEST 3.5",
      "ServicePriceHistory Audit Trail Created",
      !!priceHistory && Number(priceHistory.price) === 1350,
      `PriceHistory: ${priceHistory?.price} ETB, Reason: ${priceHistory?.reason}`
    );

    // Verify Branch Admin received approval notification
    const adminApprovalNotice = await prisma.notification.findFirst({
      where: {
        userId: adminUser.id,
        type: "APPROVAL_NOTICE",
      },
      orderBy: { createdAt: "desc" },
    });
    record(
      "TEST 3.6",
      "Branch Admin Receives Approval Notice",
      !!adminApprovalNotice,
      `Admin Notice: ${adminApprovalNotice?.title} - ${adminApprovalNotice?.message}`
    );

    // -----------------------------------------------------------------
    // TEST 4: Owner Direct Mutation (Notifies Branch Admin)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 4: Owner Direct Mutation ---");
    const directMutationRes = await postJson(
      `/services/${testServiceId}/branch-price`,
      {
        branchId: boleBranch.id,
        customPrice: 1400,
        reason: "Owner direct corporate price revision",
      },
      ownerHeaders
    );

    record(
      "TEST 4.1",
      "Owner Direct Price Mutation",
      directMutationRes.status === 200,
      "Price mutated directly by Owner"
    );

    // Verify Branch Admin received OWNER_MUTATION notice
    const ownerMutationNotice = await prisma.notification.findFirst({
      where: {
        branchId: boleBranch.id,
        type: "OWNER_MUTATION",
      },
      orderBy: { createdAt: "desc" },
    });
    record(
      "TEST 4.2",
      "Branch Admin Receives OWNER_MUTATION Notice",
      !!ownerMutationNotice,
      `Notice: ${ownerMutationNotice?.title} - ${ownerMutationNotice?.message}`
    );

    // -----------------------------------------------------------------
    // TEST 5: Customer Read Isolation (Active & Approved Only)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 5: Customer Read Isolation ---");

    // Make test service inactive
    await patchJson(`/services/${testServiceId}/toggle-status`, {}, ownerHeaders);

    // Query services as unauthenticated customer
    const publicServicesRes = await getJson("/services");
    const publicServices = publicServicesRes.data.data || [];
    const publicFoundInactive = publicServices.some((s: any) => s.id === testServiceId);
    record(
      "TEST 5.1",
      "Customer Services Isolation",
      !publicFoundInactive,
      "Inactive service is completely hidden from customer queries"
    );

    // Query categories as unauthenticated customer
    const publicCategoriesRes = await getJson("/services/categories");
    const publicCategories = publicCategoriesRes.data.data || [];
    const publicFoundPendingCat = publicCategories.some((c: any) => c.name === branchCategoryName);
    record(
      "TEST 5.2",
      "Customer Categories Isolation",
      !publicFoundPendingCat,
      "Pending-approval category is completely hidden from customer queries"
    );

    // -----------------------------------------------------------------
    // TEST 6: Notification Lifecycle (Fetch, Read, Read-All)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 6: Notification System Endpoints ---");

    const getNotifsRes = await getJson("/notifications", ownerHeaders);
    const notifs = getNotifsRes.data.data || [];
    record(
      "TEST 6.1",
      "List Notifications",
      getNotifsRes.status === 200 && Array.isArray(notifs),
      `Fetched ${notifs.length} notifications for Owner`
    );

    if (notifs.length > 0) {
      const targetNotif = notifs[0];
      const markSingleRes = await patchJson(`/notifications/${targetNotif.id}/read`, {}, ownerHeaders);
      record(
        "TEST 6.2",
        "Mark Single Notification as Read",
        markSingleRes.status === 200 && markSingleRes.data.data?.isRead === true,
        `Notification ${targetNotif.id} marked as read`
      );

      const markAllRes = await patchJson("/notifications/read-all", {}, ownerHeaders);
      record(
        "TEST 6.3",
        "Mark All Notifications Read",
        markAllRes.status === 200,
        `Mark all result: ${markAllRes.data.message}`
      );
    }

  } catch (err: any) {
    console.error("Audit encounter unexpected error:", err);
    record("FATAL", "Audit Runtime Exception", false, err.message);
  } finally {
    // Cleanup temporary test service and categories
    if (testServiceId) {
      await prisma.servicePriceHistory.deleteMany({ where: { serviceId: testServiceId } });
      await prisma.branchServicePrice.deleteMany({ where: { serviceId: testServiceId } });
      await prisma.branchService.deleteMany({ where: { serviceId: testServiceId } });
      await prisma.service.delete({ where: { id: testServiceId } }).catch(() => {});
    }
    await prisma.serviceCategory.deleteMany({
      where: { name: { in: [ownerCategoryName, branchCategoryName] } },
    }).catch(() => {});
    await prisma.$disconnect();
  }

  // Summary
  console.log("\n==========================================================================");
  console.log(" AUDIT SUMMARY");
  console.log("==========================================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`TOTAL TESTS : ${results.length}`);
  console.log(`PASSED      : ${passedCount}`);
  console.log(`FAILED      : ${failedCount}`);

  if (failedCount > 0) {
    console.error("\n❌ AUDIT FAILED!");
    process.exit(1);
  } else {
    console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY!");
  }
}

runAudit();
