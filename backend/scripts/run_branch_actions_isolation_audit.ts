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

async function patchJson(endpoint: string, data: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
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

async function getJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function run() {
  console.log("=================================================================");
  console.log(" EYOB SALON — BRANCH CARD ACTIONS & ROLE ISOLATION AUDIT         ");
  console.log("=================================================================\n");

  // Clean up any stale test branches from previous runs
  const staleBranches = await prisma.branch.findMany({
    where: { name: { contains: "Piassa" } },
  });
  for (const b of staleBranches) {
    await prisma.rolePermission.deleteMany({ where: { role: { branchId: b.id } } });
    await prisma.booking.deleteMany({ where: { branchId: b.id } });
    await prisma.user.deleteMany({ where: { branchId: b.id } });
    await prisma.role.deleteMany({ where: { branchId: b.id } });
    await prisma.branchHours.deleteMany({ where: { branchId: b.id } });
    await prisma.branch.delete({ where: { id: b.id } });
  }

  // 1. Authenticate Owner
  const ownerAuth = await postJson("/auth/login", {
    identifier: "owner@eyobsalon.com",
    password: "Owner@123",
    role: "OWNER",
  });
  const ownerToken = ownerAuth.data.data?.tokens?.accessToken || ownerAuth.data.data?.accessToken;
  if (!ownerToken) throw new Error("Owner login failed");
  record("1. Auth", "Owner Authentication", true, "Owner logged in with 200 OK");

  // 2. Authenticate Bole Admin
  const boleAuth = await postJson("/auth/login", {
    identifier: "admin.bole@eyobsalon.com",
    password: "Admin@123",
    role: "BRANCH_ADMIN",
  });
  const boleToken = boleAuth.data.data?.tokens?.accessToken || boleAuth.data.data?.accessToken;
  if (!boleToken) throw new Error("Bole Admin login failed");
  record("1. Auth", "Bole Admin Authentication", true, "Bole Admin logged in with 200 OK");

  // 3. Create a temporary branch with an admin for test
  const createBranchRes = await postJson(
    "/branches",
    {
      name: "Audit Test Branch Piassa",
      phone: "+251911445566",
      address: "Piassa, Churchill Ave",
      city: "Addis Ababa",
      timezone: "Africa/Addis_Ababa",
      description: "Temporary branch for actions & isolation audit",
      slotBufferMinutes: 10,
      admin: {
        name: "Dawit Kebede",
        email: "admin.piassa@eyobsalon.com",
        phone: "+251911445566",
        password: "Password@123",
      },
    },
    { Authorization: `Bearer ${ownerToken}` }
  );

  const testBranch = createBranchRes.data.data;
  const testBranchId = testBranch?.id;
  const testAdminId = testBranch?.admin?.id;
  record(
    "2. Provisioning",
    "Branch & Admin Creation via In-Modal Provisioning",
    createBranchRes.status === 201 && !!testBranchId && !!testAdminId,
    `Branch ID: ${testBranchId}, Admin ID: ${testAdminId}`
  );

  // 4. Verify Branch Admin cannot perform Owner-only branch modifications or deletion
  const unauthorizedPatch = await patchJson(
    `/branches/${testBranchId}`,
    { name: "Hacked Branch" },
    { Authorization: `Bearer ${boleToken}` }
  );
  record(
    "3. Security Boundary",
    "Branch Admin Forbidden from Editing Branch Details",
    unauthorizedPatch.status === 403,
    `HTTP ${unauthorizedPatch.status} returned`
  );

  const unauthorizedDelete = await deleteJson(`/branches/${testBranchId}`, {
    Authorization: `Bearer ${boleToken}`,
  });
  record(
    "3. Security Boundary",
    "Branch Admin Forbidden from Deleting Branch",
    unauthorizedDelete.status === 403,
    `HTTP ${unauthorizedDelete.status} returned`
  );

  // 5. Test Owner Combined Edit Flow: Update branch details AND Admin account details
  const updateFlowRes = await patchJson(
    `/branches/${testBranchId}`,
    {
      name: "Eyob Beauty Salon - Piassa Elite",
      phone: "+251911778899",
      address: "Piassa, Cunningham Street",
      description: "Updated luxury location",
      admin: {
        name: "Dawit Kebede Updated",
        email: "admin.piassa.updated@eyobsalon.com",
        phone: "+251911778899",
        password: "NewPassword@123",
      },
    },
    { Authorization: `Bearer ${ownerToken}` }
  );

  record(
    "4. Card Actions: Edit",
    "Owner Full Edit Flow (Branch & Manager Credentials)",
    updateFlowRes.status === 200 &&
      updateFlowRes.data.data?.name === "Eyob Beauty Salon - Piassa Elite" &&
      updateFlowRes.data.data?.admin?.email === "admin.piassa.updated@eyobsalon.com",
    `Updated branch name and admin email to ${updateFlowRes.data.data?.admin?.email}`
  );

  // 6. Verify updated admin can log in with new credentials
  const updatedAdminLogin = await postJson("/auth/login", {
    identifier: "admin.piassa.updated@eyobsalon.com",
    password: "NewPassword@123",
    role: "BRANCH_ADMIN",
  });
  record(
    "4. Card Actions: Edit",
    "Updated Admin Login with New Password",
    updatedAdminLogin.status === 200,
    `HTTP ${updatedAdminLogin.status} - Successfully authenticated`
  );

  // 7. Test Independent Branch Admin Permissions Isolation
  // Fetch initial permissions of Bole Admin
  const boleAdminUserBefore = await prisma.user.findUnique({
    where: { email: "admin.bole@eyobsalon.com" },
    include: {
      customRole: {
        include: { permissions: { include: { permission: true } } },
      },
    },
  });
  const boleInitialPermNames = (boleAdminUserBefore?.customRole?.permissions || []).map(
    (p) => p.permission.name
  );

  // Get a single permission to give to Piassa admin (e.g. 'view_reports')
  const allPermsRes = await getJson("/admin/permissions", {
    Authorization: `Bearer ${ownerToken}`,
  });
  const viewReportsPerm = allPermsRes.data.data?.find((p: any) => p.name === "view_reports");
  const viewBookingsPerm = allPermsRes.data.data?.find((p: any) => p.name === "view_bookings");

  const newPermIds = [viewReportsPerm?.id, viewBookingsPerm?.id].filter(Boolean);

  // Update Piassa admin's permissions
  const updatePiassaPermsRes = await patchJson(
    `/admin/branch-admins/${testAdminId}/permissions`,
    { permissionIds: newPermIds },
    { Authorization: `Bearer ${ownerToken}` }
  );

  record(
    "5. Dynamic Isolation",
    "Customize Branch Admin Permissions (Independent Role Creation)",
    updatePiassaPermsRes.status === 200 &&
      updatePiassaPermsRes.data.data?.permissions?.length === newPermIds.length,
    `Assigned ${newPermIds.length} permissions to Piassa Admin with role ${updatePiassaPermsRes.data.data?.name}`
  );

  // Verify Bole Admin's permissions were NOT altered or leaked
  const boleAdminUserAfter = await prisma.user.findUnique({
    where: { email: "admin.bole@eyobsalon.com" },
    include: {
      customRole: {
        include: { permissions: { include: { permission: true } } },
      },
    },
  });
  const boleAfterPermNames = (boleAdminUserAfter?.customRole?.permissions || []).map(
    (p) => p.permission.name
  );

  const permissionsIsolated =
    JSON.stringify(boleInitialPermNames.sort()) === JSON.stringify(boleAfterPermNames.sort());

  record(
    "5. Dynamic Isolation",
    "Zero Cross-Branch Leakage (Bole Admin Permissions Intact)",
    permissionsIsolated,
    `Bole Admin permissions unchanged (${boleAfterPermNames.length} permissions)`
  );

  // 8. Test Delete / Soft Deactivation Flow
  // Create an active test booking for the branch
  const customer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
  let activeBookingId: string | null = null;
  if (customer) {
    const timestamp = Date.now();
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        branchId: testBranchId,
        bookingNumber: `BK-TEST-${timestamp}`,
        status: "CONFIRMED",
        totalAmount: 1000,
        depositRequired: 300,
        depositPaid: 300,
        balanceDue: 700,
      },
    });
    activeBookingId = booking.id;
  }

  const deleteRes = await deleteJson(`/branches/${testBranchId}`, {
    Authorization: `Bearer ${ownerToken}`,
  });

  const branchAfterDelete = await prisma.branch.findUnique({ where: { id: testBranchId } });
  const bookingAfterDelete = activeBookingId
    ? await prisma.booking.findUnique({ where: { id: activeBookingId } })
    : null;

  record(
    "6. Card Actions: Delete",
    "Owner Soft-Delete & Active Booking Cancellation",
    deleteRes.status === 200 &&
      branchAfterDelete?.isActive === false &&
      (!bookingAfterDelete || bookingAfterDelete.status === "CANCELLED"),
    `Branch isActive: ${branchAfterDelete?.isActive}, Booking status: ${bookingAfterDelete?.status}`
  );

  // 9. Clean up test artifacts
  if (activeBookingId) {
    await prisma.booking.delete({ where: { id: activeBookingId } });
  }
  await prisma.rolePermission.deleteMany({
    where: { role: { branchId: testBranchId } },
  });
  await prisma.user.deleteMany({
    where: { branchId: testBranchId },
  });
  await prisma.role.deleteMany({
    where: { branchId: testBranchId },
  });
  await prisma.branchHours.deleteMany({
    where: { branchId: testBranchId },
  });
  await prisma.branch.delete({
    where: { id: testBranchId },
  });

  console.log("\n=================================================================");
  console.log("                      TEST RESULTS SUMMARY                       ");
  console.log("=================================================================\n");

  const allPassed = results.every((r) => r.passed);
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: ${results.filter((r) => r.passed).length}`);
  console.log(`Failed: ${results.filter((r) => !r.passed).length}`);
  console.log("\n=================================================================");

  if (!allPassed) {
    process.exit(1);
  }
}

run()
  .catch((e) => {
    console.error("Audit failure:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
