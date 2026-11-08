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

async function getJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function runAudit() {
  console.log("==========================================================================");
  console.log(" EYOB SALON — ROLE AUTH, MULTI-BRANCH PRICING & GOVERNANCE AUDIT ");
  console.log("==========================================================================\n");

  const ts = Date.now();
  const createdServiceIds: string[] = [];
  const testCustomerEmail = `patron.audit.${ts}@eyobtest.com`;
  const testCustomerPhone = `+2519${(ts % 100000000).toString().padStart(8, "0")}`;

  try {
    // -----------------------------------------------------------------
    // SETUP: Discover Branches & Authenticate Base Actors
    // -----------------------------------------------------------------
    console.log("--- SETUP: Identifying Core Sanctuary Branches ---");
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

    // Create / ensure customer account for Test 1
    const customerRegister = await postJson("/auth/register", {
      firstName: "Hanna",
      lastName: "Solomon",
      email: testCustomerEmail,
      phone: testCustomerPhone,
      password: "Customer@123",
    });
    record("SETUP", "Customer Registration", customerRegister.status === 201 || customerRegister.status === 200, `Registered customer: ${testCustomerEmail}`);

    // -----------------------------------------------------------------
    // TEST 1: Strict Role-Guarded Authentication
    // -----------------------------------------------------------------
    console.log("\n--- TEST 1: Strict Role-Guarded Authentication ---");

    // 1.1 Attempt logging in as Owner on CUSTOMER tab -> MUST fail with 401
    const ownerOnCustomerTab = await postJson("/auth/login", {
      identifier: "owner@eyobsalon.com",
      password: "Owner@123",
      role: "CUSTOMER",
    });
    const ownerBlockedOnCustomer =
      ownerOnCustomerTab.status === 401 &&
      (ownerOnCustomerTab.data.message?.includes("Invalid credentials for this account role") ||
       ownerOnCustomerTab.data.message?.includes("ለዚህ ሚና የተሳሳተ መለያ"));
    record(
      "TEST 1.1",
      "Owner Login on CUSTOMER Tab Blocked",
      ownerBlockedOnCustomer,
      `Status: ${ownerOnCustomerTab.status}, Error: "${ownerOnCustomerTab.data.message}"`
    );

    // 1.2 Attempt logging in as Branch Admin on OWNER tab -> MUST fail with 401
    const adminOnOwnerTab = await postJson("/auth/login", {
      identifier: "admin.bole@eyobsalon.com",
      password: "Admin@123",
      role: "OWNER",
    });
    const adminBlockedOnOwner =
      adminOnOwnerTab.status === 401 &&
      (adminOnOwnerTab.data.message?.includes("Invalid credentials for this account role") ||
       adminOnOwnerTab.data.message?.includes("ለዚህ ሚና የተሳሳተ መለያ"));
    record(
      "TEST 1.2",
      "Branch Admin Login on OWNER Tab Blocked",
      adminBlockedOnOwner,
      `Status: ${adminOnOwnerTab.status}, Error: "${adminOnOwnerTab.data.message}"`
    );

    // 1.3 Attempt logging in as Customer on OWNER tab -> MUST fail with 401
    const customerOnOwnerTab = await postJson("/auth/login", {
      identifier: testCustomerEmail,
      password: "Customer@123",
      role: "OWNER",
    });
    const customerBlockedOnOwner = customerOnOwnerTab.status === 401;
    record(
      "TEST 1.3",
      "Customer Login on OWNER Tab Blocked",
      customerBlockedOnOwner,
      `Status: ${customerOnOwnerTab.status}, Error: "${customerOnOwnerTab.data.message}"`
    );

    // 1.4 Legitimate Customer Login on CUSTOMER tab -> MUST succeed with 200
    const customerValidLogin = await postJson("/auth/login", {
      identifier: testCustomerEmail,
      password: "Customer@123",
      role: "CUSTOMER",
    });
    const customerLoginSuccess = customerValidLogin.status === 200 && customerValidLogin.data.data?.tokens?.accessToken;
    record(
      "TEST 1.4",
      "Valid Customer Login on CUSTOMER Tab",
      Boolean(customerLoginSuccess),
      `Status: ${customerValidLogin.status}, Role: ${customerValidLogin.data.data?.user?.role}`
    );

    // 1.5 Legitimate Owner Login on OWNER tab
    const ownerLogin = await postJson("/auth/login", {
      identifier: "owner@eyobsalon.com",
      password: "Owner@123",
      role: "OWNER",
    });
    const ownerToken = ownerLogin.data.data?.tokens?.accessToken;
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    record("TEST 1.5", "Valid Owner Login on OWNER Tab", ownerLogin.status === 200, `Owner token acquired.`);

    // 1.6 Legitimate Branch Admin Login on BRANCH_ADMIN tab
    const adminLogin = await postJson("/auth/login", {
      identifier: "admin.bole@eyobsalon.com",
      password: "Admin@123",
      role: "BRANCH_ADMIN",
    });
    const adminToken = adminLogin.data.data?.tokens?.accessToken;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    record("TEST 1.6", "Valid Admin Login on BRANCH_ADMIN Tab", adminLogin.status === 200, `Admin token acquired.`);

    // -----------------------------------------------------------------
    // TEST 2: Governance Review Approval Fix (No 500 Crash, Safe Parsing)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 2: Governance Proposal Review Fix & Notification ---");
    const govServiceRes = await postJson("/services", {
      name: `Gov Approval Fix Ritual ${ts}`,
      nameAm: `የማጽደቅ ሙከራ`,
      code: `GA-${ts % 10000}`,
      category: "HAIR",
      basePrice: 1000,
      durationMinutes: 50,
      requiredProtocols: ["Silk Shield"],
    }, ownerHeaders);

    const govService = govServiceRes.data.data?.service || govServiceRes.data.data;
    if (!govService?.id) throw new Error("Failed to create test service for governance test");
    createdServiceIds.push(govService.id);

    // Branch Admin submits price proposal with reason
    const proposalRes = await postJson(`/services/${govService.id}/branch-price`, {
      branchId: boleBranch.id,
      customPrice: 1350,
      customDurationMinutes: 55,
      reason: `Seasonal high-demand override ${ts}`,
    }, adminHeaders);

    const govRequestId = proposalRes.data.governanceRequestId || proposalRes.data.data?.governanceRequestId;
    record("TEST 2.1", "Proposal Submission by Branch Admin", proposalRes.status === 200, `GovernanceRequest ID: ${govRequestId}`);

    // Owner reviews proposal with APPROVE -> Assert 200 OK (no 500 error!)
    const reviewRes = await postJson(`/admin/governance/${govRequestId}/review`, {
      status: "APPROVED",
      reviewNote: "Approved by Owner without error",
    }, ownerHeaders);

    const isReview200 = reviewRes.status === 200 && reviewRes.data.success === true;
    record("TEST 2.2", "Owner Approval Endpoint (No 500 Error)", isReview200, `Status: ${reviewRes.status}`);

    // Verify BranchServicePrice was updated to 1,350 ETB
    const updatedBranchPrice = await prisma.branchServicePrice.findUnique({
      where: {
        branchId_serviceId: {
          branchId: boleBranch.id,
          serviceId: govService.id,
        },
      },
    });
    const priceUpserted = updatedBranchPrice !== null && updatedBranchPrice.customPrice.toNumber() === 1350;
    record(
      "TEST 2.3",
      "BranchServicePrice Upserted Correctly",
      priceUpserted,
      `Price: ${updatedBranchPrice?.customPrice} ETB, Duration: ${updatedBranchPrice?.customDurationMinutes} min`
    );

    // Verify Admin received APPROVAL_NOTICE notification
    const adminNotice = await prisma.notification.findFirst({
      where: {
        userId: adminLogin.data.data?.user?.id,
        type: "APPROVAL_NOTICE",
        title: { contains: "Price Approved" },
      },
      orderBy: { createdAt: "desc" },
    });
    record(
      "TEST 2.4",
      "Branch Admin APPROVAL_NOTICE Notification",
      adminNotice !== null,
      `Title: "${adminNotice?.title}"`
    );

    // -----------------------------------------------------------------
    // TEST 3: Multi-Branch Pricing Resolution
    // -----------------------------------------------------------------
    console.log("\n--- TEST 3: Multi-Branch Pricing Comparison Engine ---");
    const multiPriceServiceRes = await postJson("/services", {
      name: `Multi-Branch Ritual ${ts}`,
      nameAm: `ባለብዙ ቅርንጫፍ አገልግሎት`,
      code: `MB-${ts % 10000}`,
      category: "FACIAL",
      basePrice: 1200,
      durationMinutes: 60,
      requiredProtocols: ["Gold Steam"],
    }, ownerHeaders);

    const multiPriceService = multiPriceServiceRes.data.data?.service || multiPriceServiceRes.data.data;
    if (!multiPriceService?.id) throw new Error("Failed to create multi-price test service");
    createdServiceIds.push(multiPriceService.id);

    // Set Bole price to 1,200 ETB
    await prisma.branchServicePrice.upsert({
      where: {
        branchId_serviceId: {
          branchId: boleBranch.id,
          serviceId: multiPriceService.id,
        },
      },
      update: { customPrice: 1200, isActive: true },
      create: {
        branchId: boleBranch.id,
        serviceId: multiPriceService.id,
        customPrice: 1200,
        isActive: true,
      },
    });

    // Set Kazanchis price to 1,450 ETB
    await prisma.branchServicePrice.upsert({
      where: {
        branchId_serviceId: {
          branchId: kazanchisBranch.id,
          serviceId: multiPriceService.id,
        },
      },
      update: { customPrice: 1450, isActive: true },
      create: {
        branchId: kazanchisBranch.id,
        serviceId: multiPriceService.id,
        customPrice: 1450,
        isActive: true,
      },
    });

    // Query public catalog without branch filter
    const catalogRes = await getJson("/services");
    const catalogServices: any[] = catalogRes.data.data || [];
    const foundMulti = catalogServices.find((s) => s.id === multiPriceService.id);

    const isNonUniform =
      foundMulti !== undefined &&
      foundMulti.isUniformPrice === false &&
      foundMulti.minPrice === 1200 &&
      foundMulti.maxPrice === 1450;

    record(
      "TEST 3.1",
      "Multi-Branch Price Differential Resolution",
      isNonUniform,
      `isUniformPrice: ${foundMulti?.isUniformPrice}, minPrice: ${foundMulti?.minPrice}, maxPrice: ${foundMulti?.maxPrice}`
    );

    const hasBranchPricings =
      Array.isArray(foundMulti?.branchPricings) &&
      foundMulti.branchPricings.some((bp: any) => bp.branchId === boleBranch.id && bp.price === 1200) &&
      foundMulti.branchPricings.some((bp: any) => bp.branchId === kazanchisBranch.id && bp.price === 1450);

    record(
      "TEST 3.2",
      "Branch Pricing Map in Catalog",
      hasBranchPricings,
      `Branch pricings count: ${foundMulti?.branchPricings?.length}`
    );

    // -----------------------------------------------------------------
    // TEST 4: Branch Service Inactivity & Alternate Branch Suggestions
    // -----------------------------------------------------------------
    console.log("\n--- TEST 4: Branch Service Inactivity & Alternate Branch Suggestions ---");

    // Mark service inactive for Bole, active for Kazanchis
    await prisma.branchServicePrice.upsert({
      where: {
        branchId_serviceId: {
          branchId: boleBranch.id,
          serviceId: multiPriceService.id,
        },
      },
      update: { isActive: false },
      create: {
        branchId: boleBranch.id,
        serviceId: multiPriceService.id,
        customPrice: 1200,
        isActive: false,
      },
    });

    // 4.1 Query catalog filtered by Bole branch
    const boleCatalogRes = await getJson(`/services?branchId=${boleBranch.id}`);
    const boleCatalogServices: any[] = boleCatalogRes.data.data || [];
    const boleServiceEntry = boleCatalogServices.find((s) => s.id === multiPriceService.id);

    const boleEntryUnavailable =
      boleServiceEntry !== undefined &&
      (boleServiceEntry.available === false || boleServiceEntry.isAvailableAtSelectedBranch === false);

    record(
      "TEST 4.1",
      "Service Flagged Inactive for Selected Branch",
      boleEntryUnavailable,
      `available: ${boleServiceEntry?.available}, isAvailableAtSelectedBranch: ${boleServiceEntry?.isAvailableAtSelectedBranch}`
    );

    // 4.2 Verify alternate branch suggestions contain Kazanchis
    const alternates: any[] = boleServiceEntry?.alternateBranches || [];
    const containsKazanchis = alternates.some(
      (alt: any) => alt.branchId === kazanchisBranch.id && alt.price === 1450
    );

    record(
      "TEST 4.2",
      "Alternate Branches Contain Active Kazanchis",
      containsKazanchis,
      `Alternates: ${alternates.map((a: any) => `${a.branchName} (${a.price} ETB)`).join(", ")}`
    );

    // 4.3 Query dedicated availability endpoint: GET /services/:id/availability?branchId=Bole
    const availRes = await getJson(`/services/${multiPriceService.id}/availability?branchId=${boleBranch.id}`);
    const availData = availRes.data.data || availRes.data;

    const endpointReportsUnavailableWithAlternates =
      availRes.status === 200 &&
      availData.available === false &&
      Array.isArray(availData.alternateBranches) &&
      availData.alternateBranches.some((a: any) => a.branchId === kazanchisBranch.id);

    record(
      "TEST 4.3",
      "Dedicated Availability Endpoint Resolves Inactivity & Alternates",
      endpointReportsUnavailableWithAlternates,
      `Status: ${availRes.status}, Available: ${availData.available}, Alternates: ${availData.alternateBranches?.length}`
    );

  } catch (err: any) {
    record("ERROR", "Unhandled Exception", false, err.message || String(err));
  } finally {
    console.log("\n--- CLEANUP: Eradicating Test Entities ---");
    for (const sid of createdServiceIds) {
      try {
        await prisma.servicePriceHistory.deleteMany({ where: { serviceId: sid } });
        await prisma.branchServicePrice.deleteMany({ where: { serviceId: sid } });
        await prisma.branchService.deleteMany({ where: { serviceId: sid } });
        await prisma.service.delete({ where: { id: sid } });
      } catch {}
    }
    try {
      await prisma.user.deleteMany({ where: { email: testCustomerEmail } });
    } catch {}
    await prisma.$disconnect();

    console.log("\n==========================================================================");
    console.log(" AUDIT RESULTS SCORECARD");
    console.log("==========================================================================");
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`Passed: ${passedCount}/${totalCount} (${Math.round((passedCount / totalCount) * 100)}%)\n`);

    if (passedCount !== totalCount) {
      console.error("❌ Some verification checks failed!");
      process.exit(1);
    } else {
      console.log("✅ ALL SPRINT AUDIT CHECKS PASSED WITH 100% SUCCESS!");
      process.exit(0);
    }
  }
}

runAudit();
