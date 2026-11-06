import prisma from "../src/utils/prisma";

interface RbacAuditResult {
  category: string;
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const auditResults: RbacAuditResult[] = [];

function recordResult(category: string, scenario: string, expected: string, actual: string, passed: boolean) {
  auditResults.push({ category, scenario, expected, actual, passed });
}

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api/v1";

async function postJson(endpoint: string, body: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function putJson(endpoint: string, body: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function getJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runRbacAudit() {
  console.log("=================================================================");
  console.log("   EYOB SALON SYSTEM — SPRINT 1 US2 RBAC & ISOLATION AUDIT       ");
  console.log("=================================================================\n");

  // Fetch branches
  const boleBranch = await prisma.branch.findUnique({ where: { slug: "bole-bulbula" } });
  const kazanchisBranch = await prisma.branch.findUnique({ where: { slug: "kazanchis" } });
  const cmcBranch = await prisma.branch.findUnique({ where: { slug: "cmc" } });

  if (!boleBranch || !kazanchisBranch || !cmcBranch) {
    throw new Error("Missing required branches in database. Please run database seed.");
  }

  // Fetch a sample service for pricing tests
  const service = await prisma.service.findFirst({ where: { isActive: true } });
  if (!service) {
    throw new Error("No active service found for pricing tests.");
  }

  // 1. Authenticate Owner
  console.log(">> Authenticating Owner (owner@eyobsalon.com)...");
  const ownerLogin = await postJson("/auth/login", {
    identifier: "owner@eyobsalon.com",
    password: "Owner@123",
  });
  const ownerToken = ownerLogin.data.data?.tokens?.accessToken;
  if (!ownerToken) {
    throw new Error(`Owner login failed with status ${ownerLogin.status}: ${JSON.stringify(ownerLogin.data)}`);
  }

  // 2. Authenticate Bole Admin
  console.log(">> Authenticating Bole Admin (admin.bole@eyobsalon.com)...");
  const adminLogin = await postJson("/auth/login", {
    identifier: "admin.bole@eyobsalon.com",
    password: "Admin@123",
  });
  const adminToken = adminLogin.data.data?.tokens?.accessToken;
  if (!adminToken) {
    throw new Error(`Bole Admin login failed with status ${adminLogin.status}: ${JSON.stringify(adminLogin.data)}`);
  }

  // -------------------------------------------------------------
  // AREA 1: OWNER GLOBAL CLEARANCE
  // -------------------------------------------------------------
  console.log(">> Area 1: Verifying Owner Global Cross-Branch Clearance...");

  // 1a. Owner queries all branches
  const ownerBranchesRes = await getJson("/branches", {
    Authorization: `Bearer ${ownerToken}`,
  });
  const ownerBranchesPassed = ownerBranchesRes.status === 200 && Array.isArray(ownerBranchesRes.data.data);
  recordResult(
    "1. Owner Global Clearance",
    "Owner requests all branches list (/branches)",
    "HTTP 200 OK with full multi-branch records",
    `HTTP ${ownerBranchesRes.status} - Branches: ${ownerBranchesRes.data.data?.length}`,
    ownerBranchesPassed
  );

  // 1b. Owner queries Kazanchis branch governance metrics
  const ownerKazanchisGov = await getJson(`/services/governance/${kazanchisBranch.id}`, {
    Authorization: `Bearer ${ownerToken}`,
  });
  const ownerGovPassed = ownerKazanchisGov.status === 200;
  recordResult(
    "1. Owner Global Clearance",
    `Owner queries Kazanchis governance metrics (/services/governance/${kazanchisBranch.id})`,
    "HTTP 200 OK (Owner global bypass authority)",
    `HTTP ${ownerKazanchisGov.status} - Branch: "${ownerKazanchisGov.data.data?.branch?.name}"`,
    ownerGovPassed
  );

  // -------------------------------------------------------------
  // AREA 2: BRANCH ADMIN STRICT SCOPING
  // -------------------------------------------------------------
  console.log(">> Area 2: Verifying Branch Admin Strict Scoping & Isolation...");

  // 2a. Bole Admin queries Bole Bulbula governance metrics
  const boleAdminOwnBranch = await getJson(`/services/governance/${boleBranch.id}`, {
    Authorization: `Bearer ${adminToken}`,
  });
  const boleOwnPassed = boleAdminOwnBranch.status === 200;
  recordResult(
    "2. Branch Admin Scoping",
    `Bole Admin queries assigned branch Bole Bulbula (${boleBranch.id})`,
    "HTTP 200 OK (Allowed for assigned branch)",
    `HTTP ${boleAdminOwnBranch.status} - Branch: "${boleAdminOwnBranch.data.data?.branch?.name}"`,
    boleOwnPassed
  );

  // 2b. Bole Admin queries Kazanchis governance metrics (Forbidden)
  const boleAdminCrossBranch = await getJson(`/services/governance/${kazanchisBranch.id}`, {
    Authorization: `Bearer ${adminToken}`,
  });
  const crossBranchGovBlocked = boleAdminCrossBranch.status === 403;
  recordResult(
    "2. Branch Admin Scoping",
    `Bole Admin attempts to query Kazanchis branch governance (/services/governance/${kazanchisBranch.id})`,
    "HTTP 403 Forbidden (Cross-branch access denied)",
    `HTTP ${boleAdminCrossBranch.status} - Message: "${boleAdminCrossBranch.data.message}"`,
    crossBranchGovBlocked
  );

  // 2c. Bole Admin queries CMC employees roster (Forbidden)
  const boleAdminCrossEmployees = await getJson(`/employees?branchId=${cmcBranch.id}`, {
    Authorization: `Bearer ${adminToken}`,
  });
  const crossEmployeesBlocked = boleAdminCrossEmployees.status === 403;
  recordResult(
    "2. Branch Admin Scoping",
    `Bole Admin attempts to query CMC employee roster (/employees?branchId=${cmcBranch.id})`,
    "HTTP 403 Forbidden (Cross-branch employee access denied)",
    `HTTP ${boleAdminCrossEmployees.status} - Message: "${boleAdminCrossEmployees.data.message}"`,
    crossEmployeesBlocked
  );

  // -------------------------------------------------------------
  // AREA 3: DYNAMIC GRANULAR PERMISSION CHECK
  // -------------------------------------------------------------
  console.log(">> Area 3: Verifying Dynamic Granular Permission Checks...");

  // 3a. Bole Admin with `manage_prices` updates branch price for Bole Bulbula
  const updatePriceWithPerm = await putJson(
    `/services/${service.id}/branches/${boleBranch.id}`,
    {
      customPrice: 1350,
      requiredDeposit: 350,
      customTurnaround: 15,
      isActive: true,
    },
    { Authorization: `Bearer ${adminToken}` }
  );
  const priceUpdatePassed = updatePriceWithPerm.status === 200;
  recordResult(
    "3. Dynamic Permission",
    `Bole Admin with "manage_prices" permission updates Bole Bulbula service pricing`,
    "HTTP 200 OK (Allowed by dynamic RolePermission)",
    `HTTP ${updatePriceWithPerm.status} - CustomPrice: ${updatePriceWithPerm.data.data?.customPrice} ETB`,
    priceUpdatePassed
  );

  // 3b. Temporarily remove `manage_prices` permission from BRANCH_ADMIN role
  const branchAdminRole = await prisma.role.findUnique({ where: { name: "BRANCH_ADMIN" } });
  const managePricesPerm = await prisma.permission.findUnique({ where: { name: "manage_prices" } });

  if (branchAdminRole && managePricesPerm) {
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId: branchAdminRole.id,
          permissionId: managePricesPerm.id,
        },
      },
    });
  }

  // Attempt price update WITHOUT `manage_prices`
  const updatePriceWithoutPerm = await putJson(
    `/services/${service.id}/branches/${boleBranch.id}`,
    {
      customPrice: 1400,
      requiredDeposit: 400,
    },
    { Authorization: `Bearer ${adminToken}` }
  );

  const priceDeniedWithoutPerm =
    updatePriceWithoutPerm.status === 403 &&
    updatePriceWithoutPerm.data.message.includes("missing required permission");

  recordResult(
    "3. Dynamic Permission",
    `Bole Admin attempting price update when "manage_prices" permission is revoked`,
    'HTTP 403 Forbidden: "Access denied: missing required permission"',
    `HTTP ${updatePriceWithoutPerm.status} - Message: "${updatePriceWithoutPerm.data.message}"`,
    priceDeniedWithoutPerm
  );

  // Restore `manage_prices` to BRANCH_ADMIN role
  if (branchAdminRole && managePricesPerm) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: branchAdminRole.id,
          permissionId: managePricesPerm.id,
        },
      },
      update: {},
      create: {
        roleId: branchAdminRole.id,
        permissionId: managePricesPerm.id,
      },
    });
  }

  // -------------------------------------------------------------
  // AREA 4: AUDIT LOG INSPECTION (RBAC RESTRICTION)
  // -------------------------------------------------------------
  console.log(">> Area 4: Verifying Audit Log Inspection RBAC Restrictions...");

  // 4a. Owner retrieves audit logs
  const ownerAuditRes = await getJson("/admin/audit-logs", {
    Authorization: `Bearer ${ownerToken}`,
  });
  const ownerAuditPassed = ownerAuditRes.status === 200 && Array.isArray(ownerAuditRes.data.data);
  recordResult(
    "4. Audit Log Access",
    "Owner queries /admin/audit-logs",
    "HTTP 200 OK (Owner has global clearance)",
    `HTTP ${ownerAuditRes.status} - Audit records retrieved: ${ownerAuditRes.data.data?.length}`,
    ownerAuditPassed
  );

  // 4b. Bole Admin without `view_audit_logs` permission calls /admin/audit-logs
  const adminAuditRes = await getJson("/admin/audit-logs", {
    Authorization: `Bearer ${adminToken}`,
  });
  const adminAuditBlocked =
    adminAuditRes.status === 403 && adminAuditRes.data.message.includes("missing required permission");
  recordResult(
    "4. Audit Log Access",
    'Branch Admin (without "view_audit_logs") queries /admin/audit-logs',
    'HTTP 403 Forbidden: "Access denied: missing required permission"',
    `HTTP ${adminAuditRes.status} - Message: "${adminAuditRes.data.message}"`,
    adminAuditBlocked
  );

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  console.log("\n=================================================================");
  console.log("                      TEST RESULTS SUMMARY");
  console.log("=================================================================\n");

  let allPassed = true;
  for (const r of auditResults) {
    const symbol = r.passed ? "[✓ PASS]" : "[✗ FAIL]";
    if (!r.passed) allPassed = false;
    console.log(`${symbol} [${r.category}]`);
    console.log(`  Scenario: ${r.scenario}`);
    console.log(`  Expected: ${r.expected}`);
    console.log(`  Actual:   ${r.actual}\n`);
  }

  console.log("=================================================================");
  console.log(`Total Tests Run: ${auditResults.length}`);
  console.log(`Passed: ${auditResults.filter((r) => r.passed).length}`);
  console.log(`Failed: ${auditResults.filter((r) => !r.passed).length}`);
  console.log("=================================================================\n");

  if (!allPassed) {
    process.exit(1);
  }
}

runRbacAudit()
  .catch((err) => {
    console.error("RBAC Audit Error:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

