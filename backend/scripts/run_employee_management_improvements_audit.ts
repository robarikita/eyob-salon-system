import { PrismaClient, UserRole } from "@prisma/client";
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

async function patchJson(endpoint: string, data: any = {}, headers: Record<string, string> = {}) {
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
    headers: { "Content-Type": "application/json", "x-test-ip": testRunIp, ...headers },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function loginUser(phone: string, role: string) {
  const res = await postJson("/auth/login", {
    phone,
    password: "Password123!",
    role,
  });
  const token = res.data?.data?.tokens?.accessToken || res.data?.tokens?.accessToken || res.data?.token || res.data?.data?.token;
  if (res.status === 200 && token) {
    return { token, user: res.data?.data?.user || res.data?.user };
  }
  throw new Error(`Login failed for ${phone} (${role}): ${JSON.stringify(res.data)}`);
}

async function runAudit() {
  console.log("\n===============================================================================");
  console.log("  EMPLOYEE MANAGEMENT IMPROVEMENTS AUDIT");
  console.log("  Owner Permissions, Approval Workflow, Notifications, Scoping, Specialties");
  console.log("===============================================================================\n");

  try {
    // 0. Seed test fixtures
    console.log("--- STEP 0: Fixtures & Auth Setup ---");
    const passwordHash = await hashPassword("Password123!");

    // Branch A & Branch B
    const branchA = await prisma.branch.upsert({
      where: { slug: `audit-branch-a-${ts}` },
      create: {
        name: `Audit Branch A ${ts}`,
        slug: `audit-branch-a-${ts}`,
        city: "Addis Ababa",
        addressLine: "Bole Medhanialem",
        phoneNumber: `+251911${String(ts).slice(-6)}`,
        isActive: true,
      },
      update: {},
    });

    const branchB = await prisma.branch.upsert({
      where: { slug: `audit-branch-b-${ts}` },
      create: {
        name: `Audit Branch B ${ts}`,
        slug: `audit-branch-b-${ts}`,
        city: "Addis Ababa",
        addressLine: "Kazanchis",
        phoneNumber: `+251912${String(ts).slice(-6)}`,
        isActive: true,
      },
      update: {},
    });

    // Owner user
    const ownerPhone = `+251910${String(ts).slice(-6)}`;
    const ownerUser = await prisma.user.create({
      data: {
        phone: ownerPhone,
        password: passwordHash,
        firstName: "Proprietor",
        lastName: "Eyob",
        role: UserRole.OWNER,
      },
    });

    // Branch Admin for Branch A
    const adminPhoneA = `+251913${String(ts).slice(-6)}`;
    const adminUserA = await prisma.user.create({
      data: {
        phone: adminPhoneA,
        password: passwordHash,
        firstName: "Admin",
        lastName: "BranchA",
        role: UserRole.BRANCH_ADMIN,
        branchId: branchA.id,
      },
    });

    // Branch Admin for Branch B
    const adminPhoneB = `+251914${String(ts).slice(-6)}`;
    const adminUserB = await prisma.user.create({
      data: {
        phone: adminPhoneB,
        password: passwordHash,
        firstName: "Admin",
        lastName: "BranchB",
        role: UserRole.BRANCH_ADMIN,
        branchId: branchB.id,
      },
    });

    // Service category & service in DB
    const testCategory = await prisma.serviceCategory.create({
      data: {
        name: "Ritual Styling",
        slug: `ritual-styling-${ts}`,
        status: "APPROVED",
        isActive: true,
      },
    });

    const testService = await prisma.service.create({
      data: {
        code: `RIT-${ts}`,
        name: "Royal Silk Hair Treatment",
        slug: `royal-silk-${ts}`,
        category: "HAIR",
        categoryId: testCategory.id,
        durationMinutes: 60,
        basePrice: 1200,
        isActive: true,
        approvalStatus: "APPROVED",
      },
    });

    // Logins
    const { token: ownerToken } = await loginUser(ownerPhone, "OWNER");
    const { token: adminTokenA } = await loginUser(adminPhoneA, "BRANCH_ADMIN");
    const { token: adminTokenB } = await loginUser(adminPhoneB, "BRANCH_ADMIN");

    record("SETUP", "Authenticate Users", true, "Owner and Branch Admins A & B authenticated successfully.");

    // STEP 1: Owner Direct Employee Creation & Branch Admin Notification
    console.log("\n--- STEP 1: Owner Direct Creation & Notification ---");
    const empOwnerPhone = `+251920${String(ts).slice(-6)}`;
    const createOwnerRes = await postJson(
      "/employees",
      {
        fullName: "Owner Hired Specialist",
        phone: empOwnerPhone,
        branchId: branchA.id,
        title: "Master Artisan",
        ritualTitle: "Haute Stylist",
      },
      { Authorization: `Bearer ${ownerToken}` }
    );

    const ownerCreatedEmp = createOwnerRes.data?.data;
    const ownerCreateOk =
      createOwnerRes.status === 201 &&
      ownerCreatedEmp?.status === "ACTIVE" &&
      ownerCreatedEmp?.isActive === true;

    record(
      "STEP 1",
      "Owner Direct Employee Creation",
      ownerCreateOk,
      `Status: ${createOwnerRes.status}, Employee status: ${ownerCreatedEmp?.status}, isActive: ${ownerCreatedEmp?.isActive}`
    );

    // Verify Branch Admin A received in-app EMPLOYEE_ASSIGNMENT notification
    const adminANotifs = await prisma.notification.findMany({
      where: { userId: adminUserA.id, type: "EMPLOYEE_ASSIGNMENT" },
    });
    const notifReceived = adminANotifs.length > 0;
    record(
      "STEP 1",
      "Branch Admin Assignment Notification",
      notifReceived,
      `Notifications for Admin A: ${adminANotifs.length} (Title: ${adminANotifs[0]?.title || "None"})`
    );

    // STEP 2: Branch Admin Employee Registration Interceptor & Validation
    console.log("\n--- STEP 2: Branch Admin Employee Registration Interceptor ---");
    // 2a. Missing hireReason -> 400 Validation Error
    const empBadPhone = `+251921${String(ts).slice(-6)}`;
    const createNoReasonRes = await postJson(
      "/employees",
      {
        fullName: "No Reason Specialist",
        phone: empBadPhone,
        branchId: branchA.id,
        title: "Stylist",
      },
      { Authorization: `Bearer ${adminTokenA}` }
    );

    const noReasonBlocked = createNoReasonRes.status === 400;
    record(
      "STEP 2",
      "Require Hire Reason for Branch Admin",
      noReasonBlocked,
      `Expected 400, got ${createNoReasonRes.status}: ${createNoReasonRes.data?.message}`
    );

    // 2b. Cross-branch creation attempt by Branch Admin A on Branch B -> 403 Forbidden
    const empCrossPhone = `+251922${String(ts).slice(-6)}`;
    const createCrossBranchRes = await postJson(
      "/employees",
      {
        fullName: "Cross Branch Specialist",
        phone: empCrossPhone,
        branchId: branchB.id,
        title: "Stylist",
        hireReason: "Trying to hire into other branch",
      },
      { Authorization: `Bearer ${adminTokenA}` }
    );

    const crossBranchBlocked = createCrossBranchRes.status === 403;
    record(
      "STEP 2",
      "Prevent Branch Admin Cross-Branch Creation",
      crossBranchBlocked,
      `Expected 403, got ${createCrossBranchRes.status}: ${createCrossBranchRes.data?.message}`
    );

    // 2c. Valid Branch Admin submission -> PENDING_APPROVAL + GovernanceRequest + Owner Notification
    const empValidPhone = `+251923${String(ts).slice(-6)}`;
    const createValidRes = await postJson(
      "/employees",
      {
        fullName: "Proposed Specialist",
        amharicName: "ታደሰ ለማ",
        phone: empValidPhone,
        branchId: branchA.id,
        title: "Senior Colorist",
        hireReason: "Expanding bridal hair capacity for upcoming wedding season.",
      },
      { Authorization: `Bearer ${adminTokenA}` }
    );

    const proposedEmp = createValidRes.data?.data;
    const proposalCreated =
      createValidRes.status === 201 &&
      proposedEmp?.status === "PENDING_APPROVAL" &&
      proposedEmp?.isActive === false;

    record(
      "STEP 2",
      "Branch Admin Proposal -> PENDING_APPROVAL & Inactive",
      proposalCreated,
      `Status: ${createValidRes.status}, Employee Status: ${proposedEmp?.status}, isActive: ${proposedEmp?.isActive}`
    );

    // Verify GovernanceRequest record created
    const govReq = await prisma.governanceRequest.findFirst({
      where: {
        type: "EMPLOYEE_REGISTRATION",
        branchId: branchA.id,
        requestedBy: adminUserA.id,
        status: "PENDING",
      },
    });

    const govReqExists = Boolean(govReq && (govReq.payload as any)?.employeeId === proposedEmp?.id);
    record(
      "STEP 2",
      "GovernanceRequest Created in Database",
      govReqExists,
      `Governance Request ID: ${govReq?.id}, Reason: ${govReq?.reason}`
    );

    // Verify Owner received GOVERNANCE_REQUEST notification
    const ownerNotifs = await prisma.notification.findMany({
      where: { userId: ownerUser.id, type: "GOVERNANCE_REQUEST" },
    });
    const ownerNotified = ownerNotifs.length > 0;
    record(
      "STEP 2",
      "Owner Notified of Governance Proposal",
      ownerNotified,
      `Owner Notifications: ${ownerNotifs.length} (Title: ${ownerNotifs[0]?.title || "None"})`
    );

    // STEP 3: Owner Governance Approval & Rejection Workflows
    console.log("\n--- STEP 3: Owner Governance Review ---");
    if (govReq) {
      const reviewRes = await postJson(
        `/admin/governance/${govReq.id}/review`,
        {
          decision: "APPROVE",
          reviewNote: "Approved for bridal capacity expansion.",
        },
        { Authorization: `Bearer ${ownerToken}` }
      );

      const reviewOk = reviewRes.status === 200;
      const approvedEmpDb = await prisma.employee.findUnique({
        where: { id: proposedEmp.id },
      });

      const empNowActive = approvedEmpDb?.status === "ACTIVE" && approvedEmpDb?.isActive === true;
      record(
        "STEP 3",
        "Owner Approves Registration -> Employee ACTIVE & isActive=true",
        reviewOk && empNowActive,
        `Review status: ${reviewRes.status}, DB Status: ${approvedEmpDb?.status}, isActive: ${approvedEmpDb?.isActive}`
      );

      // Verify Branch Admin A received APPROVAL_NOTICE notification
      const adminApprovalNotifs = await prisma.notification.findMany({
        where: { userId: adminUserA.id, type: "APPROVAL_NOTICE" },
      });
      const approvalNotified = adminApprovalNotifs.length > 0;
      record(
        "STEP 3",
        "Branch Admin Receives Approval Notice",
        approvalNotified,
        `Admin A Approval Notices: ${adminApprovalNotifs.length} (Message: ${adminApprovalNotifs[0]?.message})`
      );
    }

    // Test rejection workflow
    const empRejectPhone = `+251924${String(ts).slice(-6)}`;
    const createRejectRes = await postJson(
      "/employees",
      {
        fullName: "Declined Candidate",
        phone: empRejectPhone,
        branchId: adminUserA.branchId!,
        title: "Intern",
        hireReason: "Extra intern on floor.",
      },
      { Authorization: `Bearer ${adminTokenA}` }
    );

    const rejectedEmp = createRejectRes.data?.data;
    const govReqReject = await prisma.governanceRequest.findFirst({
      where: {
        type: "EMPLOYEE_REGISTRATION",
        requestedBy: adminUserA.id,
        status: "PENDING",
        reason: "Extra intern on floor.",
      },
    });

    if (govReqReject) {
      const rejectRes = await postJson(
        `/admin/governance/${govReqReject.id}/review`,
        {
          decision: "REJECT",
          reviewNote: "Headcount ceiling reached for branch interns.",
        },
        { Authorization: `Bearer ${ownerToken}` }
      );

      const rejectedEmpDb = await prisma.employee.findUnique({
        where: { id: rejectedEmp.id },
      });

      const rejectConfirmed =
        rejectRes.status === 200 &&
        rejectedEmpDb?.status === "REJECTED" &&
        rejectedEmpDb?.isActive === false;

      record(
        "STEP 3",
        "Owner Rejects Registration -> Employee REJECTED & isActive=false",
        rejectConfirmed,
        `Status: ${rejectedEmpDb?.status}, isActive: ${rejectedEmpDb?.isActive}`
      );
    }

    // STEP 4: Owner Branch Transfer & Target Branch Notification
    console.log("\n--- STEP 4: Owner Branch Transfer ---");
    const transferRes = await patchJson(
      `/employees/${ownerCreatedEmp.id}`,
      {
        branchId: branchB.id,
      },
      { Authorization: `Bearer ${ownerToken}` }
    );

    const transferredEmp = transferRes.data?.data;
    const transferOk = transferRes.status === 200 && transferredEmp?.branchId === branchB.id;
    record(
      "STEP 4",
      "Owner Transfers Employee to Branch B",
      transferOk,
      `Target Branch: ${branchB.id}, New Employee Branch: ${transferredEmp?.branchId}`
    );

    // Verify Branch Admin B received EMPLOYEE_ASSIGNMENT notification
    const adminBNotifs = await prisma.notification.findMany({
      where: { userId: adminUserB.id, type: "EMPLOYEE_ASSIGNMENT" },
    });
    const transferNotifReceived = adminBNotifs.length > 0;
    record(
      "STEP 4",
      "Receiving Branch Admin B Notified of Reassignment",
      transferNotifReceived,
      `Notifications for Admin B: ${adminBNotifs.length} (Title: ${adminBNotifs[0]?.title})`
    );

    // STEP 5: Strict Branch Admin Scoping & Query Isolation
    console.log("\n--- STEP 5: Strict Branch Admin Scoping ---");
    // Branch Admin A querying branch B explicitly -> 403 Forbidden
    const crossQueryRes = await getJson(`/employees?branchId=${branchB.id}`, {
      Authorization: `Bearer ${adminTokenA}`,
    });
    const crossQueryBlocked = crossQueryRes.status === 403;
    record(
      "STEP 5",
      "Branch Admin Access to Other Branch Blocked (403)",
      crossQueryBlocked,
      `Expected 403, got ${crossQueryRes.status}: ${crossQueryRes.data?.message}`
    );

    // Branch Admin A querying /employees without branchId -> only gets Branch A employees
    const scopedListRes = await getJson(`/employees`, {
      Authorization: `Bearer ${adminTokenA}`,
    });
    const scopedEmployees: any[] = scopedListRes.data?.data || [];
    const allBelongToBranchA =
      scopedEmployees.length > 0 &&
      scopedEmployees.every((e) => e.branchId === branchA.id);

    record(
      "STEP 5",
      "Branch Admin Auto-Scoped to Assigned Branch Only",
      allBelongToBranchA,
      `Returned ${scopedEmployees.length} employees, all strictly belonging to Branch A (${branchA.name})`
    );

    // STEP 6: Customer Specialties & Service Categorization
    console.log("\n--- STEP 6: Customer Specialties Derived from PostgreSQL ---");
    // Assign service to employee
    await prisma.employeeService.create({
      data: {
        employeeId: proposedEmp.id,
        serviceId: testService.id,
        isQualified: true,
      },
    });

    const publicListRes = await getJson(`/employees?branchId=${branchA.id}`);
    const publicList: any[] = publicListRes.data?.data || [];
    const targetEmpWithSpecialties = publicList.find((e) => e.id === proposedEmp.id);

    const hasSpecialties =
      Array.isArray(targetEmpWithSpecialties?.specialties) &&
      targetEmpWithSpecialties.specialties.length > 0;

    record(
      "STEP 6",
      "Derive Real DB Specialties for Customer Booking Cards",
      hasSpecialties,
      `Specialties exposed: ${JSON.stringify(targetEmpWithSpecialties?.specialties)}`
    );

    // STEP 7: Status Toggle Workflow
    console.log("\n--- STEP 7: Status Toggle Workflow ---");
    const toggleRes = await patchJson(
      `/employees/${proposedEmp.id}/toggle-status`,
      {},
      { Authorization: `Bearer ${ownerToken}` }
    );
    const toggledEmp = toggleRes.data?.data || toggleRes.data?.employee;
    const isNowInactive = toggledEmp?.status === "INACTIVE" && toggledEmp?.isActive === false;

    record(
      "STEP 7",
      "Toggle Active -> INACTIVE with isActive=false",
      isNowInactive,
      `Status: ${toggledEmp?.status}, isActive: ${toggledEmp?.isActive}`
    );

    // Clean up test data
    console.log("\n--- Cleanup ---");
    await prisma.scheduleException.deleteMany({
      where: { employee: { phone: { in: [empOwnerPhone, empValidPhone, empRejectPhone] } } },
    });
    await prisma.employeeSchedule.deleteMany({
      where: { employee: { phone: { in: [empOwnerPhone, empValidPhone, empRejectPhone] } } },
    });
    await prisma.employeeService.deleteMany({
      where: { employee: { phone: { in: [empOwnerPhone, empValidPhone, empRejectPhone] } } },
    });
    await prisma.governanceRequest.deleteMany({
      where: { branchId: { in: [branchA.id, branchB.id] } },
    });
    await prisma.notification.deleteMany({
      where: { userId: { in: [ownerUser.id, adminUserA.id, adminUserB.id] } },
    });
    await prisma.employee.deleteMany({
      where: { phone: { in: [empOwnerPhone, empValidPhone, empRejectPhone] } },
    });
    await prisma.service.deleteMany({
      where: { id: testService.id },
    });
    await prisma.serviceCategory.deleteMany({
      where: { id: testCategory.id },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerUser.id, adminUserA.id, adminUserB.id] } },
    });
    await prisma.branch.deleteMany({
      where: { id: { in: [branchA.id, branchB.id] } },
    });

  } catch (err: any) {
    console.error("Audit encounter unexpected exception:", err);
    record("FATAL", "Execution uncaught exception", false, err.message);
  } finally {
    await prisma.$disconnect();
  }

  // Summary
  console.log("\n===============================================================================");
  console.log("  AUDIT SUMMARY");
  console.log("===============================================================================");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error(`\n❌ AUDIT FAILED with ${failed} failure(s).`);
    process.exit(1);
  } else {
    console.log(`\n✅ ALL ${passed} SCENARIOS PASSED WITH ZERO ERRORS.`);
    process.exit(0);
  }
}

runAudit();
