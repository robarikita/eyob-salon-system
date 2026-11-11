import prisma from "../src/utils/prisma";
import { hashPassword } from "../src/utils/password";
import { NotificationService } from "../src/modules/notification/notification.service";

const API_BASE = "http://localhost:3000/api/v1";

interface TestResult {
  code: string;
  scenario: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(code: string, scenario: string, passed: boolean, details?: string) {
  results.push({ code, scenario, passed, details });
  const statusMark = passed ? "[✓ PASS]" : "[✗ FAIL]";
  console.log(`${statusMark} [${code}] ${scenario}: ${details || ""}`);
}

async function postJson(endpoint: string, body: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function putJson(endpoint: string, body: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function deleteJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...headers },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  console.log("=================================================================");
  console.log(" EYOB SALON — NOTIFICATION FK, GOVERNANCE DELETE & AUTH AUDIT   ");
  console.log("=================================================================\n");

  try {
    // --------------------------------------------------------------------------
    // SETUP FIXTURES
    // --------------------------------------------------------------------------
    const testPassword = "AuditSecurePassword123!";
    const hashedPassword = await hashPassword(testPassword);

    // 1. Bole Branch
    let boleBranch = await prisma.branch.findFirst({
      where: { slug: "bole-bulbula" },
    });
    if (!boleBranch) {
      boleBranch = await prisma.branch.create({
        data: {
          name: "Eyob Beauty Salon - Bole Bulbula",
          slug: "bole-bulbula",
          phoneNumber: "+251911223344",
          addressLine: "Bole Bulbula Near Medhanialem",
          city: "Addis Ababa",
          isActive: true,
        },
      });
    }

    // 2. Kazanchis Branch
    let kazanchisBranch = await prisma.branch.findFirst({
      where: { slug: "kazanchis-branch" },
    });
    if (!kazanchisBranch) {
      kazanchisBranch = await prisma.branch.create({
        data: {
          name: "Eyob Beauty Salon - Kazanchis",
          slug: "kazanchis-branch",
          phoneNumber: "+251911556677",
          addressLine: "Kazanchis Guinea Conakry St",
          city: "Addis Ababa",
          isActive: true,
        },
      });
    }

    // 3. Bole Admin User
    let boleAdminUser = await prisma.user.findFirst({
      where: { phone: "+251911444333" },
    });
    if (!boleAdminUser) {
      boleAdminUser = await prisma.user.create({
        data: {
          firstName: "AuditBole",
          lastName: "Admin",
          phone: "+251911444333",
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

    // 4. Kazanchis Admin User
    let kazanchisAdminUser = await prisma.user.findFirst({
      where: { phone: "+251911444555" },
    });
    if (!kazanchisAdminUser) {
      kazanchisAdminUser = await prisma.user.create({
        data: {
          firstName: "AuditKazanchis",
          lastName: "Admin",
          phone: "+251911444555",
          email: "audit.kazanchis.admin@eyob.com",
          password: hashedPassword,
          role: "BRANCH_ADMIN",
          branch: { connect: { id: kazanchisBranch.id } },
        },
      });
    } else {
      await prisma.user.update({
        where: { id: kazanchisAdminUser.id },
        data: { branch: { connect: { id: kazanchisBranch.id } }, role: "BRANCH_ADMIN", password: hashedPassword },
      });
    }

    // 5. Owner User
    let ownerUser = await prisma.user.findFirst({
      where: { phone: "+251911444444" },
    });
    if (!ownerUser) {
      ownerUser = await prisma.user.create({
        data: {
          firstName: "Audit",
          lastName: "Owner",
          phone: "+251911444444",
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
    const boleHeaders = { Authorization: `Bearer ${boleToken}` };

    // Login Kazanchis Admin
    const kazanchisLogin = await postJson("/auth/login", {
      identifier: kazanchisAdminUser.phone,
      password: testPassword,
      role: "BRANCH_ADMIN",
    });
    const kazanchisToken =
      kazanchisLogin.data?.data?.tokens?.accessToken ||
      kazanchisLogin.data?.tokens?.accessToken ||
      kazanchisLogin.data?.data?.accessToken ||
      kazanchisLogin.data?.accessToken;
    const kazanchisHeaders = { Authorization: `Bearer ${kazanchisToken}` };

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
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

    // --------------------------------------------------------------------------
    // TASK 1: Fix Foreign Key Constraint on Notification Creation & Review
    // --------------------------------------------------------------------------
    console.log("\n--- TASK 1: Notification Foreign Key Integrity Guard ---");

    // Test 1.1: Direct NotificationService.createNotification with invalid userId
    const syntheticUserId = "ffffffff-ffff-ffff-ffff-ffffffffffff";
    let directNotifError = false;
    let directNotifRecord: any = null;
    try {
      directNotifRecord = await NotificationService.createNotification({
        userId: syntheticUserId,
        branchId: boleBranch.id,
        title: "Test FK Guard / ፈተና",
        message: "Testing foreign key violation resilience",
        type: "APPROVAL_NOTICE",
      });
    } catch (err: any) {
      directNotifError = true;
      console.error("Direct notif error:", err);
    }
    record(
      "TASK 1.1",
      "Direct Notification Creation with Invalid UserId Falls Back to userId: null Without FK Violation",
      !directNotifError && directNotifRecord && directNotifRecord.userId === null,
      `Created ID: ${directNotifRecord?.id}, userId: ${directNotifRecord?.userId}`
    );

    // Test 1.2: Owner Approves Governance Request with Synthetic/Non-Existent requestedBy
    const govReqSynthetic = await prisma.governanceRequest.create({
      data: {
        type: "SERVICE_MUTATION",
        status: "PENDING",
        branchId: boleBranch.id,
        requestedBy: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", // Non-existent user
        reason: "Testing FK integrity on approval",
        payload: { testField: "val" },
      },
    });

    const approveSyntheticRes = await postJson(
      `/admin/governance/${govReqSynthetic.id}/review`,
      { decision: "APPROVE", reviewNote: "Approved despite synthetic requestedBy" },
      ownerHeaders
    );
    record(
      "TASK 1.2",
      "Owner Approves Governance Request with Non-Existent requestedBy Without FK Error",
      approveSyntheticRes.status === 200 && approveSyntheticRes.data?.data?.status === "APPROVED",
      `Status: ${approveSyntheticRes.status}, Decision: ${approveSyntheticRes.data?.data?.status}`
    );

    // Test 1.3: Owner Rejects Governance Request with Synthetic/Non-Existent requestedBy
    const govReqSynthetic2 = await prisma.governanceRequest.create({
      data: {
        type: "SERVICE_MUTATION",
        status: "PENDING",
        branchId: boleBranch.id,
        requestedBy: "11111111-2222-3333-4444-555555555555", // Non-existent user
        reason: "Testing FK integrity on rejection",
        payload: { testField: "val2" },
      },
    });

    const rejectSyntheticRes = await postJson(
      `/admin/governance/${govReqSynthetic2.id}/review`,
      { decision: "REJECT", reviewNote: "Rejected despite synthetic requestedBy" },
      ownerHeaders
    );
    record(
      "TASK 1.3",
      "Owner Rejects Governance Request with Non-Existent requestedBy Without FK Error",
      rejectSyntheticRes.status === 200 && rejectSyntheticRes.data?.data?.status === "REJECTED",
      `Status: ${rejectSyntheticRes.status}, Decision: ${rejectSyntheticRes.data?.data?.status}`
    );

    // --------------------------------------------------------------------------
    // TASK 2: Governance Notification Delete Option
    // --------------------------------------------------------------------------
    console.log("\n--- TASK 2: Governance Request Deletion Endpoint & Access Control ---");

    // Create a Governance Request for Bole
    const boleGovReq = await prisma.governanceRequest.create({
      data: {
        type: "PRICE_UPDATE",
        status: "APPROVED",
        branchId: boleBranch.id,
        requestedBy: boleAdminUser.id,
        reason: "Bole price change to be deleted",
        payload: { customPrice: 500 },
      },
    });

    // Test 2.1: Kazanchis Admin attempts to delete Bole request (Cross-Branch Forbidden Check)
    const crossBranchDeleteRes = await deleteJson(
      `/admin/governance/${boleGovReq.id}`,
      kazanchisHeaders
    );
    record(
      "TASK 2.1",
      "Cross-Branch Admin Deletion of Foreign Governance Request Blocked (403)",
      crossBranchDeleteRes.status === 403,
      `Expected 403, received status: ${crossBranchDeleteRes.status}`
    );

    // Test 2.2: Bole Admin deletes their own Bole governance request (Allowed 200)
    const boleAdminDeleteRes = await deleteJson(
      `/admin/governance/${boleGovReq.id}`,
      boleHeaders
    );
    const dbCheckBole = await prisma.governanceRequest.findUnique({
      where: { id: boleGovReq.id },
    });
    record(
      "TASK 2.2",
      "Assigned Branch Admin Deletes Own Branch Governance Request (200 OK)",
      boleAdminDeleteRes.status === 200 && dbCheckBole === null,
      `Status: ${boleAdminDeleteRes.status}, DB record exists: ${Boolean(dbCheckBole)}`
    );

    // Test 2.3: Owner deletes a governance request (Global clearance 200 OK)
    const ownerGovReq = await prisma.governanceRequest.create({
      data: {
        type: "CATEGORY_CREATION",
        status: "REJECTED",
        branchId: kazanchisBranch.id,
        requestedBy: kazanchisAdminUser.id,
        reason: "Kazanchis category to be deleted by Owner",
        payload: { name: "Test Category" },
      },
    });
    const ownerDeleteRes = await deleteJson(
      `/admin/governance/${ownerGovReq.id}`,
      ownerHeaders
    );
    const dbCheckOwner = await prisma.governanceRequest.findUnique({
      where: { id: ownerGovReq.id },
    });
    record(
      "TASK 2.3",
      "Owner Deletes Governance Request Across Any Branch (200 OK)",
      ownerDeleteRes.status === 200 && dbCheckOwner === null,
      `Status: ${ownerDeleteRes.status}, DB record exists: ${Boolean(dbCheckOwner)}`
    );

    // Test 2.4: Deleting non-existent governance request returns 404 NotFound
    const nonExistentDeleteRes = await deleteJson(
      `/admin/governance/00000000-0000-0000-0000-000000000099`,
      ownerHeaders
    );
    record(
      "TASK 2.4",
      "Deleting Non-Existent Governance Request Returns 404 NotFound",
      nonExistentDeleteRes.status === 404,
      `Expected 404, received status: ${nonExistentDeleteRes.status}`
    );

    // --------------------------------------------------------------------------
    // TASK 3: Employee Password Creation, Visibility & In-Modal Editing
    // --------------------------------------------------------------------------
    console.log("\n--- TASK 3: Employee Password Editing, Hashing & Portal Auth ---");

    // 3.1: Create an employee without a user account
    const testSpecialistPhone = `+2519${Math.floor(10000000 + Math.random() * 90000000)}`;
    const empWithoutUser = await prisma.employee.create({
      data: {
        firstName: "Rahel",
        lastName: "Tadesse",
        phone: testSpecialistPhone,
        branchId: boleBranch.id,
        status: "ACTIVE",
        isActive: true,
        title: "Senior Colorist",
        ritualTitle: "Master Hair Artisan",
      },
    });

    // 3.2: Update employee with new email and password to provision User account
    const specialistEmail = `rahel.specialist.${Date.now()}@eyobsalon.com`;
    const initialPassword = "InitialPassword123!";
    const provisionRes = await putJson(
      `/employees/${empWithoutUser.id}`,
      {
        email: specialistEmail,
        password: initialPassword,
      },
      ownerHeaders
    );

    const empAfterProvision = await prisma.employee.findUnique({
      where: { id: empWithoutUser.id },
      include: { user: true },
    });

    record(
      "TASK 3.1",
      "Update Employee with Email & Password Provisions Linked User Account",
      provisionRes.status === 200 &&
        Boolean(empAfterProvision?.userId) &&
        empAfterProvision?.user?.email === specialistEmail,
      `Status: ${provisionRes.status}, Linked User ID: ${empAfterProvision?.userId}, Email: ${empAfterProvision?.user?.email}`
    );

    // 3.3: Authenticate as Employee using newly provisioned credentials
    const loginRes1 = await postJson("/auth/login", {
      identifier: empWithoutUser.phone,
      password: initialPassword,
      role: "EMPLOYEE",
    });
    record(
      "TASK 3.2",
      "Specialist Authenticates with Newly Provisioned Password",
      loginRes1.status === 200 && Boolean(loginRes1.data?.tokens?.accessToken || loginRes1.data?.data?.tokens?.accessToken),
      `Status: ${loginRes1.status}, Role: ${loginRes1.data?.user?.role || loginRes1.data?.data?.user?.role}`
    );

    // 3.4: Update Employee Password to a New Secret
    const updatedPassword = "UpdatedSuperSecret456!";
    const updatePasswordRes = await putJson(
      `/employees/${empWithoutUser.id}`,
      {
        password: updatedPassword,
      },
      ownerHeaders
    );

    // Verify old password fails
    const oldLoginFail = await postJson("/auth/login", {
      identifier: empWithoutUser.phone,
      password: initialPassword,
      role: "EMPLOYEE",
    });

    // Verify new password succeeds
    const newLoginSuccess = await postJson("/auth/login", {
      identifier: empWithoutUser.phone,
      password: updatedPassword,
      role: "EMPLOYEE",
    });

    record(
      "TASK 3.3",
      "Specialist Password Reset: Old Password Revoked (401), New Password Authenticates (200 OK)",
      updatePasswordRes.status === 200 && oldLoginFail.status === 401 && newLoginSuccess.status === 200,
      `Update Status: ${updatePasswordRes.status}, Old Pass Login: ${oldLoginFail.status}, New Pass Login: ${newLoginSuccess.status}`
    );

    // 3.5: Verify Password in DB is Bcrypt Hash and not Plaintext
    const updatedUser = await prisma.user.findUnique({
      where: { id: empAfterProvision!.userId! },
      select: { password: true },
    });
    const isHashed = Boolean(updatedUser?.password.startsWith("$2a$") || updatedUser?.password.startsWith("$2b$"));
    record(
      "TASK 3.4",
      "Password is Securely Stored as Bcrypt Hash (Not Plaintext)",
      isHashed && updatedUser?.password !== updatedPassword,
      `Hash prefix: ${updatedUser?.password.slice(0, 7)}...`
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

    if (failedCount === 0) {
      console.log("\n✅ ALL NOTIFICATION FK, GOVERNANCE DELETE & AUTH AUDIT CHECKS PASSED PERFECTLY!");
    } else {
      console.error("\n❌ SOME CHECKS FAILED!");
      process.exit(1);
    }
  } catch (err) {
    console.error("FATAL UNEXPECTED ERROR IN AUDIT:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

