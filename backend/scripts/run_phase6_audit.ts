import prisma from "../src/utils/prisma";
import { BookingService, CurrentUser } from "../src/modules/booking/booking.service";
import { BookingStatus, UserRole } from "@prisma/client";

async function runPhase6Audit() {
  console.log("=================================================================");
  console.log("   EYOB SALON SYSTEM — PHASE 6 BOOKING & SCHEDULING AUDIT        ");
  console.log("=================================================================\n");

  let passed = 0;
  let total = 0;

  function report(name: string, scenario: string, expected: string, actual: string, ok: boolean) {
    total++;
    if (ok) passed++;
    console.log(`[${ok ? "✓ PASS" : "✗ FAIL"}] [${name}]`);
    console.log(`  Scenario: ${scenario}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual:   ${actual}\n`);
  }

  try {
    // 1. Fetch seed data for tests
    const boleBranch = await prisma.branch.findFirst({ where: { slug: "bole-bulbula" } });
    const kazanchisBranch = await prisma.branch.findFirst({ where: { slug: "kazanchis" } });
    if (!boleBranch || !kazanchisBranch) {
      throw new Error("Branches not found in seed");
    }

    const service = await prisma.service.findFirst({
      where: {
        OR: [{ code: "SR-101" }, { code: "#SR-101" }],
        isActive: true,
      },
    });
    if (!service) throw new Error("Service #SR-101 not found");

    const specialist = await prisma.employee.findFirst({
      where: { branchId: boleBranch.id, status: true },
    });
    if (!specialist) throw new Error("Specialist not found in Bole Bulbula");

    // Ensure specialist has a working shift for testing
    await prisma.employeeSchedule.upsert({
      where: {
        employeeId_dayOfWeek: {
          employeeId: specialist.id,
          dayOfWeek: 3, // Wednesday
        },
      },
      update: {
        startTime: "09:00",
        endTime: "19:00",
        breakStartTime: "13:00",
        breakEndTime: "14:00",
        isWorking: true,
      },
      create: {
        employeeId: specialist.id,
        dayOfWeek: 3,
        startTime: "09:00",
        endTime: "19:00",
        breakStartTime: "13:00",
        breakEndTime: "14:00",
        isWorking: true,
      },
    });

    // Create test customer
    const testCustomerA = await prisma.user.upsert({
      where: { phone: "+251911999901" },
      update: {},
      create: {
        firstName: "TestClient",
        lastName: "Alpha",
        phone: "+251911999901",
        password: "hashedpassword123",
        role: UserRole.CUSTOMER,
      },
    });

    const testCustomerB = await prisma.user.upsert({
      where: { phone: "+251911999902" },
      update: {},
      create: {
        firstName: "TestClient",
        lastName: "Beta",
        phone: "+251911999902",
        password: "hashedpassword123",
        role: UserRole.CUSTOMER,
      },
    });

    const userA: CurrentUser = { id: testCustomerA.id, role: UserRole.CUSTOMER, branchId: null };
    const userB: CurrentUser = { id: testCustomerB.id, role: UserRole.CUSTOMER, branchId: null };
    const ownerUser: CurrentUser = { id: "owner-1", role: UserRole.OWNER, branchId: null };
    const branchAdminBole: CurrentUser = { id: "admin-bole", role: UserRole.BRANCH_ADMIN, branchId: boleBranch.id };

    // --- CHECK 1: Availability Calculation Engine ---
    const availResult = await BookingService.getAvailableSlots({
      branchId: boleBranch.id,
      serviceId: service.id,
      employeeId: specialist.id,
      date: "2026-11-18", // Wednesday
    });

    report(
      "1. Availability Engine",
      "Calculate available slots for Bole Bulbula on Wednesday",
      "Returns array of valid slot strings stepped by branch slotBufferMinutes",
      `Generated ${availResult.availableSlots.length} slots: [${availResult.availableSlots.slice(0, 4).join(", ")}...]`,
      availResult.availableSlots.length > 0 && availResult.availableSlots.includes("09:00")
    );

    // --- CHECK 2: Booking Creation & Snapshot Freezing ---
    const targetSlot = "2026-11-18T10:30:00.000Z";
    const booking1 = await BookingService.createBooking(
      {
        branchId: boleBranch.id,
        serviceId: service.id,
        employeeId: specialist.id,
        startTime: targetSlot,
        notes: "Bridal hair fitting with floral wreath",
      },
      userA
    );

    const item1 = booking1.items[0];
    const snapshotsFrozen =
      Number(item1.priceSnapshot) === Number(service.basePrice) &&
      item1.durationSnapshot === service.durationMinutes &&
      item1.serviceTitleSnapshot === service.name &&
      booking1.bookingNumber.startsWith("EYOB-20261118-");

    report(
      "2. Snapshot Freezing",
      "Verify BookingItem point-in-time snapshots and canonical reference code",
      "priceSnapshot, durationSnapshot, and title frozen with EYOB-YYYYMMDD-XXXX number",
      `Ref: ${booking1.bookingNumber}, PriceSnapshot: ${item1.priceSnapshot} ETB, DurationSnapshot: ${item1.durationSnapshot}m`,
      snapshotsFrozen
    );

    // --- CHECK 3: Concurrency & Collision Prevention ---
    let conflictCaught = false;
    let conflictMessage = "";
    try {
      // Attempt concurrent booking for the same slot and specialist
      await BookingService.createBooking(
        {
          branchId: boleBranch.id,
          serviceId: service.id,
          employeeId: specialist.id,
          startTime: targetSlot,
          notes: "Conflicting reservation attempt",
        },
        userB
      );
    } catch (err: any) {
      conflictCaught = true;
      conflictMessage = err.message;
    }

    report(
      "3. Concurrency Lock",
      "Attempt duplicate booking on identical specialist slot",
      "Throws ConflictError (409) preventing double booking",
      `Conflict Caught: ${conflictCaught} - "${conflictMessage}"`,
      conflictCaught && conflictMessage.includes("just been reserved")
    );

    // --- CHECK 4: IDOR Protection ---
    let idorPrevented = false;
    try {
      // User B tries to view User A's private booking
      await BookingService.getBookingByIdOrRef(booking1.id, userB);
    } catch (err: any) {
      idorPrevented = err.statusCode === 403;
    }

    report(
      "4. IDOR Protection",
      "User B attempts to inspect User A's private booking",
      "ForbiddenError (403) access denied",
      `IDOR Prevented: ${idorPrevented}`,
      idorPrevented
    );

    // --- CHECK 5: Multi-Tenant Branch Isolation ---
    let crossBranchBlocked = false;
    try {
      // Bole Admin attempts to fetch Kazanchis appointments
      await BookingService.getAdminAppointments(branchAdminBole, {
        branchId: kazanchisBranch.id,
      });
    } catch (err: any) {
      crossBranchBlocked = true;
    }
    // BranchAdmin should be constrained to their own branch
    const adminView = await BookingService.getAdminAppointments(branchAdminBole, {});
    const onlyBole = adminView.appointments.every((a: any) => a.branchId === boleBranch.id);

    report(
      "5. Branch Isolation",
      "BRANCH_ADMIN (Bole) queries admin appointments console",
      "Query strictly scoped to Bole Bulbula (no Kazanchis or CMC leakage)",
      `Strictly Scoped: ${onlyBole}, Total Bole records visible: ${adminView.appointments.length}`,
      onlyBole
    );

    // --- CHECK 6: Staff Lifecycle State Machine ---
    // Transition CONFIRMED -> IN_PROGRESS
    const inProgressBooking = await BookingService.updateAppointmentStatus(
      booking1.id,
      BookingStatus.IN_PROGRESS,
      undefined,
      ownerUser
    );

    // Transition IN_PROGRESS -> COMPLETED
    const completedBooking = await BookingService.updateAppointmentStatus(
      booking1.id,
      BookingStatus.COMPLETED,
      undefined,
      ownerUser
    );

    const lifecyclePassed =
      inProgressBooking.status === BookingStatus.IN_PROGRESS &&
      completedBooking.status === BookingStatus.COMPLETED &&
      Number(completedBooking.balanceDue) === 0;

    report(
      "6. Lifecycle State Machine",
      "Progress booking from CONFIRMED -> IN_PROGRESS -> COMPLETED",
      "Status reaches COMPLETED with balanceDue cleared to 0",
      `Final Status: ${completedBooking.status}, BalanceDue: ${completedBooking.balanceDue}`,
      lifecyclePassed
    );

    // --- CHECK 7: Staff Rejection Action ---
    const booking2 = await BookingService.createBooking(
      {
        branchId: boleBranch.id,
        serviceId: service.id,
        employeeId: specialist.id,
        startTime: "2026-11-18T14:30:00.000Z",
      },
      userA
    );

    const rejectedBooking = await BookingService.updateAppointmentStatus(
      booking2.id,
      BookingStatus.REJECTED,
      "Specialist in mandatory masterclass session",
      ownerUser
    );

    report(
      "7. Staff Rejection",
      "Staff declines/rejects appointment request",
      "Status set to REJECTED with cancellationReason recorded",
      `Status: ${rejectedBooking.status}, Reason: "${rejectedBooking.cancellationReason}"`,
      rejectedBooking.status === BookingStatus.REJECTED
    );

    // --- CHECK 8: Income Reporting ---
    const incomeReport = await BookingService.getIncomeReport(
      ownerUser,
      "DAILY",
      boleBranch.id
    );

    report(
      "8. Income Reporting",
      "Admin income aggregation for completed appointments",
      "Returns totalIncome and totalDeposits matching database completed records",
      `Count: ${incomeReport.count}, Total Income: ${incomeReport.totalIncome} ETB, Deposits: ${incomeReport.totalDeposits} ETB`,
      incomeReport.count >= 1 && incomeReport.totalIncome > 0
    );

    console.log("=================================================================");
    console.log(`  AUDIT COMPLETED: ${passed} / ${total} TESTS PASSED`);
    console.log("=================================================================\n");

    if (passed !== total) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Audit Execution Failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase6Audit();
