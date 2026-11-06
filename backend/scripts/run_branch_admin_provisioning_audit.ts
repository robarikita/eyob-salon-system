import prisma from "../src/utils/prisma";

const BASE_URL = "http://localhost:3000/api/v1";

async function runAudit() {
  console.log("=================================================================");
  console.log(" EYOB SALON SYSTEM — BRANCH ADMIN PROVISIONING AUDIT             ");
  console.log("=================================================================\n");

  // 1. Authenticate Owner
  console.log(">> 1. Authenticating Owner...");
  const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "owner@eyobsalon.com", password: "Owner@123" }),
  });
  const ownerLoginData = await ownerLoginRes.json();
  const ownerToken = ownerLoginData.data?.tokens?.accessToken || ownerLoginData.data?.accessToken;
  if (!ownerToken) {
    throw new Error(`Owner login failed: ${JSON.stringify(ownerLoginData)}`);
  }
  console.log("[✓ PASS] Owner authenticated successfully.");

  // Clean previous test data
  const testAdminEmail = "admin.gerji@eyobsalon.com";
  const existingUser = await prisma.user.findUnique({ where: { email: testAdminEmail } });
  if (existingUser) {
    await prisma.user.delete({ where: { email: testAdminEmail } });
  }
  const existingBranch = await prisma.branch.findUnique({ where: { slug: "gerji-test" } });
  if (existingBranch) {
    await prisma.branchHours.deleteMany({ where: { branchId: existingBranch.id } });
    await prisma.branch.delete({ where: { id: existingBranch.id } });
  }

  // 2. Create Branch with In-Form Admin Provisioning
  console.log(">> 2. Creating Branch with Nested Admin Account...");
  const createBranchRes = await fetch(`${BASE_URL}/branches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      name: "Eyob Beauty Salon - Gerji Imperial",
      slug: "gerji-test",
      phone: "+251911334455",
      address: "Gerji, Near Imperial Hotel",
      city: "Addis Ababa",
      timezone: "Africa/Addis_Ababa",
      description: "East Addis Flagship Sanctuary",
      admin: {
        name: "Hanna Girma",
        email: testAdminEmail,
        phone: "+251911778899",
        password: "GerjiAdmin@123",
      },
    }),
  });

  const createBranchData = await createBranchRes.json();
  if (createBranchRes.status !== 201 || !createBranchData.data) {
    throw new Error(`Branch creation failed: ${JSON.stringify(createBranchData)}`);
  }

  const newBranch = createBranchData.data;
  console.log(`[✓ PASS] Branch created: "${newBranch.name}" (ID: ${newBranch.id})`);
  console.log(`[✓ PASS] Admin provisioned in payload: "${newBranch.admin?.name}" (${newBranch.admin?.email})`);

  // 3. Verify in PostgreSQL
  console.log(">> 3. Inspecting Database Records for Provisioned Admin...");
  const adminInDb = await prisma.user.findUnique({
    where: { email: testAdminEmail },
    include: { branch: true },
  });

  if (!adminInDb || adminInDb.role !== "BRANCH_ADMIN" || adminInDb.branchId !== newBranch.id) {
    throw new Error(`DB verification failed: ${JSON.stringify(adminInDb)}`);
  }
  console.log(`[✓ PASS] DB Verified: User ${adminInDb.email} has role ${adminInDb.role} scoped to branch ${adminInDb.branch?.name}`);

  // 4. Query /api/v1/admin/branch-admins
  console.log(">> 4. Querying /api/v1/admin/branch-admins...");
  const branchAdminsRes = await fetch(`${BASE_URL}/admin/branch-admins`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const branchAdminsData = await branchAdminsRes.json();
  const foundInList = branchAdminsData.data?.find((a: any) => a.email === testAdminEmail);

  if (!foundInList || !foundInList.branch || foundInList.permissions.length === 0) {
    throw new Error(`Admin not found in /admin/branch-admins list: ${JSON.stringify(branchAdminsData)}`);
  }
  console.log(`[✓ PASS] /admin/branch-admins returned ${branchAdminsData.data.length} admins. Gerji admin found with ${foundInList.permissions.length} permissions.`);

  // 5. Authenticate with New Admin Credentials
  console.log(">> 5. Authenticating as newly created Branch Admin...");
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: testAdminEmail, password: "GerjiAdmin@123" }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.data?.tokens?.accessToken || adminLoginData.data?.accessToken;

  if (adminLoginRes.status !== 200 || !adminToken) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
  }
  console.log(`[✓ PASS] Admin login succeeded (HTTP 200). JWT received for role: ${adminLoginData.data?.user?.role}`);

  // 6. Verify Branch Scoping (Cross-Branch Access Denied)
  console.log(">> 6. Testing Branch Scoping Boundary...");
  const boleBranch = await prisma.branch.findUnique({ where: { slug: "bole-bulbula" } });
  const crossBranchRes = await fetch(`${BASE_URL}/services/governance/${boleBranch?.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const crossBranchData = await crossBranchRes.json();

  if (crossBranchRes.status !== 403) {
    throw new Error(`Cross-branch access was NOT blocked! Status: ${crossBranchRes.status}`);
  }
  console.log(`[✓ PASS] Cross-branch access rejected (HTTP 403): "${crossBranchData.message}"`);

  // 7. Test Admin Password Reset
  console.log(">> 7. Testing Admin Password Reset by Owner...");
  const resetRes = await fetch(`${BASE_URL}/admin/users/${adminInDb.id}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({ newPassword: "UpdatedGerjiAdmin@123" }),
  });
  const resetData = await resetRes.json();

  if (resetRes.status !== 200 || resetData.status !== "success") {
    throw new Error(`Reset password failed: ${JSON.stringify(resetData)}`);
  }

  // Re-login with updated password
  const reLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: testAdminEmail, password: "UpdatedGerjiAdmin@123" }),
  });
  if (reLoginRes.status !== 200) {
    throw new Error(`Re-login with updated password failed: ${reLoginRes.status}`);
  }
  console.log("[✓ PASS] Owner password reset succeeded; admin successfully logged in with new password.");

  // Clean up
  await prisma.user.delete({ where: { id: adminInDb.id } });
  await prisma.branchHours.deleteMany({ where: { branchId: newBranch.id } });
  await prisma.branch.delete({ where: { id: newBranch.id } });
  console.log("[✓ PASS] Test artifacts cleanly purged from PostgreSQL.");

  console.log("\n=================================================================");
  console.log(" AUDIT PASSED: ALL 7 VERIFICATION CRITERIA CONFIRMED            ");
  console.log("=================================================================\n");
}

runAudit()
  .catch((err) => {
    console.error("AUDIT FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
