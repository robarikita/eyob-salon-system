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

async function deleteJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function runAudit() {
  console.log("==========================================================================");
  console.log(" EYOB SALON — SERVICE GOVERNANCE & REMEDIATION VERIFICATION AUDIT ");
  console.log("==========================================================================\n");

  const ts = Date.now();
  const createdServiceIds: string[] = [];
  const createdCategoryIds: string[] = [];

  try {
    // -----------------------------------------------------------------
    // SETUP: Authenticate Owner and Branch Admin
    // -----------------------------------------------------------------
    console.log("--- SETUP: Authenticating Credentials ---");
    const ownerLogin = await postJson("/auth/login", {
      identifier: "owner@eyobsalon.com",
      password: "Owner@123",
      role: "OWNER",
    });
    const ownerToken = ownerLogin.data.data?.tokens?.accessToken || ownerLogin.data.data?.accessToken;
    if (!ownerToken) throw new Error("Owner login failed");
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    record("SETUP", "Owner Login", true, "Owner authenticated with JWT.");

    // Authenticate Branch Admin (Bole)
    const adminLogin = await postJson("/auth/login", {
      identifier: "admin.bole@eyobsalon.com",
      password: "Admin@123",
      role: "BRANCH_ADMIN",
    });
    const adminToken = adminLogin.data.data?.tokens?.accessToken || adminLogin.data.data?.accessToken;
    if (!adminToken) throw new Error("Branch Admin login failed");
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const adminUser = adminLogin.data.data?.user;
    record("SETUP", "Branch Admin Login", true, `Branch Admin (${adminUser.email}) authenticated.`);

    // Find Bole branch
    const boleBranch = await prisma.branch.findFirst({
      where: { id: adminUser.branchId },
    });
    if (!boleBranch) throw new Error("Bole branch not found");

    // -----------------------------------------------------------------
    // TEST 1: Service Toggle Bug Remediation
    // -----------------------------------------------------------------
    console.log("\n--- TEST 1: Service Status Toggle Response Shape ---");
    const test1ServiceRes = await postJson("/services", {
      name: `Toggle Test Ritual ${ts}`,
      nameAm: `የመቀያየሪያ ሙከራ ${ts}`,
      code: `TT-${ts % 10000}`,
      category: "HAIR",
      basePrice: 850,
      durationMinutes: 45,
      requiredProtocols: ["Thermal Armor"],
    }, ownerHeaders);

    const test1Service = test1ServiceRes.data.data?.service || test1ServiceRes.data.data;
    if (!test1Service?.id) throw new Error(`Failed to create test service for toggle: ${JSON.stringify(test1ServiceRes.data)}`);
    createdServiceIds.push(test1Service.id);

    // Toggle Off
    const toggleOffRes = await patchJson(`/services/${test1Service.id}/toggle-status`, {}, ownerHeaders);
    const toggledOffService = toggleOffRes.data.service || toggleOffRes.data.data?.service || toggleOffRes.data.data;
    const isToggledOff = toggleOffRes.status === 200 && toggledOffService?.isActive === false;
    record(
      "TEST 1.1",
      "Toggle Status to Inactive",
      isToggledOff,
      `Status: ${toggleOffRes.status}, returned isActive: ${toggledOffService?.isActive}`
    );

    // Toggle back On
    const toggleOnRes = await patchJson(`/services/${test1Service.id}/toggle-status`, {}, ownerHeaders);
    const toggledOnService = toggleOnRes.data.service || toggleOnRes.data.data?.service || toggleOnRes.data.data;
    const isToggledOn = toggleOnRes.status === 200 && toggledOnService?.isActive === true;
    record(
      "TEST 1.2",
      "Toggle Status back to Active",
      isToggledOn,
      `Status: ${toggleOnRes.status}, returned isActive: ${toggledOnService?.isActive}`
    );

    // -----------------------------------------------------------------
    // TEST 2: Permanent Service Delete Flow & Cascade Cleanliness
    // -----------------------------------------------------------------
    console.log("\n--- TEST 2: Permanent Service Delete Cascade ---");
    const test2ServiceRes = await postJson("/services", {
      name: `Delete Test Ritual ${ts}`,
      nameAm: `የመሰረዝ ሙከራ ${ts}`,
      code: `DT-${ts % 10000}`,
      category: "FACIAL",
      basePrice: 1200,
      durationMinutes: 60,
      requiredProtocols: ["Cryo Roller"],
    }, ownerHeaders);

    const test2Service = test2ServiceRes.data.data?.service || test2ServiceRes.data.data;
    if (!test2Service?.id) throw new Error("Failed to create test service for delete test");

    // Add branch override and history
    await prisma.branchServicePrice.upsert({
      where: {
        branchId_serviceId: {
          branchId: boleBranch.id,
          serviceId: test2Service.id,
        },
      },
      update: {
        customPrice: 1350,
        isActive: true,
      },
      create: {
        branchId: boleBranch.id,
        serviceId: test2Service.id,
        customPrice: 1350,
        isActive: true,
      },
    });

    await prisma.servicePriceHistory.create({
      data: {
        serviceId: test2Service.id,
        branchId: boleBranch.id,
        price: 1350,
        changedBy: "Owner",
        reason: "Initial override",
      },
    });

    // Execute DELETE /services/:id
    const deleteRes = await deleteJson(`/services/${test2Service.id}`, ownerHeaders);
    const isDeleteSuccess = deleteRes.status === 200;
    record("TEST 2.1", "Delete Service Endpoint", isDeleteSuccess, `Status: ${deleteRes.status}, Message: ${deleteRes.data.message || deleteRes.data.data?.message}`);

    // Verify DB eradication
    const dbService = await prisma.service.findUnique({ where: { id: test2Service.id } });
    const dbPrices = await prisma.branchServicePrice.findMany({ where: { serviceId: test2Service.id } });
    const dbHistory = await prisma.servicePriceHistory.findMany({ where: { serviceId: test2Service.id } });

    const cascadesClean = dbService === null && dbPrices.length === 0 && dbHistory.length === 0;
    record(
      "TEST 2.2",
      "Cascade Eradication in Database",
      cascadesClean,
      `Service: ${dbService ? "Found" : "Deleted"}, BranchPrices: ${dbPrices.length}, History: ${dbHistory.length}`
    );

    // -----------------------------------------------------------------
    // TEST 3: Category Toggle & Public Catalog Exclusion
    // -----------------------------------------------------------------
    console.log("\n--- TEST 3: Category Status Toggle & Ritual Visibility ---");
    const testCategoryRes = await postJson("/services/categories", {
      name: `Category Toggle ${ts}`,
      nameAm: `ምድብ መቀየሪያ ${ts}`,
      description: "Testing category deactivation cascades",
    }, ownerHeaders);

    const testCategory = testCategoryRes.data.data;
    if (!testCategory?.id) throw new Error("Failed to create test category");
    createdCategoryIds.push(testCategory.id);

    // Create service under this category
    const catServiceRes = await postJson("/services", {
      name: `Cat Service ${ts}`,
      nameAm: `የምድብ አገልግሎት ${ts}`,
      code: `CS-${ts % 10000}`,
      categoryId: testCategory.id,
      basePrice: 900,
      durationMinutes: 45,
      requiredProtocols: ["Glow Mask"],
    }, ownerHeaders);

    const catService = catServiceRes.data.data?.service || catServiceRes.data.data;
    if (!catService?.id) throw new Error("Failed to create category service");
    createdServiceIds.push(catService.id);

    // Public list should include catService
    const publicList1 = await getJson(`/services?branchId=${boleBranch.id}`);
    const services1: any[] = publicList1.data.data || [];
    const inPublic1 = services1.some((s) => s.id === catService.id);
    record("TEST 3.1", "Service Visible When Category Active", inPublic1, `Found in public list: ${inPublic1}`);

    // Deactivate Category
    const toggleCatRes = await patchJson(`/services/categories/${testCategory.id}/toggle-status`, {}, ownerHeaders);
    const toggledCategory = toggleCatRes.data.data;
    const catDeactivated = toggleCatRes.status === 200 && toggledCategory?.isActive === false;
    record("TEST 3.2", "Category Deactivation", catDeactivated, `Category isActive: ${toggledCategory?.isActive}`);

    // Public list should now EXCLUDE catService
    const publicList2 = await getJson(`/services?branchId=${boleBranch.id}`);
    const services2: any[] = publicList2.data.data || [];
    const inPublic2 = services2.some((s) => s.id === catService.id);
    record("TEST 3.3", "Service Excluded When Category Inactive", !inPublic2, `Service present in public list: ${inPublic2}`);

    // Reactivate Category
    const reactivateCatRes = await patchJson(`/services/categories/${testCategory.id}/toggle-status`, {}, ownerHeaders);
    const reactivatedCat = reactivateCatRes.data.data;
    const catReactivated = reactivateCatRes.status === 200 && reactivatedCat?.isActive === true;
    record("TEST 3.4", "Category Reactivation", catReactivated, `Category isActive: ${reactivatedCat?.isActive}`);

    // -----------------------------------------------------------------
    // TEST 4: Live Service Search Bar Filter
    // -----------------------------------------------------------------
    console.log("\n--- TEST 4: Service Search Query Filtering ---");
    const uniqueSearchTerm = `UniqueSearchTerm${ts % 10000}`;
    const searchServiceRes = await postJson("/services", {
      name: `Aura ${uniqueSearchTerm} Luxury Treatment`,
      nameAm: `ልዩ ህክምና`,
      code: `US-${ts % 10000}`,
      category: "HAIR",
      basePrice: 1500,
      durationMinutes: 60,
      requiredProtocols: ["Gold Silk"],
    }, ownerHeaders);

    const searchService = searchServiceRes.data.data?.service || searchServiceRes.data.data;
    if (!searchService?.id) throw new Error("Failed to create search test service");
    createdServiceIds.push(searchService.id);

    const searchFilterRes = await getJson(`/services?search=${encodeURIComponent(uniqueSearchTerm)}&branchId=${boleBranch.id}`);
    const searchList: any[] = searchFilterRes.data.data || [];
    const matched = searchList.length === 1 && searchList[0].id === searchService.id;
    record("TEST 4.1", "Public Search Query Exact Match", matched, `Expected 1 match, found ${searchList.length}`);

    // -----------------------------------------------------------------
    // TEST 5: Branch Admin Price Override Workflow (Mandatory Reason & Proposal)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 5: Branch Admin Price Proposal Workflow ---");
    const proposalServiceRes = await postJson("/services", {
      name: `Pricing Proposal Ritual ${ts}`,
      nameAm: `የዋጋ ጥያቄ ሙከራ ${ts}`,
      code: `PR-${ts % 10000}`,
      category: "BODY",
      basePrice: 1000,
      durationMinutes: 60,
      requiredProtocols: ["Hot Stone"],
    }, ownerHeaders);

    const proposalService = proposalServiceRes.data.data?.service || proposalServiceRes.data.data;
    if (!proposalService?.id) throw new Error("Failed to create proposal test service");
    createdServiceIds.push(proposalService.id);

    // 5.1 Branch Admin tries price override WITHOUT reason -> MUST fail with 400
    const failOverrideRes = await postJson(`/services/${proposalService.id}/branch-price`, {
      branchId: boleBranch.id,
      customPrice: 1400,
    }, adminHeaders);

    const failedAsExpected = failOverrideRes.status === 400;
    record(
      "TEST 5.1",
      "Branch Admin Rejection Without Reason",
      failedAsExpected,
      `Status: ${failOverrideRes.status}, Error: ${failOverrideRes.data.message}`
    );

    // 5.2 Branch Admin provides mandatory reason -> Creates GovernanceRequest
    const proposalReason = `Special holiday adjustment for Bole branch ${ts}`;
    const successProposalRes = await postJson(`/services/${proposalService.id}/branch-price`, {
      branchId: boleBranch.id,
      customPrice: 1400,
      reason: proposalReason,
    }, adminHeaders);

    const isProposalSubmitted =
      successProposalRes.status === 200 && successProposalRes.data.pendingApproval === true;
    record(
      "TEST 5.2",
      "Branch Admin Proposal Submission",
      isProposalSubmitted,
      `Status: ${successProposalRes.status}, pendingApproval: ${successProposalRes.data.pendingApproval}`
    );

    // Verify DB: branchServicePrice should NOT be 1400 yet
    const priceBeforeApproval = await prisma.branchServicePrice.findUnique({
      where: {
        branchId_serviceId: {
          branchId: boleBranch.id,
          serviceId: proposalService.id,
        },
      },
    });
    const priceNotUpdated = priceBeforeApproval === null || priceBeforeApproval.customPrice.toNumber() !== 1400;
    record(
      "TEST 5.3",
      "No Direct Mutation Before Approval",
      priceNotUpdated,
      `Live Branch Price: ${priceBeforeApproval?.customPrice ?? "None"}`
    );

    // Verify GovernanceRequest in DB
    const govRequest = await prisma.governanceRequest.findFirst({
      where: {
        branchId: boleBranch.id,
        type: "PRICE_UPDATE",
        status: "PENDING",
        reason: proposalReason,
      },
      orderBy: { createdAt: "desc" },
    });
    const govRequestCreated = govRequest !== null && (govRequest.payload as any)?.customPrice === 1400;
    record(
      "TEST 5.4",
      "Governance Request Recorded in DB",
      govRequestCreated,
      `Request ID: ${govRequest?.id}, Type: ${govRequest?.type}`
    );

    // Verify Owner received notification
    const ownerNotification = await prisma.notification.findFirst({
      where: {
        type: "GOVERNANCE_REQUEST",
        title: { contains: "Price Proposal" },
      },
      orderBy: { createdAt: "desc" },
    });
    record(
      "TEST 5.5",
      "Owner Notified of Proposal",
      ownerNotification !== null,
      `Notification: "${ownerNotification?.title}"`
    );

    // -----------------------------------------------------------------
    // TEST 6: Owner Approval & Notification Dispatch
    // -----------------------------------------------------------------
    console.log("\n--- TEST 6: Owner Proposal Review & Admin Notification ---");
    if (!govRequest) throw new Error("Cannot run Test 6: Governance request not found");

    const reviewRes = await postJson(`/admin/governance/${govRequest.id}/review`, {
      decision: "APPROVE",
      reviewNote: "Approved by Owner for holiday season",
    }, ownerHeaders);

    const isApproved = reviewRes.status === 200 && reviewRes.data.success === true;
    record("TEST 6.1", "Owner Approval Endpoint", isApproved, `Status: ${reviewRes.status}`);

    // Verify DB: branchServicePrice is NOW updated to 1400 ETB
    const priceAfterApproval = await prisma.branchServicePrice.findUnique({
      where: {
        branchId_serviceId: {
          branchId: boleBranch.id,
          serviceId: proposalService.id,
        },
      },
    });
    const priceUpdated = priceAfterApproval !== null && priceAfterApproval.customPrice.toNumber() === 1400;
    record(
      "TEST 6.2",
      "Live Price Applied Post-Approval",
      priceUpdated,
      `Live Custom Price: ${priceAfterApproval?.customPrice}`
    );

    // Verify Branch Admin received notification with exact title "Price Approved / ጸድቋል"
    const adminNotification = await prisma.notification.findFirst({
      where: {
        userId: adminUser.id,
        type: "APPROVAL_NOTICE",
        title: { contains: "Price Approved / ጸድቋል" },
      },
      orderBy: { createdAt: "desc" },
    });
    record(
      "TEST 6.3",
      "Branch Admin Notification Received",
      adminNotification !== null,
      `Notification Title: "${adminNotification?.title}"`
    );

  } catch (err: any) {
    record("ERROR", "Unhandled Exception", false, err.message || String(err));
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------
    console.log("\n--- CLEANUP: Removing Test Entities ---");
    for (const sid of createdServiceIds) {
      try {
        await prisma.servicePriceHistory.deleteMany({ where: { serviceId: sid } });
        await prisma.branchServicePrice.deleteMany({ where: { serviceId: sid } });
        await prisma.branchService.deleteMany({ where: { serviceId: sid } });
        await prisma.employeeService.deleteMany({ where: { serviceId: sid } });
        await prisma.service.delete({ where: { id: sid } });
      } catch {}
    }
    for (const cid of createdCategoryIds) {
      try {
        await prisma.service.updateMany({ where: { categoryId: cid }, data: { categoryId: null } });
        await prisma.serviceCategory.delete({ where: { id: cid } });
      } catch {}
    }
    await prisma.$disconnect();

    console.log("\n==========================================================================");
    console.log(" AUDIT SUMMARY");
    console.log("==========================================================================");
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`Passed: ${passedCount}/${totalCount} (${Math.round((passedCount / totalCount) * 100)}%)\n`);

    if (passedCount !== totalCount) {
      console.error("❌ Some verification checks failed!");
      process.exit(1);
    } else {
      console.log("✅ ALL VERIFICATION GATES PASSED PERFECTLY!");
      process.exit(0);
    }
  }
}

runAudit();
