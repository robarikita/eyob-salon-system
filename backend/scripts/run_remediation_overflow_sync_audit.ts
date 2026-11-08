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

const ts = Date.now();
const testRunIp = `198.51.100.${(ts % 200) + 10}`;

async function postJson(endpoint: string, data: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-test-ip": testRunIp, ...headers },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function patchJson(endpoint: string, data: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-test-ip": testRunIp, ...headers },
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
  console.log(" EYOB SALON — NUMERIC OVERFLOW 22003, CATALOG PARITY & CASCADE AUDIT ");
  console.log("==========================================================================\n");

  const createdCategoryIds: string[] = [];
  const createdServiceIds: string[] = [];
  const createdGovRequestIds: string[] = [];

  try {
    // -----------------------------------------------------------------
    // SETUP: Discover Branches & Authenticate Base Actors
    // -----------------------------------------------------------------
    console.log("--- SETUP: Identifying Core Actors & Sanctuary Branches ---");
    const boleBranch = await prisma.branch.findFirst({
      where: { name: { contains: "Bole" } },
    });
    const kazanchisBranch = await prisma.branch.findFirst({
      where: { name: { contains: "Kazanchis" } },
    });

    if (!boleBranch || !kazanchisBranch) {
      throw new Error("Required branches (Bole Bulbula and Kazanchis) not found in database.");
    }
    record("SETUP", "Branch Discovery", true, `Bole: ${boleBranch.name}, Kazanchis: ${kazanchisBranch.name}`);

    // Login Owner
    const ownerLogin = await postJson("/auth/login", {
      identifier: "owner@eyobsalon.com",
      password: "Owner@123",
      role: "OWNER",
    });
    const ownerToken = ownerLogin.data?.data?.tokens?.accessToken || ownerLogin.data?.data?.accessToken || ownerLogin.data?.token;
    if (!ownerToken) throw new Error("Failed to authenticate Owner: " + JSON.stringify(ownerLogin.data));
    const ownerAuth = { Authorization: `Bearer ${ownerToken}` };
    record("SETUP", "Owner Auth", true, "Owner authenticated with JWT token.");

    // Login Bole Branch Admin
    const adminLogin = await postJson("/auth/login", {
      identifier: "admin.bole@eyobsalon.com",
      password: "Admin@123",
      role: "BRANCH_ADMIN",
    });
    const adminToken = adminLogin.data?.data?.tokens?.accessToken || adminLogin.data?.data?.accessToken || adminLogin.data?.token;
    if (!adminToken) throw new Error("Failed to authenticate Branch Admin: " + JSON.stringify(adminLogin.data));
    const adminAuth = { Authorization: `Bearer ${adminToken}` };
    record("SETUP", "Admin Auth", true, "Branch Admin authenticated with JWT token.");

    // -----------------------------------------------------------------
    // TEST 1: Numeric Overflow 22003 Prevention & Safe Bounding
    // -----------------------------------------------------------------
    console.log("\n--- TEST 1: Postgres 22003 Overflow Fix & Decimal Precision ---");

    // Create a base service for testing proposal approval
    const testService1 = await prisma.service.create({
      data: {
        code: `RIT-OVF-${ts % 10000}`,
        slug: `overflow-test-ritual-${ts}`,
        name: `Overflow Test Ritual ${ts}`,
        nameAm: "የሙከራ አገልግሎት",
        category: "Hair Styling & Couture",
        durationMinutes: 60,
        basePrice: 1200.0,
        depositType: "NONE",
        approvalStatus: "APPROVED",
        isActive: true,
      },
    });
    createdServiceIds.push(testService1.id);

    // Create proposal with varied decimal inputs that would cause Postgres 22003 if unhandled
    const govReqOverflow = await prisma.governanceRequest.create({
      data: {
        type: "PRICE_UPDATE",
        status: "PENDING",
        branchId: boleBranch.id,
        requestedBy: adminLogin.data?.data?.user?.id || (await prisma.user.findFirst({ where: { role: "BRANCH_ADMIN" } }))!.id,
        reason: "VIP Surge Tier with complex decimals",
        payload: {
          serviceId: testService1.id,
          branchId: boleBranch.id,
          serviceName: testService1.name,
          categoryName: testService1.category,
          currentBasePrice: 1200.0,
          currentBranchPrice: 1200.0,
          // Unbounded raw decimals:
          customPrice: 1450.78912345,
          customDurationMinutes: "75",
          depositType: "PERCENTAGE",
          depositValue: "25.678912",
        },
      },
    });
    createdGovRequestIds.push(govReqOverflow.id);

    // Review proposal by Owner (Approve)
    const reviewRes = await postJson(
      `/admin/governance/${govReqOverflow.id}/review`,
      { decision: "APPROVE", reviewNote: "Precision testing approval" },
      ownerAuth
    );
    record(
      "TEST 1.1",
      "Owner Review Without Postgres 22003 Error",
      reviewRes.status === 200 && reviewRes.data?.success === true,
      `Status: ${reviewRes.status}, Message: ${reviewRes.data?.message || "Success"}`
    );

    // Verify PostgreSQL stored clean Decimal(10, 2) values
    const storedPrice = await prisma.branchServicePrice.findUnique({
      where: {
        branchId_serviceId: {
          branchId: boleBranch.id,
          serviceId: testService1.id,
        },
      },
    });
    const priceNum = storedPrice ? Number(storedPrice.customPrice) : 0;
    const depositNum = storedPrice && storedPrice.depositValue ? Number(storedPrice.depositValue) : 0;

    record(
      "TEST 1.2",
      "PostgreSQL Decimal(10,2) Precision Check",
      priceNum === 1450.79 && depositNum === 25.68 && storedPrice?.customDurationMinutes === 75,
      `Stored Price: ${priceNum} (expected 1450.79), Deposit: ${depositNum} (expected 25.68), Duration: ${storedPrice?.customDurationMinutes}m`
    );

    // Verify Price History Record was committed inside transaction
    const historyEntry = await prisma.servicePriceHistory.findFirst({
      where: { serviceId: testService1.id, branchId: boleBranch.id },
      orderBy: { createdAt: "desc" },
    });
    record(
      "TEST 1.3",
      "Transactional Price History Commit",
      historyEntry !== null && Number(historyEntry.price) === 1450.79,
      `History price: ${historyEntry ? Number(historyEntry.price) : "none"}, Reason: "${historyEntry?.reason}"`
    );

    // -----------------------------------------------------------------
    // TEST 2: Enriched Governance Request Dossier
    // -----------------------------------------------------------------
    console.log("\n--- TEST 2: Enriched Governance Request Dossier Submission ---");

    // Branch Admin submits a price update proposal via standard endpoint
    const proposalRes = await postJson(
      `/services/${testService1.id}/branch-price`,
      {
        branchId: boleBranch.id,
        customPrice: 1650.0,
        customDurationMinutes: 80,
        depositType: "PERCENTAGE",
        depositValue: 30,
        reason: "Specialty bridal surge pricing with enriched dossier",
      },
      adminAuth
    );

    record(
      "TEST 2.1",
      "Branch Admin Proposal Submission",
      proposalRes.status === 200 || proposalRes.status === 201,
      `Status: ${proposalRes.status}, GovReqId: ${proposalRes.data?.governanceRequestId || proposalRes.data?.data?.governanceRequestId}`
    );

    const newGovReqId = proposalRes.data?.governanceRequestId || proposalRes.data?.data?.governanceRequestId;
    if (newGovReqId) createdGovRequestIds.push(newGovReqId);

    // Inspect the persisted GovernanceRequest
    const inspectedGovReq = await prisma.governanceRequest.findUnique({
      where: { id: newGovReqId },
    });
    const govPayload: any = inspectedGovReq?.payload;

    record(
      "TEST 2.2",
      "Enriched Dossier Metadata Verification",
      Boolean(
        govPayload &&
        govPayload.serviceName === testService1.name &&
        govPayload.proposedPrice === 1650 &&
        govPayload.currentPrice !== undefined &&
        govPayload.categoryName !== undefined
      ),
      `serviceName: "${govPayload?.serviceName}", categoryName: "${govPayload?.categoryName}", currentPrice: ${govPayload?.currentPrice}, proposedPrice: ${govPayload?.proposedPrice}`
    );

    // -----------------------------------------------------------------
    // TEST 3: Catalog Parity Between Home Showcase and /book
    // -----------------------------------------------------------------
    console.log("\n--- TEST 3: Catalog Parity (Home Showcase vs /book) ---");

    // Query unauthenticated home showcase GET /api/v1/services
    const homeCatalog = await getJson("/services");
    const homeServices: any[] = homeCatalog.data?.services || homeCatalog.data?.data || homeCatalog.data || [];

    // Query active booking catalog GET /api/v1/services?status=active
    const bookCatalog = await getJson("/services?status=active");
    const bookServices: any[] = bookCatalog.data?.services || bookCatalog.data?.data || bookCatalog.data || [];

    const homeIds = homeServices.map((s) => s.id).sort();
    const bookIds = bookServices.map((s) => s.id).sort();
    const countsMatch = homeIds.length === bookIds.length;
    const idsMatch = countsMatch && homeIds.every((id, idx) => id === bookIds[idx]);

    record(
      "TEST 3.1",
      "Unified Catalog Fetching Parity",
      countsMatch && idsMatch,
      `Home count: ${homeServices.length}, Book count: ${bookServices.length}, 100% ID Parity: ${idsMatch}`
    );

    // -----------------------------------------------------------------
    // TEST 4: Category Deactivation Cascade & Reactivation
    // -----------------------------------------------------------------
    console.log("\n--- TEST 4: Category Deactivation Cascade & Branch Exception ---");

    // 4.1 Create test Category
    const categorySlug = `cascade-test-cat-${ts}`;
    const testCategory = await prisma.serviceCategory.create({
      data: {
        name: `Cascade Test Category ${ts}`,
        nameAm: "የሙከራ ምድብ",
        slug: categorySlug,
        isActive: true,
        status: "APPROVED",
      },
    });
    createdCategoryIds.push(testCategory.id);

    // 4.2 Create test Service under Category
    const cascadeService = await prisma.service.create({
      data: {
        code: `RIT-CAS-${ts % 10000}`,
        slug: `cascade-test-ritual-${ts}`,
        name: `Cascade Test Ritual ${ts}`,
        nameAm: "የካስኬድ አገልግሎት",
        category: testCategory.name,
        categoryId: testCategory.id,
        durationMinutes: 45,
        basePrice: 950.0,
        approvalStatus: "APPROVED",
        isActive: true,
      },
    });
    createdServiceIds.push(cascadeService.id);

    // Verify service is present in active catalog
    const initialCatalog = await getJson("/services?status=active");
    const initialList: any[] = initialCatalog.data?.services || initialCatalog.data?.data || [];
    const initiallyFound = initialList.some((s) => s.id === cascadeService.id);
    record(
      "TEST 4.1",
      "Service Present in Catalog With Active Category",
      initiallyFound,
      `Service ${cascadeService.name} found in active catalog: ${initiallyFound}`
    );

    // 4.3 Deactivate Category
    await prisma.serviceCategory.update({
      where: { id: testCategory.id },
      data: { isActive: false },
    });

    // Query catalog without branch filter -> Must be excluded
    const postDeactivationCatalog = await getJson("/services?status=active");
    const postDeactList: any[] = postDeactivationCatalog.data?.services || postDeactivationCatalog.data?.data || [];
    const foundAfterCatDeactivation = postDeactList.some((s) => s.id === cascadeService.id);

    record(
      "TEST 4.2",
      "Category Deactivation Cascade Excludes Child Services",
      !foundAfterCatDeactivation,
      `Service hidden from catalog when category isActive=false: ${!foundAfterCatDeactivation}`
    );

    // 4.4 Branch Exception Support:
    // When a branch explicitly has an active branch price override, it can retain the service
    await prisma.branchServicePrice.upsert({
      where: {
        branchId_serviceId: {
          branchId: kazanchisBranch.id,
          serviceId: cascadeService.id,
        },
      },
      update: {
        customPrice: 1100.0,
        isActive: true,
      },
      create: {
        branchId: kazanchisBranch.id,
        serviceId: cascadeService.id,
        customPrice: 1100.0,
        isActive: true,
      },
    });

    await prisma.servicePriceHistory.create({
      data: {
        serviceId: cascadeService.id,
        branchId: kazanchisBranch.id,
        price: 1100.0,
        changedBy: (await prisma.user.findFirst({ where: { role: "OWNER" } }))!.id,
        reason: "Approved branch exception for Kazanchis",
      },
    });

    const branchExceptionCatalog = await getJson(`/services?status=active&branchId=${kazanchisBranch.id}`);
    const branchList: any[] = branchExceptionCatalog.data?.services || branchExceptionCatalog.data?.data || [];
    const foundUnderBranchException = branchList.some((s) => s.id === cascadeService.id);

    record(
      "TEST 4.3",
      "Branch Exception Retains Service For Active Branch",
      foundUnderBranchException,
      `Service retained for Kazanchis branch exception: ${foundUnderBranchException}`
    );

    // 4.5 Reactivate Category -> Must reappear in global catalog
    await prisma.serviceCategory.update({
      where: { id: testCategory.id },
      data: { isActive: true },
    });

    const postReactivationCatalog = await getJson("/services?status=active");
    const postReactList: any[] = postReactivationCatalog.data?.services || postReactivationCatalog.data?.data || [];
    const foundAfterReactivation = postReactList.some((s) => s.id === cascadeService.id);

    record(
      "TEST 4.4",
      "Category Reactivation Restores Child Services",
      foundAfterReactivation,
      `Service reappeared immediately after category reactivated: ${foundAfterReactivation}`
    );

  } catch (error: any) {
    console.error("\n❌ AUDIT EXECUTION FAILED WITH ERROR:", error);
    record("FATAL", "Execution Aborted", false, error.message);
  } finally {
    console.log("\n--- CLEANUP: Removing Audit Test Artifacts ---");
    try {
      if (createdGovRequestIds.length > 0) {
        await prisma.governanceRequest.deleteMany({
          where: { id: { in: createdGovRequestIds } },
        });
      }
      if (createdServiceIds.length > 0) {
        await prisma.servicePriceHistory.deleteMany({
          where: { serviceId: { in: createdServiceIds } },
        });
        await prisma.branchServicePrice.deleteMany({
          where: { serviceId: { in: createdServiceIds } },
        });
        await prisma.service.deleteMany({
          where: { id: { in: createdServiceIds } },
        });
      }
      if (createdCategoryIds.length > 0) {
        await prisma.serviceCategory.deleteMany({
          where: { id: { in: createdCategoryIds } },
        });
      }
      console.log("✓ Audit cleanup completed.");
    } catch (cleanErr) {
      console.error("Cleanup warning:", cleanErr);
    }
    await prisma.$disconnect();
  }

  // -----------------------------------------------------------------
  // RESULTS SCORECARD
  // -----------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log(" AUDIT RESULTS SCORECARD");
  console.log("==========================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total:  ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Rate:   ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed === 0) {
    console.log("✅ ALL REMEDIATION & HARMONIZATION AUDIT CHECKS PASSED WITH 100% SUCCESS!\n");
  } else {
    console.error("❌ AUDIT FAILURES DETECTED! Review output above.\n");
    process.exit(1);
  }
}

runAudit();
