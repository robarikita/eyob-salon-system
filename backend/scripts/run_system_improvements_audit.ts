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
  console.log(" EYOB SALON — COMPREHENSIVE SYSTEM IMPROVEMENTS AUDIT            ");
  console.log("=================================================================\n");

  try {
    // 1. Setup Test Fixtures: Bole & Kazanchis branches
    let boleBranch = await prisma.branch.findUnique({ where: { slug: "sys-audit-bole" } });
    if (!boleBranch) {
      boleBranch = await prisma.branch.create({
        data: {
          name: "Sys Audit Bole",
          slug: "sys-audit-bole",
          phoneNumber: "+251911444111",
          addressLine: "Bole Atlas",
          city: "Addis Ababa",
          isActive: true,
        },
      });
    }

    let kazanchisBranch = await prisma.branch.findUnique({ where: { slug: "sys-audit-kazanchis" } });
    if (!kazanchisBranch) {
      kazanchisBranch = await prisma.branch.create({
        data: {
          name: "Sys Audit Kazanchis",
          slug: "sys-audit-kazanchis",
          phoneNumber: "+251911444222",
          addressLine: "Kazanchis Menelik",
          city: "Addis Ababa",
          isActive: true,
        },
      });
    }

    const testPassword = "Password123!";
    const hashedPassword = await hashPassword(testPassword);

    // 2. Setup Bole Branch Admin
    let boleAdminUser = await prisma.user.findFirst({
      where: { phone: "+251911444333" },
    });
    if (!boleAdminUser) {
      boleAdminUser = await prisma.user.create({
        data: {
          firstName: "SysBole",
          lastName: "Admin",
          phone: "+251911444333",
          email: "sys.bole.admin@eyob.com",
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

    // 3. Setup Kazanchis Branch Admin
    let kazanchisAdminUser = await prisma.user.findFirst({
      where: { phone: "+251911444555" },
    });
    if (!kazanchisAdminUser) {
      kazanchisAdminUser = await prisma.user.create({
        data: {
          firstName: "SysKazanchis",
          lastName: "Admin",
          phone: "+251911444555",
          email: "sys.kazanchis.admin@eyob.com",
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

    // 4. Setup Owner User
    let ownerUser = await prisma.user.findFirst({
      where: { phone: "+251911444444" },
    });
    if (!ownerUser) {
      ownerUser = await prisma.user.create({
        data: {
          firstName: "Sys",
          lastName: "Owner",
          phone: "+251911444444",
          email: "sys.owner@eyob.com",
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
    // TASK 1: Employee Approval & Rejection Without Prisma Errors
    // --------------------------------------------------------------------------
    console.log("\n--- TASK 1: Employee Approval & Rejection Without Prisma Errors ---");

    // Case 1A: Existing Preliminary Employee Approval
    const emp1 = await prisma.employee.create({
      data: {
        firstName: "Tigist",
        lastName: "Alemayehu",
        phone: `+2519${Math.floor(10000000 + Math.random() * 90000000)}`,
        branchId: boleBranch.id,
        status: "PENDING_APPROVAL",
        isActive: false,
      },
    });

    const govReq1 = await prisma.governanceRequest.create({
      data: {
        type: "EMPLOYEE_REGISTRATION",
        status: "PENDING",
        branchId: boleBranch.id,
        requestedBy: boleAdminUser.id,
        reason: "Senior colorist expansion",
        payload: {
          employeeId: emp1.id,
          firstName: emp1.firstName,
          lastName: emp1.lastName,
          phone: emp1.phone,
        },
      },
    });

    const reviewRes1 = await postJson(
      `/admin/governance/${govReq1.id}/review`,
      { decision: "APPROVE", reviewNote: "Approved by Owner" },
      ownerHeaders
    );
    const updatedEmp1 = await prisma.employee.findUnique({ where: { id: emp1.id } });
    record(
      "TASK 1.1",
      "Owner Approves Preliminary Employee Without Prisma Error",
      reviewRes1.status === 200 && updatedEmp1?.status === "ACTIVE" && updatedEmp1?.isActive === true,
      `Status: ${reviewRes1.status}, Employee status: ${updatedEmp1?.status}, isActive: ${updatedEmp1?.isActive}`
    );

    // Case 1B: Existing Preliminary Employee Rejection
    const emp2 = await prisma.employee.create({
      data: {
        firstName: "Hanna",
        lastName: "Mekonnen",
        phone: `+2519${Math.floor(10000000 + Math.random() * 90000000)}`,
        branchId: boleBranch.id,
        status: "PENDING_APPROVAL",
        isActive: false,
      },
    });

    const govReq2 = await prisma.governanceRequest.create({
      data: {
        type: "EMPLOYEE_REGISTRATION",
        status: "PENDING",
        branchId: boleBranch.id,
        requestedBy: boleAdminUser.id,
        reason: "Junior trainee",
        payload: {
          employeeId: emp2.id,
          firstName: emp2.firstName,
          lastName: emp2.lastName,
          phone: emp2.phone,
        },
      },
    });

    const reviewRes2 = await postJson(
      `/admin/governance/${govReq2.id}/review`,
      { decision: "REJECT", reviewNote: "Incomplete credentials" },
      ownerHeaders
    );
    const updatedEmp2 = await prisma.employee.findUnique({ where: { id: emp2.id } });
    record(
      "TASK 1.2",
      "Owner Rejects Preliminary Employee Without Prisma Error",
      reviewRes2.status === 200 && updatedEmp2?.status === "REJECTED" && updatedEmp2?.isActive === false,
      `Status: ${reviewRes2.status}, Employee status: ${updatedEmp2?.status}, isActive: ${updatedEmp2?.isActive}`
    );

    // Case 1C: Missing Preliminary Employee Resilient Approval Fallback
    const syntheticId = "00000000-0000-0000-0000-000000000001";
    const govReq3 = await prisma.governanceRequest.create({
      data: {
        type: "EMPLOYEE_REGISTRATION",
        status: "PENDING",
        branchId: boleBranch.id,
        requestedBy: boleAdminUser.id,
        reason: "Direct payload proposal",
        payload: {
          id: syntheticId,
          firstName: "Almaz",
          lastName: "Bekele",
          phone: `+2519${Math.floor(10000000 + Math.random() * 90000000)}`,
        },
      },
    });

    const reviewRes3 = await postJson(
      `/admin/governance/${govReq3.id}/review`,
      { decision: "APPROVE", reviewNote: "Created and approved" },
      ownerHeaders
    );
    const updatedEmp3 = await prisma.employee.findFirst({ where: { firstName: "Almaz", lastName: "Bekele" } });
    record(
      "TASK 1.3",
      "Owner Approves Missing Preliminary Record via Resilient Creation Fallback",
      reviewRes3.status === 200 && updatedEmp3?.status === "ACTIVE",
      `Status: ${reviewRes3.status}, Created Employee: ${updatedEmp3?.firstName} ${updatedEmp3?.lastName}, status: ${updatedEmp3?.status}`
    );

    // --------------------------------------------------------------------------
    // TASK 2: Branch Deactivation Notifications & Dashboard Warning
    // --------------------------------------------------------------------------
    console.log("\n--- TASK 2: Branch Deactivation Notifications ---");

    // Deactivate Kazanchis branch
    const deactivateRes = await patchJson(
      `/branches/${kazanchisBranch.id}/toggle-status`,
      { isActive: false },
      ownerHeaders
    );

    // Check if Kazanchis Admin received deactivation notification
    const kazanchisNotifs = await prisma.notification.findMany({
      where: {
        userId: kazanchisAdminUser.id,
        branchId: kazanchisBranch.id,
        type: "OWNER_MUTATION",
      },
      orderBy: { createdAt: "desc" },
    });

    const hasDeactivationNotice = kazanchisNotifs.some(
      (n) => n.title.includes("Branch Deactivated") || n.message.includes("deactivated by Owner")
    );

    record(
      "TASK 2.1",
      "Branch Deactivation Dispatches Notification to Branch Admin",
      deactivateRes.status === 200 && hasDeactivationNotice,
      `Deactivate Status: ${deactivateRes.status}, Notices count: ${kazanchisNotifs.length}, Notice found: ${hasDeactivationNotice}`
    );

    // Reactivate Kazanchis branch
    await patchJson(`/branches/${kazanchisBranch.id}/toggle-status`, { isActive: true }, ownerHeaders);

    // --------------------------------------------------------------------------
    // TASK 3: Notification Persistence & Intentional Manual Deletion
    // --------------------------------------------------------------------------
    console.log("\n--- TASK 3: Notification Persistence & Intentional Deletion ---");

    const notifA = await prisma.notification.create({
      data: {
        userId: boleAdminUser.id,
        branchId: boleBranch.id,
        title: "Test Alert A",
        message: "First persistent test notice",
        type: "APPROVAL_NOTICE",
      },
    });

    const notifB = await prisma.notification.create({
      data: {
        userId: boleAdminUser.id,
        branchId: boleBranch.id,
        title: "Test Alert B",
        message: "Second persistent test notice",
        type: "APPROVAL_NOTICE",
      },
    });

    // Delete single notification
    const deleteSingleRes = await deleteJson(`/notifications/${notifA.id}`, boleHeaders);
    const checkNotifA = await prisma.notification.findUnique({ where: { id: notifA.id } });
    const checkNotifB = await prisma.notification.findUnique({ where: { id: notifB.id } });

    record(
      "TASK 3.1",
      "Explicit Single Notification Deletion (DELETE /notifications/:id)",
      deleteSingleRes.status === 200 && checkNotifA === null && checkNotifB !== null,
      `Delete Status: ${deleteSingleRes.status}, Deleted: ${checkNotifA === null}, Persisting: ${checkNotifB !== null}`
    );

    // Clear all notifications
    const clearAllRes = await deleteJson("/notifications", boleHeaders);
    const checkRemaining = await prisma.notification.count({ where: { userId: boleAdminUser.id } });
    record(
      "TASK 3.2",
      "Bulk Notification Deletion (DELETE /notifications)",
      clearAllRes.status === 200 && checkRemaining === 0,
      `Clear Status: ${clearAllRes.status}, Remaining count: ${checkRemaining}`
    );

    // --------------------------------------------------------------------------
    // TASK 4: Governance Page Status Tabs Dynamic Filtering
    // --------------------------------------------------------------------------
    console.log("\n--- TASK 4: Governance Status Tabs Filtering ---");

    const pendingGovRes = await getJson("/admin/governance?status=PENDING", ownerHeaders);
    const pendingList = pendingGovRes.data?.data || pendingGovRes.data || [];
    const allArePending = Array.isArray(pendingList) && pendingList.every((r: any) => r.status === "PENDING");
    record(
      "TASK 4.1",
      "Filter Tab 'PENDING' Returns Only Pending Requests",
      allArePending,
      `Count: ${pendingList.length}, All PENDING: ${allArePending}`
    );

    const approvedGovRes = await getJson("/admin/governance?status=APPROVED", ownerHeaders);
    const approvedList = approvedGovRes.data?.data || approvedGovRes.data || [];
    const allAreApproved = Array.isArray(approvedList) && approvedList.every((r: any) => r.status === "APPROVED");
    record(
      "TASK 4.2",
      "Filter Tab 'APPROVED' Returns Only Approved Requests",
      allAreApproved,
      `Count: ${approvedList.length}, All APPROVED: ${allAreApproved}`
    );

    const rejectedGovRes = await getJson("/admin/governance?status=REJECTED", ownerHeaders);
    const rejectedList = rejectedGovRes.data?.data || rejectedGovRes.data || [];
    const allAreRejected = Array.isArray(rejectedList) && rejectedList.every((r: any) => r.status === "REJECTED");
    record(
      "TASK 4.3",
      "Filter Tab 'REJECTED' Returns Only Rejected Requests",
      allAreRejected,
      `Count: ${rejectedList.length}, All REJECTED: ${allAreRejected}`
    );

    // --------------------------------------------------------------------------
    // TASK 5: Automatic Timestamps (CreatedAt & UpdatedAt)
    // --------------------------------------------------------------------------
    console.log("\n--- TASK 5: Automatic Timestamps ---");

    const sampleGov = await prisma.governanceRequest.findFirst({
      orderBy: { createdAt: "desc" },
    });

    const hasTimestamps = sampleGov && sampleGov.createdAt instanceof Date && sampleGov.updatedAt instanceof Date;
    record(
      "TASK 5.1",
      "PostgreSQL/Prisma Generates Real Timestamps on Governance Requests",
      Boolean(hasTimestamps),
      `createdAt: ${sampleGov?.createdAt?.toISOString()}, updatedAt: ${sampleGov?.updatedAt?.toISOString()}`
    );

    // --------------------------------------------------------------------------
    // TASK 6: Global Branch Filtering Across Administration Modules
    // --------------------------------------------------------------------------
    console.log("\n--- TASK 6: Global Branch Filtering Across Admin Modules ---");

    // Owner filters governance requests by Bole Branch
    const ownerBoleGovRes = await getJson(`/admin/governance?branchId=${boleBranch.id}`, ownerHeaders);
    const ownerBoleGovList = ownerBoleGovRes.data?.data || ownerBoleGovRes.data || [];
    const allGovBole = Array.isArray(ownerBoleGovList) && ownerBoleGovList.every((r: any) => r.branchId === boleBranch.id);
    record(
      "TASK 6.1",
      "Owner Filters Governance Requests by BranchId Parameter",
      allGovBole && ownerBoleGovList.length > 0,
      `Count: ${ownerBoleGovList.length}, Scoped strictly to Bole: ${allGovBole}`
    );

    // Owner filters employees by Bole Branch
    const ownerBoleEmpRes = await getJson(`/employees?branchId=${boleBranch.id}`, ownerHeaders);
    const ownerBoleEmpList = ownerBoleEmpRes.data?.data || ownerBoleEmpRes.data || [];
    const allEmpBole = Array.isArray(ownerBoleEmpList) && ownerBoleEmpList.every((e: any) => e.branchId === boleBranch.id);
    record(
      "TASK 6.2",
      "Owner Filters Employees by BranchId Parameter",
      allEmpBole && ownerBoleEmpList.length > 0,
      `Count: ${ownerBoleEmpList.length}, Scoped strictly to Bole: ${allEmpBole}`
    );

    // Branch Admin attempting to query Kazanchis employees is blocked (403)
    const crossBranchEmpRes = await getJson(`/employees?branchId=${kazanchisBranch.id}`, boleHeaders);
    record(
      "TASK 6.3",
      "Branch Admin Access to Foreign Branch Query Returns 403 Forbidden",
      crossBranchEmpRes.status === 403,
      `Status: ${crossBranchEmpRes.status}`
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
      console.log("\n✅ ALL SYSTEM IMPROVEMENTS AUDIT CHECKS PASSED PERFECTLY!");
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

