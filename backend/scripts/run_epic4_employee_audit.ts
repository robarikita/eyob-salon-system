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

async function putJson(endpoint: string, data: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
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

async function runEpic4Audit() {
  console.log("==========================================================================");
  console.log("   EYOB SALON — SPRINT 4 EPIC 4: EMPLOYEE & STAFF MANAGEMENT AUDIT        ");
  console.log("==========================================================================\n");

  const cleanupUserIds: string[] = [];
  const cleanupEmployeeIds: string[] = [];
  const cleanupBranchIds: string[] = [];
  const cleanupServiceIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP: Branches & Authenticated Roles
    // -------------------------------------------------------------------------
    console.log("--- SETUP: Provisioning Branches & Test Principals ---");

    // Ensure two active branches with branch hours
    let branchA = await prisma.branch.findFirst({
      where: { slug: "bole-bulbula" },
      include: { branchHours: true },
    });
    if (!branchA) {
      branchA = await prisma.branch.create({
        data: {
          name: "Bole Sanctuary",
          slug: `bole-${ts}`,
          city: "Addis Ababa",
          isActive: true,
        },
        include: { branchHours: true },
      });
      cleanupBranchIds.push(branchA.id);
    }

    // Ensure Branch A has operating hours
    if (!branchA.branchHours || branchA.branchHours.length === 0) {
      await prisma.branchHours.createMany({
        data: Array.from({ length: 7 }, (_, d) => ({
          branchId: branchA!.id,
          dayOfWeek: d,
          openTime: "08:00",
          closeTime: "20:00",
          isClosed: false,
        })),
      });
    }

    let branchB = await prisma.branch.findFirst({
      where: { slug: "kazanchis" },
      include: { branchHours: true },
    });
    if (!branchB) {
      branchB = await prisma.branch.create({
        data: {
          name: "Kazanchis Sanctuary",
          slug: `kazanchis-${ts}`,
          city: "Addis Ababa",
          isActive: true,
        },
        include: { branchHours: true },
      });
      cleanupBranchIds.push(branchB.id);
    }

    if (!branchB.branchHours || branchB.branchHours.length === 0) {
      await prisma.branchHours.createMany({
        data: Array.from({ length: 7 }, (_, d) => ({
          branchId: branchB!.id,
          dayOfWeek: d,
          openTime: "08:00",
          closeTime: "20:00",
          isClosed: false,
        })),
      });
    }

    // Provision Owner account
    const ownerPhone = `+251911${String(ts).slice(-6)}`;
    const ownerPwd = "OwnerSecurePass#2025!";
    const ownerHashed = await hashPassword(ownerPwd);
    const ownerUser = await prisma.user.create({
      data: {
        firstName: "Proprietor",
        lastName: "Eyob",
        phone: ownerPhone,
        role: UserRole.OWNER,
        password: ownerHashed,
      },
    });
    cleanupUserIds.push(ownerUser.id);

    // Login as Owner
    const ownerLogin = await postJson("/auth/login", {
      identifier: ownerPhone,
      password: ownerPwd,
      role: "OWNER",
    });
    const ownerToken =
      ownerLogin.data?.data?.tokens?.accessToken ||
      ownerLogin.data?.tokens?.accessToken ||
      ownerLogin.data?.accessToken;
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };

    record("SETUP", "Owner Provision & Login", ownerLogin.status === 200 && !!ownerToken, `Owner authenticated (phone: ${ownerPhone})`);

    // Provision Branch Admin A for Branch A
    const adminAPhone = `+251922${String(ts).slice(-6)}`;
    const adminAPwd = "AdminASecure#2025!";
    const adminAHashed = await hashPassword(adminAPwd);
    const adminAUser = await prisma.user.create({
      data: {
        firstName: "Bole",
        lastName: "Admin",
        phone: adminAPhone,
        role: UserRole.BRANCH_ADMIN,
        branchId: branchA.id,
        password: adminAHashed,
      },
    });
    cleanupUserIds.push(adminAUser.id);

    // Login as Branch Admin A
    const adminALogin = await postJson("/auth/login", {
      identifier: adminAPhone,
      password: adminAPwd,
      role: "BRANCH_ADMIN",
    });
    const adminAToken =
      adminALogin.data?.data?.tokens?.accessToken ||
      adminALogin.data?.tokens?.accessToken ||
      adminALogin.data?.accessToken;
    const adminAHeaders = { Authorization: `Bearer ${adminAToken}` };

    record("SETUP", "Branch Admin A Login", adminALogin.status === 200 && !!adminAToken, `Admin A scoped to branch ${branchA.name}`);

    // Create a Specialist in Branch B via Owner
    const empBPhone = `+251933${String(ts).slice(-6)}`;
    const empBRes = await postJson(
      "/employees",
      {
        fullName: "Hanna Girma",
        phone: empBPhone,
        branchId: branchB.id,
        title: "Senior Colorist",
        workstation: "Chair B-01",
      },
      ownerHeaders
    );
    const empB = empBRes.data.data;
    if (empB) cleanupEmployeeIds.push(empB.id);

    record("SETUP", "Create Specialist in Branch B", empBRes.status === 201 && !!empB?.id, `Specialist B (${empB?.id}) in ${branchB.name}`);

    // -------------------------------------------------------------------------
    // SCENARIO 1: Branch Isolation & Cross-Branch Authorization Guard
    // -------------------------------------------------------------------------
    console.log("\n--- SCENARIO 1: Branch Isolation & Authorization Guard ---");

    // 1.1 Branch Admin A attempting to mutate specialist in Branch B -> 403
    const crossUpdate = await patchJson(
      `/employees/${empB.id}`,
      { title: "Unauthorized Title Change" },
      adminAHeaders
    );
    record(
      "SCENARIO 1.1",
      "Cross-Branch Mutation Blocked",
      crossUpdate.status === 403,
      `Expected 403 Forbidden, got ${crossUpdate.status}`
    );

    // 1.2 Branch Admin A attempting to assign services to specialist in Branch B -> 403
    const crossServices = await putJson(
      `/employees/${empB.id}/services`,
      { serviceIds: [] },
      adminAHeaders
    );
    record(
      "SCENARIO 1.2",
      "Cross-Branch Service Assignment Blocked",
      crossServices.status === 403,
      `Expected 403 Forbidden, got ${crossServices.status}`
    );

    // 1.3 Branch Admin A attempting to set schedule for specialist in Branch B -> 403
    const crossSchedule = await putJson(
      `/employees/${empB.id}/schedule`,
      {
        schedules: [
          { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", isWorking: true },
        ],
      },
      adminAHeaders
    );
    record(
      "SCENARIO 1.3",
      "Cross-Branch Schedule Assignment Blocked",
      crossSchedule.status === 403,
      `Expected 403 Forbidden, got ${crossSchedule.status}`
    );

    // 1.4 Branch Admin A querying explicit foreign branchId -> 403
    const crossQuery = await getJson(`/employees?branchId=${branchB.id}`, adminAHeaders);
    record(
      "SCENARIO 1.4",
      "Foreign Branch Query Blocked",
      crossQuery.status === 403,
      `Expected 403 Forbidden, got ${crossQuery.status}`
    );

    // 1.5 Branch Admin A querying without filter -> auto-scoped to Branch A
    const autoScopedQuery = await getJson(`/employees`, adminAHeaders);
    const allBelongToA =
      autoScopedQuery.status === 200 &&
      autoScopedQuery.data.data.every((e: any) => e.branchId === branchA!.id);
    record(
      "SCENARIO 1.5",
      "Automatic Branch Scoping for Admin A",
      allBelongToA,
      `Returned ${autoScopedQuery.data.count} employees, all belonging strictly to Branch A`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 2: Specialist Lifecycle & Soft Status Toggle
    // -------------------------------------------------------------------------
    console.log("\n--- SCENARIO 2: Specialist Lifecycle & Status Toggle ---");

    const empAPhone = `+251944${String(ts).slice(-6)}`;
    const createEmpARes = await postJson(
      "/employees",
      {
        fullName: "Selamawit Kebede",
        amharicName: "ሰላማዊት ከበደ",
        phone: empAPhone,
        branchId: branchA.id,
        title: "Master Hair Artisan",
        workstation: "Suite A-04",
      },
      adminAHeaders
    );
    const empA = createEmpARes.data.data;
    if (empA) cleanupEmployeeIds.push(empA.id);

    record(
      "SCENARIO 2.1",
      "Create Specialist in Assigned Branch",
      createEmpARes.status === 201 && empA?.isActive === true,
      `Created ${empA?.firstName} ${empA?.lastName} with title: ${empA?.title}`
    );

    // Update specialist details
    const updateEmpARes = await patchJson(
      `/employees/${empA.id}`,
      {
        title: "Principal Stylist",
        workstation: "Suite A-VIP",
      },
      adminAHeaders
    );
    record(
      "SCENARIO 2.2",
      "Update Specialist Details",
      updateEmpARes.status === 200 && updateEmpARes.data.data.title === "Principal Stylist",
      `Title updated to: ${updateEmpARes.data.data?.title}`
    );

    // Soft status deactivation toggle
    const toggleDeactivate = await patchJson(`/employees/${empA.id}/toggle-status`, {}, adminAHeaders);
    const isDeactivated =
      toggleDeactivate.status === 200 &&
      toggleDeactivate.data.data.status === false &&
      toggleDeactivate.data.data.isActive === false;
    record(
      "SCENARIO 2.3",
      "Soft Status Deactivation (isActive: false)",
      isDeactivated,
      `Status toggled to: ${toggleDeactivate.data.data?.status}`
    );

    // Re-activation toggle
    const toggleReactivate = await patchJson(`/employees/${empA.id}/toggle-status`, {}, adminAHeaders);
    const isReactivated =
      toggleReactivate.status === 200 &&
      toggleReactivate.data.data.status === true &&
      toggleReactivate.data.data.isActive === true;
    record(
      "SCENARIO 2.4",
      "Re-activation (isActive: true)",
      isReactivated,
      `Status toggled back to: ${toggleReactivate.data.data?.status}`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 3: Portal Account Linkage & Employee Authentication
    // -------------------------------------------------------------------------
    console.log("\n--- SCENARIO 3: Portal Account Linkage & Auth ---");

    const portalEmpPhone = `+251955${String(ts).slice(-6)}`;
    const portalEmpPwd = "SpecialistSecret#123!";
    const createPortalEmpRes = await postJson(
      "/employees",
      {
        fullName: "Bethlehem Tadesse",
        phone: portalEmpPhone,
        email: `bethlehem.${ts}@eyobsanctuary.com`,
        branchId: branchA.id,
        title: "Master Aesthetician",
        createLoginAccount: true,
        password: portalEmpPwd,
      },
      adminAHeaders
    );
    const portalEmp = createPortalEmpRes.data.data;
    if (portalEmp) {
      cleanupEmployeeIds.push(portalEmp.id);
      if (portalEmp.userId) cleanupUserIds.push(portalEmp.userId);
    }

    record(
      "SCENARIO 3.1",
      "Specialist Created With Linked User Account",
      createPortalEmpRes.status === 201 && !!portalEmp?.userId,
      `Employee linked to User ID: ${portalEmp?.userId}`
    );

    // Login via POST /api/v1/auth/login as EMPLOYEE
    const empLoginRes = await postJson("/auth/login", {
      identifier: portalEmpPhone,
      password: portalEmpPwd,
      role: "EMPLOYEE",
    });
    const empToken =
      empLoginRes.data?.data?.tokens?.accessToken ||
      empLoginRes.data?.tokens?.accessToken ||
      empLoginRes.data?.accessToken;
    const empHeaders = { Authorization: `Bearer ${empToken}` };
    const empUser = empLoginRes.data?.data?.user || empLoginRes.data?.user;

    record(
      "SCENARIO 3.2",
      "Employee Login Authentication",
      empLoginRes.status === 200 && !!empToken && empUser?.role === "EMPLOYEE",
      `Employee authenticated successfully, role: ${empUser?.role}`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 4: Qualification Mapping
    // -------------------------------------------------------------------------
    console.log("\n--- SCENARIO 4: Qualification Mapping ---");

    // Ensure two services exist for branch A
    const srv1Code = `SRV-A1-${ts}`;
    const srv1 = await prisma.service.create({
      data: {
        code: srv1Code,
        name: "Keratin Revival Ritual",
        basePrice: 1200,
        durationMinutes: 90,
        isActive: true,
        approvalStatus: "APPROVED",
        branchServices: {
          create: { branchId: branchA.id, isActive: true },
        },
      },
    });
    cleanupServiceIds.push(srv1.id);

    const srv2Code = `SRV-A2-${ts}`;
    const srv2 = await prisma.service.create({
      data: {
        code: srv2Code,
        name: "Silk Press & Scalp Detox",
        basePrice: 950,
        durationMinutes: 60,
        isActive: true,
        approvalStatus: "APPROVED",
        branchServices: {
          create: { branchId: branchA.id, isActive: true },
        },
      },
    });
    cleanupServiceIds.push(srv2.id);

    // Assign services to empA
    const assignRes = await putJson(
      `/employees/${empA.id}/services`,
      { serviceIds: [srv1.id, srv2.id] },
      adminAHeaders
    );

    // Verify in database that EmployeeService has isQualified === true
    const assignedRecords = await prisma.employeeService.findMany({
      where: { employeeId: empA.id },
    });
    const allQualified =
      assignedRecords.length === 2 &&
      assignedRecords.every((r) => r.isQualified === true);

    record(
      "SCENARIO 4.1",
      "Service Qualification Mapping (isQualified: true)",
      assignRes.status === 200 && allQualified,
      `Assigned 2 services with isQualified=true in atomic transaction`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 5: 7-Day Shift Engine & Schedule Exception Overrides
    // -------------------------------------------------------------------------
    console.log("\n--- SCENARIO 5: Shifts & Schedule Exceptions ---");

    // Set 7-day schedule for empA: Monday is rest day (day 1 = false), others working 09:30-17:30 within branch hours (09:00-20:00)
    const weekShifts = Array.from({ length: 7 }, (_, d) => ({
      dayOfWeek: d,
      startTime: "09:30",
      endTime: "17:30",
      isWorking: d !== 1, // Sunday=0 (working), Monday=1 (off), Tuesday=2 (working), etc.
    }));

    const setScheduleRes = await putJson(
      `/employees/${empA.id}/schedule`,
      { schedules: weekShifts },
      adminAHeaders
    );

    record(
      "SCENARIO 5.1",
      "Save 7-Day Weekly Shift Template",
      setScheduleRes.status === 200 && Array.isArray(setScheduleRes.data?.data) && setScheduleRes.data.data.length >= 7,
      `Status: ${setScheduleRes.status}, Error: ${JSON.stringify(setScheduleRes.data?.message || setScheduleRes.data)}`
    );

    // Get schedule via GET /api/v1/employees/:id/schedule
    const getSchedRes = await getJson(`/employees/${empA.id}/schedule`, adminAHeaders);
    record(
      "SCENARIO 5.2",
      "Retrieve Specialist Schedule",
      getSchedRes.status === 200 && Array.isArray(getSchedRes.data.data.schedules),
      `Returned ${getSchedRes.data.data.schedules?.length} days of shift template`
    );

    // Pick a future Tuesday date: e.g. 2026-11-17 (Tuesday = dayOfWeek 2)
    const testDate = "2026-11-17";

    // First check: availability should be present on this Tuesday
    const availBefore = await getJson(
      `/bookings/availability?employeeId=${empA.id}&serviceId=${srv1.id}&date=${testDate}&branchId=${branchA.id}`
    );
    const slotsBeforeCount = availBefore.data?.data?.availableSlots?.length || 0;
    record(
      "SCENARIO 5.3",
      "Standard Shift Produces Availability Slots",
      availBefore.status === 200 && slotsBeforeCount > 0,
      `Available slots on ${testDate}: ${slotsBeforeCount}`
    );

    // Add a full-day off exception for 2026-11-17
    const excRes = await postJson(
      `/employees/${empA.id}/exceptions`,
      {
        startDate: testDate,
        date: testDate,
        reason: "VIP Masterclass Training",
        isOffDay: true,
      },
      adminAHeaders
    );
    const createdExc = excRes.data.data;

    record(
      "SCENARIO 5.4",
      "Add Schedule Exception (Full Day Off)",
      excRes.status === 201 && createdExc?.isOff === true,
      `Exception ID ${createdExc?.id} created for ${testDate}`
    );

    // Second check: availability must now be 0 slots due to Schedule Exception precedence
    const availDuring = await getJson(
      `/bookings/availability?employeeId=${empA.id}&serviceId=${srv1.id}&date=${testDate}&branchId=${branchA.id}`
    );
    const slotsDuringCount = availDuring.data?.data?.availableSlots?.length || 0;
    record(
      "SCENARIO 5.5",
      "Schedule Exception Precedence (0 Slots on Off Day)",
      availDuring.status === 200 && slotsDuringCount === 0,
      `Available slots with active day-off exception: ${slotsDuringCount} (Expected 0)`
    );

    // Delete exception
    const delExcRes = await deleteJson(
      `/employees/${empA.id}/exceptions/${createdExc.id}`,
      adminAHeaders
    );
    record(
      "SCENARIO 5.6",
      "Delete Schedule Exception",
      delExcRes.status === 200 && delExcRes.data.data?.success === true,
      `Exception ${createdExc.id} removed`
    );

    // Third check: slots restored
    const availAfter = await getJson(
      `/bookings/availability?employeeId=${empA.id}&serviceId=${srv1.id}&date=${testDate}&branchId=${branchA.id}`
    );
    const slotsAfterCount = availAfter.data?.data?.availableSlots?.length || 0;
    record(
      "SCENARIO 5.7",
      "Availability Restored After Exception Removal",
      availAfter.status === 200 && slotsAfterCount > 0,
      `Available slots restored: ${slotsAfterCount}`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 6: Staff Personal Floor Portal (/api/v1/staff)
    // -------------------------------------------------------------------------
    console.log("\n--- SCENARIO 6: Staff Personal Portal ---");

    // Assign service srv1 to portalEmp
    await putJson(
      `/employees/${portalEmp.id}/services`,
      { serviceIds: [srv1.id] },
      ownerHeaders
    );

    // 6.1 GET /api/v1/staff/me
    const staffMeRes = await getJson("/staff/me", empHeaders);
    const staffProfile = staffMeRes.data.data;
    const hasBranchAndServices =
      staffProfile?.branch?.id === branchA.id &&
      staffProfile?.services?.length >= 1;

    record(
      "SCENARIO 6.1",
      "Staff Profile Endpoint (/staff/me)",
      staffMeRes.status === 200 && hasBranchAndServices,
      `Staff ${staffProfile?.firstName} in branch ${staffProfile?.branch?.name} with ${staffProfile?.services?.length} qualified service(s)`
    );

    // 6.2 GET /api/v1/staff/schedule
    const staffSchedRes = await getJson("/staff/schedule", empHeaders);
    record(
      "SCENARIO 6.2",
      "Staff Personal Schedule (/staff/schedule)",
      staffSchedRes.status === 200 && Array.isArray(staffSchedRes.data.data?.schedules),
      `Returned personal shifts array with ${staffSchedRes.data.data?.schedules?.length} days`
    );

    // 6.3 GET /api/v1/staff/appointments
    const staffAptsRes = await getJson("/staff/appointments", empHeaders);
    record(
      "SCENARIO 6.3",
      "Staff Personal Appointments (/staff/appointments)",
      staffAptsRes.status === 200 && Array.isArray(staffAptsRes.data.data || staffAptsRes.data.appointments),
      `Personal appointments agenda query returned HTTP 200`
    );

  } catch (error: any) {
    console.error("FATAL AUDIT ERROR:", error);
    record("FATAL", "Audit execution error", false, error.message);
  } finally {
    console.log("\n--- TEARDOWN: Cleaning up ephemeral test fixtures ---");
    // Clean up
    for (const eid of cleanupEmployeeIds) {
      await prisma.scheduleException.deleteMany({ where: { employeeId: eid } }).catch(() => {});
      await prisma.employeeSchedule.deleteMany({ where: { employeeId: eid } }).catch(() => {});
      await prisma.employeeService.deleteMany({ where: { employeeId: eid } }).catch(() => {});
      await prisma.employee.delete({ where: { id: eid } }).catch(() => {});
    }
    for (const uid of cleanupUserIds) {
      await prisma.user.delete({ where: { id: uid } }).catch(() => {});
    }
    for (const sid of cleanupServiceIds) {
      await prisma.branchService.deleteMany({ where: { serviceId: sid } }).catch(() => {});
      await prisma.service.delete({ where: { id: sid } }).catch(() => {});
    }
    for (const bid of cleanupBranchIds) {
      await prisma.branchHours.deleteMany({ where: { branchId: bid } }).catch(() => {});
      await prisma.branch.delete({ where: { id: bid } }).catch(() => {});
    }
    await prisma.$disconnect();
  }

  // Summary
  console.log("\n==========================================================================");
  console.log("   AUDIT SCORECARD & SUMMARY");
  console.log("==========================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`TOTAL CHECKS: ${total}`);
  console.log(`PASSED:       ${passed}`);
  console.log(`FAILED:       ${failed}`);

  if (failed > 0) {
    console.error(`\n❌ AUDIT FAILED with ${failed} failure(s).`);
    process.exit(1);
  } else {
    console.log(`\n✅ ALL ${total} EPIC 4 AUDIT SCENARIOS PASSED WITH 100% SUCCESS.`);
    process.exit(0);
  }
}

runEpic4Audit();
