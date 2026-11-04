import prisma from "../src/utils/prisma";
import { EmployeeService } from "../src/modules/employee/employee.service";
import { UserRole, BookingStatus } from "@prisma/client";

interface TestResult {
  checkItem: string;
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

function recordTest(checkItem: string, scenario: string, expected: string, actual: string, passed: boolean) {
  results.push({ checkItem, scenario, expected, actual, passed });
}

async function runAudit() {
  console.log("=================================================================");
  console.log("  EYOB SALON SYSTEM — PHASE 4 SECURITY AUDIT & VERIFICATION SUITE");
  console.log("=================================================================\n");

  // Fetch branches
  const branches = await prisma.branch.findMany({
    include: {
      branchHours: true,
      _count: { select: { employees: true, services: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const boleBranch = branches.find((b) => b.slug === "bole-bulbula");
  const kazanchisBranch = branches.find((b) => b.slug === "kazanchis");
  const cmcBranch = branches.find((b) => b.slug === "cmc");

  if (!boleBranch || !kazanchisBranch || !cmcBranch) {
    throw new Error("Missing required branches in database. Run seed first.");
  }

  // -------------------------------------------------------------
  // 5. Branch Legitimacy Check
  // -------------------------------------------------------------
  console.log(">> Running Check 5: Branch Legitimacy Check in PostgreSQL...");
  const expectedBranches = [
    { slug: "bole-bulbula", name: "Bole Bulbula Branch", minHours: 7 },
    { slug: "kazanchis", name: "Kazanchis Branch", minHours: 7 },
    { slug: "cmc", name: "CMC Branch", minHours: 7 },
  ];

  for (const exp of expectedBranches) {
    const br = branches.find((b) => b.slug === exp.slug);
    const passed = !!br && br.name.includes(exp.name.split(" ")[0]) && br.branchHours.length >= exp.minHours;
    const actualDesc = br
      ? `Found: "${br.name}" (ID: ${br.id.slice(0, 8)}...), Slug: "${br.slug}", Operating Days: ${br.branchHours.length}, Seeded Staff: ${br._count.employees}, Seeded Services: ${br._count.services}, Buffer: ${br.slotBufferMinutes}m`
      : "Branch missing from database";

    recordTest(
      "5. Branch Legitimacy",
      `Verify demonstration data markers for branch "${exp.slug}"`,
      `Branch present in PostgreSQL with slug="${exp.slug}", name matching "${exp.name}", 7 operating days seeded`,
      actualDesc,
      passed
    );
  }

  // Get test specialists
  const boleStaff = await prisma.employee.findFirst({
    where: { branchId: boleBranch.id },
    include: { user: true },
  });
  const kazanchisStaff = await prisma.employee.findFirst({
    where: { branchId: kazanchisBranch.id },
    include: { user: true },
  });

  if (!boleStaff || !kazanchisStaff) {
    throw new Error("Staff required for testing not found. Run seed first.");
  }

  // Create an employee with portal user for IDOR testing if not present
  let employeeUser = boleStaff.user;
  if (!employeeUser) {
    employeeUser = await prisma.user.create({
      data: {
        firstName: boleStaff.firstName,
        lastName: boleStaff.lastName,
        email: `emp.${Date.now()}@eyobbeauty.com`,
        phone: `+2519${Math.floor(10000000 + Math.random() * 89999999)}`,
        password: "hashedPassword123!",
        role: UserRole.EMPLOYEE,
        branchId: boleBranch.id,
      },
    });
    await prisma.employee.update({
      where: { id: boleStaff.id },
      data: { userId: employeeUser.id },
    });
  }

  const employeeCaller = {
    id: employeeUser.id,
    role: UserRole.EMPLOYEE,
    branchId: boleBranch.id,
    phoneNumber: employeeUser.phone,
  };

  const branchAdminBoleCaller = {
    id: "admin-bole-id",
    role: UserRole.BRANCH_ADMIN,
    branchId: boleBranch.id,
  };

  const ownerCaller = {
    id: "owner-id",
    role: UserRole.OWNER,
    branchId: null,
  };

  // -------------------------------------------------------------
  // 1. IDOR & Access Control
  // -------------------------------------------------------------
  console.log(">> Running Check 1: IDOR & Access Control...");

  // 1A. Employee queries another employee's private profile
  try {
    await EmployeeService.getEmployeeById(kazanchisStaff.id, employeeCaller);
    recordTest(
      "1. IDOR & Access Control",
      `Employee (${employeeCaller.id.slice(0, 8)}) queries another employee's profile (${kazanchisStaff.id.slice(0, 8)})`,
      "HTTP 403 Forbidden: Employees cannot view other specialists' private profiles",
      "Request unexpectedly SUCCEEDED (IDOR vulnerability detected)",
      false
    );
  } catch (err: any) {
    const isForbidden = err.statusCode === 403 || err.message?.includes("Forbidden");
    recordTest(
      "1. IDOR & Access Control",
      `Employee (${employeeCaller.id.slice(0, 8)}) queries another employee's profile (${kazanchisStaff.id.slice(0, 8)})`,
      "HTTP 403 Forbidden: Employees cannot view other specialists' private profiles",
      `HTTP ${err.statusCode || 403} - ${err.message}`,
      isForbidden
    );
  }

  // 1B. Employee queries their own profile
  try {
    const ownProfile = await EmployeeService.getEmployeeById(boleStaff.id, employeeCaller);
    recordTest(
      "1. IDOR & Access Control",
      `Employee (${employeeCaller.id.slice(0, 8)}) queries their OWN profile (${boleStaff.id.slice(0, 8)})`,
      "HTTP 200 OK: Allowed to view self record",
      `HTTP 200 OK: Successfully retrieved self profile: "${ownProfile.firstName} ${ownProfile.lastName}"`,
      ownProfile.id === boleStaff.id
    );
  } catch (err: any) {
    recordTest(
      "1. IDOR & Access Control",
      `Employee (${employeeCaller.id.slice(0, 8)}) queries their OWN profile (${boleStaff.id.slice(0, 8)})`,
      "HTTP 200 OK: Allowed to view self record",
      `FAILED with error: ${err.message}`,
      false
    );
  }

  // 1C. BRANCH_ADMIN at Bole Bulbula queries specialist at Kazanchis
  try {
    await EmployeeService.getEmployeeById(kazanchisStaff.id, branchAdminBoleCaller);
    recordTest(
      "1. IDOR & Access Control",
      `BRANCH_ADMIN (Bole Bulbula) queries specialist at Kazanchis (${kazanchisStaff.id.slice(0, 8)})`,
      "HTTP 403 Forbidden: You do not have access to manage employees in this branch",
      "Request unexpectedly SUCCEEDED (Cross-branch read violation)",
      false
    );
  } catch (err: any) {
    const isForbidden = err.statusCode === 403 || err.message?.includes("Forbidden");
    recordTest(
      "1. IDOR & Access Control",
      `BRANCH_ADMIN (Bole Bulbula) queries specialist at Kazanchis (${kazanchisStaff.id.slice(0, 8)})`,
      "HTTP 403 Forbidden: Cross-branch access denied",
      `HTTP ${err.statusCode || 403} - ${err.message}`,
      isForbidden
    );
  }

  // 1D. BRANCH_ADMIN at Bole Bulbula attempts to update specialist at Kazanchis
  try {
    await EmployeeService.updateEmployee(
      kazanchisStaff.id,
      { ritualTitle: "Malicious Cross-Branch Update" },
      branchAdminBoleCaller
    );
    recordTest(
      "1. IDOR & Access Control",
      `BRANCH_ADMIN (Bole Bulbula) attempts PATCH update on specialist at Kazanchis`,
      "HTTP 403 Forbidden: Cross-branch mutation blocked",
      "Request unexpectedly SUCCEEDED (Cross-branch write vulnerability)",
      false
    );
  } catch (err: any) {
    const isForbidden = err.statusCode === 403 || err.message?.includes("Forbidden");
    recordTest(
      "1. IDOR & Access Control",
      `BRANCH_ADMIN (Bole Bulbula) attempts PATCH update on specialist at Kazanchis`,
      "HTTP 403 Forbidden: Cross-branch mutation blocked",
      `HTTP ${err.statusCode || 403} - ${err.message}`,
      isForbidden
    );
  }

  // 1E. BRANCH_ADMIN at Bole Bulbula queries roster for Kazanchis branch
  try {
    await EmployeeService.getEmployees({ branchId: kazanchisBranch.id }, branchAdminBoleCaller);
    recordTest(
      "1. IDOR & Access Control",
      `BRANCH_ADMIN (Bole Bulbula) queries /api/v1/employees?branchId=${kazanchisBranch.id}`,
      "HTTP 403 Forbidden: Cross-branch roster filtering denied",
      "Request unexpectedly SUCCEEDED without restriction",
      false
    );
  } catch (err: any) {
    const isForbidden = err.statusCode === 403 || err.message?.includes("Forbidden");
    recordTest(
      "1. IDOR & Access Control",
      `BRANCH_ADMIN (Bole Bulbula) queries /api/v1/employees?branchId=${kazanchisBranch.id}`,
      "HTTP 403 Forbidden: Cross-branch roster filtering denied",
      `HTTP ${err.statusCode || 403} - ${err.message}`,
      isForbidden
    );
  }

  // -------------------------------------------------------------
  // 2. Sensitive Financial Data Leaks
  // -------------------------------------------------------------
  console.log(">> Running Check 2: Sensitive Financial Data Leaks...");

  // 2A. OWNER queries employee profile
  const ownerView = await EmployeeService.getEmployeeById(boleStaff.id, ownerCaller);
  const ownerHasSalary = ownerView.baseSalary !== undefined && ownerView.commissionRate !== undefined;
  recordTest(
    "2. Financial Data Privacy",
    "OWNER queries /api/v1/employees/:id",
    "Preserve baseSalary and commissionRate for salon OWNER",
    `baseSalary: ETB ${ownerView.baseSalary}, commissionRate: ${ownerView.commissionRate}% (Preserved for OWNER)`,
    ownerHasSalary
  );

  // 2B. BRANCH_ADMIN queries employee profile in their branch
  const adminView = await EmployeeService.getEmployeeById(boleStaff.id, branchAdminBoleCaller);
  const adminSalaryStripped = adminView.baseSalary === undefined && adminView.commissionRate === undefined;
  recordTest(
    "2. Financial Data Privacy",
    "BRANCH_ADMIN queries /api/v1/employees/:id (in own branch)",
    "Explicitly STRIP baseSalary and commissionRate from response",
    `baseSalary: ${String(adminView.baseSalary)}, commissionRate: ${String(adminView.commissionRate)} (Successfully stripped)`,
    adminSalaryStripped
  );

  // 2C. BRANCH_ADMIN queries /api/v1/employees roster
  const adminRoster = await EmployeeService.getEmployees({}, branchAdminBoleCaller);
  const allRosterStripped = adminRoster.every(
    (e: any) => e.baseSalary === undefined && e.commissionRate === undefined
  );
  recordTest(
    "2. Financial Data Privacy",
    "BRANCH_ADMIN queries /api/v1/employees roster collection",
    "All records have baseSalary and commissionRate stripped",
    `Audited ${adminRoster.length} staff records: ${allRosterStripped ? "100% stripped (zero financial leaks)" : "LEAK DETECTED"}`,
    allRosterStripped && adminRoster.length > 0
  );

  // 2D. EMPLOYEE queries their own profile
  const selfView = await EmployeeService.getEmployeeById(boleStaff.id, employeeCaller);
  const selfHasSalary = selfView.baseSalary !== undefined && selfView.commissionRate !== undefined;
  recordTest(
    "2. Financial Data Privacy",
    "EMPLOYEE queries their OWN profile",
    "baseSalary and commissionRate visible to the specialist themselves",
    `baseSalary: ETB ${selfView.baseSalary}, commissionRate: ${selfView.commissionRate}% (Accessible by self specialist)`,
    selfHasSalary
  );

  // -------------------------------------------------------------
  // 3. Deactivation Safeguard
  // -------------------------------------------------------------
  console.log(">> Running Check 3: Deactivation Safeguard & Future Bookings...");

  // Create a customer user and future appointment item for boleStaff
  let testCustomer = await prisma.user.findFirst({ where: { role: UserRole.CUSTOMER } });
  if (!testCustomer) {
    testCustomer = await prisma.user.create({
      data: {
        firstName: "Liya",
        lastName: "Kebede",
        email: `customer.${Date.now()}@example.com`,
        phone: `+2519${Math.floor(10000000 + Math.random() * 89999999)}`,
        password: "hashedCustomerPassword123!",
        role: UserRole.CUSTOMER,
      },
    });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  tomorrow.setHours(14, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(15, 0, 0, 0);

  // Create booking
  const testBooking = await prisma.booking.create({
    data: {
      bookingNumber: `BK-TEST-${Date.now().toString().slice(-6)}`,
      status: BookingStatus.CONFIRMED,
      totalAmount: 600,
      depositRequired: 150,
      depositPaid: 150,
      balanceDue: 450,
      customerId: testCustomer.id,
      branchId: boleBranch.id,
      items: {
        create: {
          serviceTitleSnapshot: "Couture Hair Styling",
          priceSnapshot: 600,
          durationSnapshot: 60,
          depositSnapshot: 150,
          startTime: tomorrow,
          endTime: tomorrowEnd,
          employeeId: boleStaff.id,
        },
      },
    },
    include: { items: true },
  });

  // Ensure employee starts active
  await prisma.employee.update({ where: { id: boleStaff.id }, data: { status: true } });

  // Soft deactivate
  const deactivationResult = await EmployeeService.toggleEmployeeStatus(boleStaff.id, ownerCaller);
  const employeeDeactivated = deactivationResult.employee.status === false;
  const warningReturned = !!deactivationResult.warning && deactivationResult.warning.includes("future appointment");

  // Verify historical/future bookings are retained
  const retainedBooking = await prisma.booking.findUnique({
    where: { id: testBooking.id },
    include: { items: true },
  });
  const bookingsRetained = !!retainedBooking && retainedBooking.items.length === 1;

  recordTest(
    "3. Deactivation Safeguard",
    `Deactivate specialist (${boleStaff.firstName} ${boleStaff.lastName}) with 1 active future booking`,
    "status: false, warning specifies affected appointments count, booking records retained intact",
    `status: ${deactivationResult.employee.status}, warning: "${deactivationResult.warning}", historical/future booking records in DB: ${bookingsRetained ? "100% retained intact" : "corrupted/deleted"}`,
    employeeDeactivated && warningReturned && bookingsRetained
  );

  // Re-activate specialist and clean up test booking
  await EmployeeService.toggleEmployeeStatus(boleStaff.id, ownerCaller);
  await prisma.bookingItem.deleteMany({ where: { bookingId: testBooking.id } });
  await prisma.booking.delete({ where: { id: testBooking.id } });

  // -------------------------------------------------------------
  // 4. Scheduling Edge Cases
  // -------------------------------------------------------------
  console.log(">> Running Check 4: Scheduling Edge Cases & Precedence...");

  // 4A. Overnight shift crossing midnight (20:00 to 02:00)
  try {
    await EmployeeService.setSchedule(
      boleStaff.id,
      {
        schedules: [
          {
            dayOfWeek: 2,
            startTime: "20:00",
            endTime: "02:00",
            isWorking: true,
          },
        ],
      },
      ownerCaller
    );
    recordTest(
      "4. Scheduling Edge Cases",
      "Overnight shift crossing midnight (startTime: '20:00', endTime: '02:00')",
      "ValidationError: Shift start time must precede end time or falls outside operating hours",
      "Request unexpectedly SUCCEEDED (Invalid time interval allowed)",
      false
    );
  } catch (err: any) {
    const isValidationErr = err.statusCode === 400 || err.message?.includes("must precede") || err.message?.includes("operating hours");
    recordTest(
      "4. Scheduling Edge Cases",
      "Overnight shift crossing midnight (startTime: '20:00', endTime: '02:00')",
      "ValidationError: Shift start time must precede end time (20:00 >= 02:00)",
      `Caught ValidationError: "${err.message}"`,
      isValidationErr
    );
  }

  // 4B. Shift outside branch operating hours (07:00 to 22:00 when branch is 08:30 to 20:30)
  try {
    await EmployeeService.setSchedule(
      boleStaff.id,
      {
        schedules: [
          {
            dayOfWeek: 2,
            startTime: "07:00",
            endTime: "22:00",
            isWorking: true,
          },
        ],
      },
      ownerCaller
    );
    recordTest(
      "4. Scheduling Edge Cases",
      "Shift outside branch operating hours (07:00 - 22:00 vs 08:30 - 20:30)",
      "ValidationError: falls outside branch operating hours",
      "Request unexpectedly SUCCEEDED without branch hours boundary validation",
      false
    );
  } catch (err: any) {
    const isBoundaryErr = err.message?.includes("falls outside branch operating hours");
    recordTest(
      "4. Scheduling Edge Cases",
      "Shift outside branch operating hours (07:00 - 22:00 vs 08:30 - 20:30)",
      "ValidationError: Shift falls outside branch operating hours",
      `Caught ValidationError: "${err.message}"`,
      isBoundaryErr
    );
  }

  // 4C. Schedule Exception Precedence (isOffDay: true overrides standard working day)
  const targetTestDate = new Date();
  targetTestDate.setDate(targetTestDate.getDate() + 7); // Next week
  const dayOfWeek = targetTestDate.getDay();

  // Set standard schedule for this day: isWorking: true (09:00 - 18:00)
  await prisma.employeeSchedule.upsert({
    where: {
      employeeId_dayOfWeek: {
        employeeId: boleStaff.id,
        dayOfWeek,
      },
    },
    update: { isWorking: true, startTime: "09:00", endTime: "18:00" },
    create: { employeeId: boleStaff.id, dayOfWeek, isWorking: true, startTime: "09:00", endTime: "18:00" },
  });

  // Verify before exception: isWorking is true
  const standardBefore = await EmployeeService.getEffectiveScheduleForDate(boleStaff.id, targetTestDate);

  // Register ScheduleException for this target date with isOffDay: true
  const exception = await EmployeeService.createException(
    boleStaff.id,
    {
      startDate: targetTestDate.toISOString().split("T")[0],
      reason: "Spiritual Retreat & Masterclass (Off-Duty)",
      isOffDay: true,
    },
    ownerCaller
  );

  // Check effective schedule on that target date
  const effectiveAfter = await EmployeeService.getEffectiveScheduleForDate(boleStaff.id, targetTestDate);

  const exceptionPrecedencePassed =
    standardBefore.isWorking === true &&
    effectiveAfter.isWorking === false &&
    effectiveAfter.isException === true &&
    effectiveAfter.reason === "Spiritual Retreat & Masterclass (Off-Duty)";

  recordTest(
    "4. Scheduling Edge Cases",
    `Schedule Exception Precedence on date ${targetTestDate.toISOString().split("T")[0]} (Day ${dayOfWeek})`,
    "Exception with isOffDay: true completely overrides standard isWorking: true weekly schedule",
    `Before: isWorking=${standardBefore.isWorking} (${standardBefore.startTime}-${standardBefore.endTime}) | After Exception: isWorking=${effectiveAfter.isWorking}, isException=${effectiveAfter.isException}, reason="${effectiveAfter.reason}"`,
    exceptionPrecedencePassed
  );

  // Clean up test exception
  await prisma.scheduleException.delete({ where: { id: exception.id } });

  console.log("\n=================================================================");
  console.log("                      TEST RESULTS SUMMARY");
  console.log("=================================================================\n");

  let allPassed = true;
  for (const r of results) {
    const symbol = r.passed ? "✓ PASS" : "✗ FAIL";
    if (!r.passed) allPassed = false;
    console.log(`[${symbol}] [${r.checkItem}]`);
    console.log(`  Scenario: ${r.scenario}`);
    console.log(`  Expected: ${r.expected}`);
    console.log(`  Actual:   ${r.actual}\n`);
  }

  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: ${results.filter((r) => r.passed).length}`);
  console.log(`Failed: ${results.filter((r) => !r.passed).length}`);

  if (!allPassed) {
    process.exit(1);
  }
}

runAudit()
  .catch((err) => {
    console.error("Audit run failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

