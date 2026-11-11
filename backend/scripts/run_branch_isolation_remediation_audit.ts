import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

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

async function patchJson(endpoint: string, data: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function putJson(endpoint: string, data: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
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

async function run() {
  console.log("=================================================================");
  console.log(" EYOB SALON — BRANCH ISOLATION, TOGGLE LOCK & QUALIFICATION AUDIT");
  console.log("=================================================================\n");

  try {
    // 1. Setup Test Fixtures: Bole & Kazanchis branches
    let boleBranch = await prisma.branch.findUnique({ where: { slug: "audit-bole" } });
    if (!boleBranch) {
      boleBranch = await prisma.branch.create({
        data: {
          name: "Audit Bole Branch",
          slug: "audit-bole",
          phoneNumber: "+251911000111",
          addressLine: "Bole Medhanialem",
          city: "Addis Ababa",
          isActive: true,
        },
      });
    }

    let kazanchisBranch = await prisma.branch.findUnique({ where: { slug: "audit-kazanchis" } });
    if (!kazanchisBranch) {
      kazanchisBranch = await prisma.branch.create({
        data: {
          name: "Audit Kazanchis Branch",
          slug: "audit-kazanchis",
          phoneNumber: "+251911000222",
          addressLine: "Kazanchis ECA",
          city: "Addis Ababa",
          isActive: true,
        },
      });
    }

    const testPassword = "Password123!";
    const hashedPassword = await hashPassword(testPassword);

    // 2. Setup Bole Branch Admin
    let boleAdminUser = await prisma.user.findFirst({
      where: { phone: "+251911999888" },
    });
    if (!boleAdminUser) {
      boleAdminUser = await prisma.user.create({
        data: {
          firstName: "Bole",
          lastName: "Admin",
          phone: "+251911999888",
          email: "audit.bole.admin@eyob.com",
          password: hashedPassword,
          role: "BRANCH_ADMIN",
          branch: { connect: { id: boleBranch.id } },
        },
      });
    } else {
      await prisma.user.update({
        where: { id: boleAdminUser.id },
        data: { branch: { connect: { id: boleBranch.id } }, role: "BRANCH_ADMIN", password: hashedPassword },
      });
    }

    // 3. Setup Owner User
    let ownerUser = await prisma.user.findFirst({
      where: { phone: "+251911777666" },
    });
    if (!ownerUser) {
      ownerUser = await prisma.user.create({
        data: {
          firstName: "System",
          lastName: "Owner",
          phone: "+251911777666",
          email: "audit.owner@eyob.com",
          password: hashedPassword,
          role: "OWNER",
        },
      });
    } else {
      await prisma.user.update({
        where: { id: ownerUser.id },
        data: { role: "OWNER", password: hashedPassword },
      });
    }

    // Login Bole Admin
    const boleLogin = await postJson("/auth/login", {
      identifier: boleAdminUser.phone,
      password: testPassword,
      role: "BRANCH_ADMIN",
    });
    const boleToken =
      boleLogin.data?.data?.tokens?.accessToken ||
      boleLogin.data?.tokens?.accessToken ||
      boleLogin.data?.data?.accessToken ||
      boleLogin.data?.accessToken;
    if (!boleToken) {
      throw new Error("Failed to authenticate Bole Admin: " + JSON.stringify(boleLogin.data));
    }
    const boleHeaders = { Authorization: `Bearer ${boleToken}` };

    // Login Owner
    const ownerLogin = await postJson("/auth/login", {
      identifier: ownerUser.phone,
      password: testPassword,
      role: "OWNER",
    });
    const ownerToken =
      ownerLogin.data?.data?.tokens?.accessToken ||
      ownerLogin.data?.tokens?.accessToken ||
      ownerLogin.data?.data?.accessToken ||
      ownerLogin.data?.accessToken;
    if (!ownerToken) {
      throw new Error("Failed to authenticate Owner: " + JSON.stringify(ownerLogin.data));
    }
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

    // 4. Create Branch-Specific Test Services and Categories
    const kazanchisCategory = await prisma.serviceCategory.upsert({
      where: { slug: "kazanchis-exclusive-cat" },
      update: { branchId: kazanchisBranch.id, status: "APPROVED", isActive: true },
      create: {
        name: "Kazanchis Exclusive Cat",
        slug: "kazanchis-exclusive-cat",
        branchId: kazanchisBranch.id,
        status: "APPROVED",
        isActive: true,
      },
    });

    const boleCategory = await prisma.serviceCategory.upsert({
      where: { slug: "bole-exclusive-cat" },
      update: { branchId: boleBranch.id, status: "APPROVED", isActive: true },
      create: {
        name: "Bole Exclusive Cat",
        slug: "bole-exclusive-cat",
        branchId: boleBranch.id,
        status: "APPROVED",
        isActive: true,
      },
    });

    const kazanchisService = await prisma.service.upsert({
      where: { slug: "kazanchis-exclusive-service" },
      update: { branchId: kazanchisBranch.id, categoryId: kazanchisCategory.id, isActive: true, approvalStatus: "APPROVED" },
      create: {
        code: "SR-KZ-EXCL",
        name: "Kazanchis Exclusive Ritual",
        slug: "kazanchis-exclusive-service",
        category: "Kazanchis Exclusive Cat",
        categoryId: kazanchisCategory.id,
        branchId: kazanchisBranch.id,
        basePrice: 850,
        durationMinutes: 60,
        isActive: true,
        approvalStatus: "APPROVED",
      },
    });

    const boleService = await prisma.service.upsert({
      where: { slug: "bole-exclusive-service" },
      update: { branchId: boleBranch.id, categoryId: boleCategory.id, isActive: true, approvalStatus: "APPROVED" },
      create: {
        code: "SR-BL-EXCL",
        name: "Bole Exclusive Ritual",
        slug: "bole-exclusive-service",
        category: "Bole Exclusive Cat",
        categoryId: boleCategory.id,
        branchId: boleBranch.id,
        basePrice: 950,
        durationMinutes: 75,
        isActive: true,
        approvalStatus: "APPROVED",
      },
    });

    // Create a specialist in Kazanchis for Bole service (to test specialist filtering)
    let kazanchisEmployee = await prisma.employee.findFirst({
      where: { phone: "+251922000333" },
    });
    if (!kazanchisEmployee) {
      kazanchisEmployee = await prisma.employee.create({
        data: {
          firstName: "Kazanchis",
          lastName: "Specialist",
          phone: "+251922000333",
          branchId: kazanchisBranch.id,
          status: "ACTIVE",
          isActive: true,
        },
      });
    }

    // Link kazanchisEmployee to boleService in EmployeeService table
    await prisma.employeeService.upsert({
      where: {
        employeeId_serviceId: {
          employeeId: kazanchisEmployee.id,
          serviceId: boleService.id,
        },
      },
      update: { isQualified: true },
      create: {
        employeeId: kazanchisEmployee.id,
        serviceId: boleService.id,
        isQualified: true,
      },
    });

    // --------------------------------------------------------------------------
    // STEP 1: Strict Branch Scoping on /api/v1/services for Bole Admin
    // --------------------------------------------------------------------------
    console.log("\n--- STEP 1: Strict Branch Scoping on /api/v1/services ---");
    const boleServicesRes = await getJson("/services", boleHeaders);
    const boleServices = Array.isArray(boleServicesRes.data?.data)
      ? boleServicesRes.data.data
      : Array.isArray(boleServicesRes.data)
      ? boleServicesRes.data
      : [];

    const containsKazanchisService = boleServices.some((s: any) => s.id === kazanchisService.id || s.code === kazanchisService.code);
    record(
      "STEP 1.1",
      "Bole Admin Service List Excludes Kazanchis Services",
      !containsKazanchisService,
      `Bole services count: ${boleServices.length}, contains Kazanchis service: ${containsKazanchisService}`
    );

    const targetBoleService = boleServices.find((s: any) => s.id === boleService.id);
    const hasOnlyBolePricing = targetBoleService && targetBoleService.branchPricings.every((bp: any) => bp.branchId === boleBranch.id);
    record(
      "STEP 1.2",
      "Bole Admin Receives Pricing Matrix Scoped Strictly to Bole",
      Boolean(hasOnlyBolePricing),
      `Matrix branches: ${JSON.stringify(targetBoleService?.branchPricings?.map((b: any) => b.branchName))}`
    );

    const alternateBranchesEmpty = targetBoleService && targetBoleService.alternateBranches.length === 0;
    record(
      "STEP 1.3",
      "Bole Admin Receives Empty Alternate Branches Array",
      Boolean(alternateBranchesEmpty),
      `alternateBranches count: ${targetBoleService?.alternateBranches?.length}`
    );

    const specialistFiltered = targetBoleService && targetBoleService.assignedSpecialists.every((sp: any) => sp.branchId === boleBranch.id);
    record(
      "STEP 1.4",
      "Assigned Specialists Excludes Kazanchis Personnel for Bole Admin",
      Boolean(specialistFiltered),
      `Specialists count: ${targetBoleService?.assignedSpecialists?.length}`
    );

    // Test Bole Admin direct GET /services/:id on Kazanchis service -> Expect 404
    const getKazanchisDirect = await getJson(`/services/${kazanchisService.id}`, boleHeaders);
    record(
      "STEP 1.5",
      "Bole Admin Direct Access to Kazanchis Service Returns 404 NotFound",
      getKazanchisDirect.status === 404,
      `Response status: ${getKazanchisDirect.status}`
    );

    // Test Bole Admin GET /services/categories -> Kazanchis category excluded
    const boleCategoriesRes = await getJson("/services/categories", boleHeaders);
    const boleCategories = Array.isArray(boleCategoriesRes.data?.data)
      ? boleCategoriesRes.data.data
      : Array.isArray(boleCategoriesRes.data)
      ? boleCategoriesRes.data
      : [];
    const containsKazanchisCategory = boleCategories.some((c: any) => c.id === kazanchisCategory.id);
    record(
      "STEP 1.6",
      "Bole Admin Categories Excludes Kazanchis Branch Categories",
      !containsKazanchisCategory,
      `Categories count: ${boleCategories.length}, contains Kazanchis category: ${containsKazanchisCategory}`
    );

    // --------------------------------------------------------------------------
    // STEP 2: Owner Global Clearance Verification
    // --------------------------------------------------------------------------
    console.log("\n--- STEP 2: Owner Global Access on /api/v1/services ---");
    const ownerServicesRes = await getJson("/services", ownerHeaders);
    const ownerServices = Array.isArray(ownerServicesRes.data?.data)
      ? ownerServicesRes.data.data
      : Array.isArray(ownerServicesRes.data)
      ? ownerServicesRes.data
      : [];

    const ownerHasKazanchis = ownerServices.some((s: any) => s.id === kazanchisService.id);
    const ownerHasBole = ownerServices.some((s: any) => s.id === boleService.id);
    record(
      "STEP 2.1",
      "Owner Sees All Services Across Both Branches",
      Boolean(ownerHasKazanchis && ownerHasBole),
      `Owner services count: ${ownerServices.length}, hasKazanchis: ${ownerHasKazanchis}, hasBole: ${ownerHasBole}`
    );

    // --------------------------------------------------------------------------
    // STEP 3: Lock Unapproved Employee Status Toggles
    // --------------------------------------------------------------------------
    console.log("\n--- STEP 3: Lock Unapproved Employee Status Toggles ---");
    // Create pending employee in Bole
    const pendingEmployee = await prisma.employee.create({
      data: {
        firstName: "Pending",
        lastName: "Specialist",
        phone: `+2519${Math.floor(10000000 + Math.random() * 90000000)}`,
        branchId: boleBranch.id,
        status: "PENDING_APPROVAL",
        isActive: false,
      },
    });

    // Bole Admin attempts to toggle status -> 403 Forbidden
    const togglePendingRes = await patchJson(`/employees/${pendingEmployee.id}/toggle-status`, {}, boleHeaders);
    record(
      "STEP 3.1",
      "Bole Admin Cannot Toggle Pending Employee Status (403 Forbidden)",
      togglePendingRes.status === 403,
      `Status: ${togglePendingRes.status}, Error: ${togglePendingRes.data?.error || togglePendingRes.data?.message}`
    );

    // Bole Admin attempts to update status to ACTIVE -> 403 Forbidden
    const updatePendingRes = await patchJson(`/employees/${pendingEmployee.id}`, { status: "ACTIVE" }, boleHeaders);
    record(
      "STEP 3.2",
      "Bole Admin Cannot Update Pending Employee to Active (403 Forbidden)",
      updatePendingRes.status === 403,
      `Status: ${updatePendingRes.status}, Error: ${updatePendingRes.data?.error || updatePendingRes.data?.message}`
    );

    // Owner approves employee by updating status to ACTIVE
    await prisma.employee.update({
      where: { id: pendingEmployee.id },
      data: { status: "ACTIVE", isActive: true },
    });

    // Now Bole Admin toggles status -> 200 OK
    const toggleActiveRes = await patchJson(`/employees/${pendingEmployee.id}/toggle-status`, {}, boleHeaders);
    record(
      "STEP 3.3",
      "Approved Employee Status Can Be Toggled Successfully (200 OK)",
      toggleActiveRes.status === 200,
      `Status: ${toggleActiveRes.status}, New status: ${toggleActiveRes.data?.data?.status || toggleActiveRes.data?.employee?.status}`
    );

    // --------------------------------------------------------------------------
    // STEP 4: Fix Cross-Branch Service Qualification Bug
    // --------------------------------------------------------------------------
    console.log("\n--- STEP 4: Cross-Branch Service Qualification Protection & Fix ---");
    // Create an active specialist in Bole
    const boleSpecialist = await prisma.employee.create({
      data: {
        firstName: "Abebe",
        lastName: "BoleSpecialist",
        phone: `+2519${Math.floor(10000000 + Math.random() * 90000000)}`,
        branchId: boleBranch.id,
        status: "ACTIVE",
        isActive: true,
      },
    });

    // Global service (branchId: null)
    const globalService = await prisma.service.upsert({
      where: { slug: "global-haircut-ritual" },
      update: { branchId: null, isActive: true, approvalStatus: "APPROVED" },
      create: {
        code: "SR-GLB-01",
        name: "Global Haircut Ritual",
        slug: "global-haircut-ritual",
        category: "Hair",
        branchId: null,
        basePrice: 500,
        durationMinutes: 45,
        isActive: true,
        approvalStatus: "APPROVED",
      },
    });

    // Create a strictly Kazanchis service
    const strictKazanchisService = await prisma.service.upsert({
      where: { slug: "strict-kazanchis-only-service" },
      update: { branchId: kazanchisBranch.id, isActive: true, approvalStatus: "APPROVED" },
      create: {
        code: "SR-KZ-STRICT",
        name: "Strict Kazanchis Ritual",
        slug: "strict-kazanchis-only-service",
        category: "Nails",
        branchId: kazanchisBranch.id,
        basePrice: 650,
        durationMinutes: 40,
        isActive: true,
        approvalStatus: "APPROVED",
      },
    });

    // Ensure no Bole deployment records exist for strictKazanchisService
    await prisma.branchServicePrice.deleteMany({
      where: { branchId: boleBranch.id, serviceId: strictKazanchisService.id },
    });
    await prisma.branchService.deleteMany({
      where: { branchId: boleBranch.id, serviceId: strictKazanchisService.id },
    });

    // Assign global service to Bole Specialist -> Should succeed (200 OK)
    const assignGlobalRes = await putJson(
      `/employees/${boleSpecialist.id}/services`,
      { serviceIds: [globalService.id] },
      boleHeaders
    );
    record(
      "STEP 4.1",
      "Assign Global Service to Bole Specialist (200 OK)",
      assignGlobalRes.status === 200,
      `Status: ${assignGlobalRes.status}`
    );

    // Assign Bole-exclusive service to Bole Specialist -> Should succeed (200 OK)
    const assignBoleRes = await putJson(
      `/employees/${boleSpecialist.id}/services`,
      { serviceIds: [globalService.id, boleService.id] },
      boleHeaders
    );
    record(
      "STEP 4.2",
      "Assign Bole-Specific Service to Bole Specialist (200 OK)",
      assignBoleRes.status === 200,
      `Status: ${assignBoleRes.status}`
    );

    // Attempt to assign strictly Kazanchis service to Bole Specialist -> Should fail with 400 Validation Error
    const assignKazanchisRes = await putJson(
      `/employees/${boleSpecialist.id}/services`,
      { serviceIds: [strictKazanchisService.id] },
      boleHeaders
    );
    record(
      "STEP 4.3",
      "Assign Kazanchis-Specific Service to Bole Specialist Fails with Cross-Branch Violation",
      assignKazanchisRes.status === 400,
      `Status: ${assignKazanchisRes.status}, Message: ${assignKazanchisRes.data?.error || assignKazanchisRes.data?.message}`
    );

    // Now deploy strictKazanchisService to Bole branch via BranchServicePrice
    await prisma.branchServicePrice.create({
      data: {
        branchId: boleBranch.id,
        serviceId: strictKazanchisService.id,
        customPrice: 700,
        isActive: true,
      },
    });

    // Now re-assigning strictKazanchisService to Bole Specialist -> Should succeed (200 OK)!
    const assignDeployedRes = await putJson(
      `/employees/${boleSpecialist.id}/services`,
      { serviceIds: [globalService.id, strictKazanchisService.id] },
      boleHeaders
    );
    record(
      "STEP 4.4",
      "Assigning Cross-Branch Service Deployed to Bole via BranchServicePrice Succeeds (200 OK)",
      assignDeployedRes.status === 200,
      `Status: ${assignDeployedRes.status}`
    );

    // --------------------------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------------------------
    console.log("\n=================================================================");
    console.log(" AUDIT RESULTS SUMMARY                                           ");
    console.log("=================================================================");
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.filter((r) => !r.passed).length;
    console.log(`TOTAL CHECKS: ${results.length}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${failedCount}`);

    if (failedCount > 0) {
      console.error("\n❌ AUDIT FAILED WITH " + failedCount + " FAILURES.");
      process.exit(1);
    } else {
      console.log("\n✅ ALL BRANCH ISOLATION & REMEDIATION CHECKS PASSED PERFECTLY!");
      process.exit(0);
    }
  } catch (error) {
    console.error("Fatal error during audit execution:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
