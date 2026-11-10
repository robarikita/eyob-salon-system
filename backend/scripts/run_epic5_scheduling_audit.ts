import { PrismaClient, UserRole, BookingStatus } from "@prisma/client";
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

async function getJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function runEpic5Audit() {
  console.log("==========================================================================");
  console.log("   EYOB SALON — SPRINT 5 EPIC 5: AVAILABILITY ENGINE & SCHEDULING AUDIT   ");
  console.log("==========================================================================\n");

  const cleanupUserIds: string[] = [];
  const cleanupEmployeeIds: string[] = [];
  const cleanupBranchIds: string[] = [];
  const cleanupServiceIds: string[] = [];
  const cleanupBookingIds: string[] = [];
  const cleanupCategoryIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP: Test Fixtures
    // -------------------------------------------------------------------------
    console.log("--> Setting up test fixtures for Epic 5 scheduling audit...");

    // 1. Create a dedicated test Branch with specific hours (Mon-Sat 09:00 - 18:00, Sun CLOSED)
    const branch = await prisma.branch.create({
      data: {
        name: `Epic5 Sanctuary ${ts}`,
        slug: `epic5-sanctuary-${ts}`,
        addressLine: "Bole Medhanialem, Test Suite 500",
        phoneNumber: `+251911${String(ts).slice(-6)}`,
        city: "Addis Ababa",
        isActive: true,
        slotBufferMinutes: 15,
        branchHours: {
          create: [
            { dayOfWeek: 0, openTime: "09:00", closeTime: "18:00", isClosed: true }, // Sunday CLOSED
            { dayOfWeek: 1, openTime: "09:00", closeTime: "18:00", isClosed: false }, // Monday
            { dayOfWeek: 2, openTime: "09:00", closeTime: "18:00", isClosed: false }, // Tuesday
            { dayOfWeek: 3, openTime: "09:00", closeTime: "18:00", isClosed: false }, // Wednesday
            { dayOfWeek: 4, openTime: "09:00", closeTime: "18:00", isClosed: false }, // Thursday
            { dayOfWeek: 5, openTime: "09:00", closeTime: "18:00", isClosed: false }, // Friday
            { dayOfWeek: 6, openTime: "09:00", closeTime: "18:00", isClosed: false }, // Saturday
          ],
        },
      },
    });
    cleanupBranchIds.push(branch.id);

    // 2. Create Category and two services (60 min and 30 min)
    const category = await prisma.serviceCategory.create({
      data: {
        name: `Epic5 Category ${ts}`,
        slug: `epic5-cat-${ts}`,
        status: "APPROVED",
        isActive: true,
      },
    });
    cleanupCategoryIds.push(category.id);

    const service60 = await prisma.service.create({
      data: {
        code: `EP5-60-${ts % 10000}`,
        name: `Epic5 Haute Styling 60m ${ts}`,
        slug: `epic5-style-60-${ts}`,
        category: "HAIR",
        serviceCategory: { connect: { id: category.id } },
        durationMinutes: 60,
        turnaroundBuffer: 15,
        basePrice: 1200,
        isActive: true,
        approvalStatus: "APPROVED",
      },
    });
    cleanupServiceIds.push(service60.id);

    const service30 = await prisma.service.create({
      data: {
        code: `EP5-30-${ts % 10000}`,
        name: `Epic5 Luxury Finishing 30m ${ts}`,
        slug: `epic5-finish-30-${ts}`,
        category: "HAIR",
        serviceCategory: { connect: { id: category.id } },
        durationMinutes: 30,
        turnaroundBuffer: 15,
        basePrice: 600,
        isActive: true,
        approvalStatus: "APPROVED",
      },
    });
    cleanupServiceIds.push(service30.id);

    // 3. Create Specialist Employee with qualification in both services
    const specialistPwd = "SpecialistPass123!";
    const specialistHashed = await hashPassword(specialistPwd);
    const specialistUser = await prisma.user.create({
      data: {
        email: `specialist.epic5.${ts}@eyobsalon.audit`,
        phone: `+251922${String(ts).slice(-6)}`,
        password: specialistHashed,
        firstName: "Tigist",
        lastName: "Hailu",
        role: UserRole.EMPLOYEE,
      },
    });
    cleanupUserIds.push(specialistUser.id);

    const specialist = await prisma.employee.create({
      data: {
        userId: specialistUser.id,
        branchId: branch.id,
        firstName: "Tigist",
        lastName: "Hailu",
        email: specialistUser.email,
        phone: specialistUser.phone,
        ritualTitle: "Master Artisan",
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        schedules: {
          create: [
            // Sunday day off
            { dayOfWeek: 0, isWorking: false, startTime: "09:00", endTime: "17:00" },
            // Monday - Saturday: 09:00 - 17:00, lunch break 13:00 - 14:00
            { dayOfWeek: 1, isWorking: true, startTime: "09:00", endTime: "17:00", breakStartTime: "13:00", breakEndTime: "14:00" },
            { dayOfWeek: 2, isWorking: true, startTime: "09:00", endTime: "17:00", breakStartTime: "13:00", breakEndTime: "14:00" },
            { dayOfWeek: 3, isWorking: true, startTime: "09:00", endTime: "17:00", breakStartTime: "13:00", breakEndTime: "14:00" },
            { dayOfWeek: 4, isWorking: true, startTime: "09:00", endTime: "17:00", breakStartTime: "13:00", breakEndTime: "14:00" },
            { dayOfWeek: 5, isWorking: true, startTime: "09:00", endTime: "17:00", breakStartTime: "13:00", breakEndTime: "14:00" },
            { dayOfWeek: 6, isWorking: true, startTime: "09:00", endTime: "17:00", breakStartTime: "13:00", breakEndTime: "14:00" },
          ],
        },
        services: {
          create: [
            { serviceId: service60.id, isQualified: true },
            { serviceId: service30.id, isQualified: true },
          ],
        },
      },
    });
    cleanupEmployeeIds.push(specialist.id);

    // 4. Create Customer User & Auth Token
    const customerPwd = "CustomerPass123!";
    const customerHashed = await hashPassword(customerPwd);
    const customerUser = await prisma.user.create({
      data: {
        email: `customer.epic5.${ts}@eyobsalon.audit`,
        phone: `+251933${String(ts).slice(-6)}`,
        password: customerHashed,
        firstName: "Bethelhem",
        lastName: "Mekonnen",
        role: UserRole.CUSTOMER,
      },
    });
    cleanupUserIds.push(customerUser.id);

    const loginRes = await postJson("/auth/login", {
      identifier: customerUser.phone,
      password: customerPwd,
      role: "CUSTOMER",
    });

    const customerToken =
      loginRes.data?.data?.tokens?.accessToken ||
      loginRes.data?.tokens?.accessToken ||
      loginRes.data?.accessToken ||
      loginRes.data?.data?.token ||
      loginRes.data?.token;

    if (!customerToken) {
      throw new Error(`Customer login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
    }

    const customerAuthHeaders = { Authorization: `Bearer ${customerToken}` };

    // Helper: Find next occurrences of specific day of week (0 = Sunday, 2 = Tuesday)
    function getNextDateForDayOfWeek(targetDay: number, minDaysAhead = 1): string {
      const d = new Date();
      d.setDate(d.getDate() + minDaysAhead);
      while (d.getDay() !== targetDay) {
        d.setDate(d.getDate() + 1);
      }
      return d.toISOString().split("T")[0];
    }

    const nextSunday = getNextDateForDayOfWeek(0, 1);
    const nextTuesday = getNextDateForDayOfWeek(2, 2);

    // -------------------------------------------------------------------------
    // SCENARIO 1: Dynamic Availability Math (Branch Hours, Shifts, Exceptions)
    // -------------------------------------------------------------------------
    console.log("\n--> SCENARIO 1: Dynamic Availability Math");

    // Test 1A: Closed branch returns 0 slots
    const sunRes = await getJson(
      `/bookings/availability?branchId=${branch.id}&serviceId=${service60.id}&employeeId=${specialist.id}&date=${nextSunday}`
    );
    const sunSlots = sunRes.data?.data?.availableSlots || sunRes.data?.availableSlots || [];
    const sunPassed = sunRes.status === 200 && Array.isArray(sunSlots) && sunSlots.length === 0;
    record(
      "EPIC5-S1A",
      "Branch Closed Day Availability",
      sunPassed,
      `Sunday availability for closed branch returned ${sunSlots.length} slots (expected: 0)`
    );

    // Test 1B: Active Shift on Tuesday returns valid daytime slots
    const tueRes = await getJson(
      `/bookings/availability?branchId=${branch.id}&serviceId=${service60.id}&employeeId=${specialist.id}&date=${nextTuesday}`
    );
    const tueSlots: string[] = tueRes.data?.data?.availableSlots || tueRes.data?.availableSlots || [];
    // Tuesday shift is 09:00 - 17:00, with break 13:00 - 14:00.
    // For a 60-min service, slot 13:00 must NOT be available, and slot 16:00 is the last one (ends at 17:00).
    const hasMorningSlot = tueSlots.includes("09:00") || tueSlots.includes("09:15") || tueSlots.includes("09:30");
    const noBreakConflict = !tueSlots.includes("13:00") && !tueSlots.includes("13:15") && !tueSlots.includes("13:30");
    const noAfterShiftSlot = !tueSlots.includes("16:15") && !tueSlots.includes("16:30") && !tueSlots.includes("17:00");
    const shiftMathPassed = tueRes.status === 200 && tueSlots.length > 0 && hasMorningSlot && noBreakConflict && noAfterShiftSlot;
    record(
      "EPIC5-S1B",
      "Specialist Active Shift & Break Boundary Math",
      shiftMathPassed,
      `Tuesday shift returned ${tueSlots.length} slots. Morning slot: ${hasMorningSlot}, break filtered: ${noBreakConflict}, post-shift filtered: ${noAfterShiftSlot}`
    );

    // Test 1C: Schedule Exception (Sick Leave / Day Off) purges all specialist slots
    const exception = await prisma.scheduleException.create({
      data: {
        employeeId: specialist.id,
        date: new Date(`${nextTuesday}T00:00:00.000Z`),
        isOff: true,
        reason: "SICK_LEAVE",
      },
    });

    const exRes = await getJson(
      `/bookings/availability?branchId=${branch.id}&serviceId=${service60.id}&employeeId=${specialist.id}&date=${nextTuesday}`
    );
    const exSlots = exRes.data?.data?.availableSlots || exRes.data?.availableSlots || [];
    const exPassed = exRes.status === 200 && Array.isArray(exSlots) && exSlots.length === 0;
    record(
      "EPIC5-S1C",
      "Specialist Schedule Exception (Sick Leave)",
      exPassed,
      `Specialist on approved sick leave returned ${exSlots.length} slots (expected: 0)`
    );

    // Remove exception for subsequent tests
    await prisma.scheduleException.delete({ where: { id: exception.id } });

    // -------------------------------------------------------------------------
    // SCENARIO 2: Same-Day Slot Calculation & Past-Time Purging
    // -------------------------------------------------------------------------
    console.log("\n--> SCENARIO 2: Same-Day Slot Calculation & Past-Time Purging");

    // Calculate current Addis Ababa date (UTC+3)
    const nowUTC = new Date();
    const addisOffsetMs = 3 * 60 * 60 * 1000;
    const addisNow = new Date(nowUTC.getTime() + addisOffsetMs);
    const todayAddisStr = addisNow.toISOString().split("T")[0];
    const currentAddisMinutes = addisNow.getUTCHours() * 60 + addisNow.getUTCMinutes();
    const pastThresholdMinutes = currentAddisMinutes + 15; // 15-minute buffer

    const todayRes = await getJson(
      `/bookings/availability?branchId=${branch.id}&serviceId=${service30.id}&employeeId=${specialist.id}&date=${todayAddisStr}`
    );
    const todaySlots: string[] = todayRes.data?.data?.availableSlots || todayRes.data?.availableSlots || [];

    // Verify: No slot returned for today begins at or prior to pastThresholdMinutes
    let pastSlotFound = false;
    for (const slot of todaySlots) {
      const [h, m] = slot.split(":").map(Number);
      const slotMin = h * 60 + m;
      if (slotMin <= pastThresholdMinutes) {
        pastSlotFound = true;
        break;
      }
    }

    const sameDayPassed = todayRes.status === 200 && !pastSlotFound;
    record(
      "EPIC5-S2",
      "Same-Day Past Time Purging (Addis Ababa UTC+3)",
      sameDayPassed,
      `Today (${todayAddisStr}) returned ${todaySlots.length} slots. Current Addis time: ${String(Math.floor(currentAddisMinutes / 60)).padStart(2, "0")}:${String(currentAddisMinutes % 60).padStart(2, "0")}. Past slot collision: ${pastSlotFound}`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 3: Multi-Service Sequencing & Consecutive Slot Calculator
    // -------------------------------------------------------------------------
    console.log("\n--> SCENARIO 3: Multi-Service Sequencing & Consecutive Slot Calculation");

    const multiRes = await postJson("/bookings/availability/multi-service", {
      branchId: branch.id,
      date: nextTuesday,
      services: [
        { serviceId: service60.id, preferredEmployeeId: specialist.id },
        { serviceId: service30.id, preferredEmployeeId: specialist.id },
      ],
      requireSameSpecialist: true,
      timeZone: "Africa/Addis_Ababa",
    });

    const chainOptions = multiRes.data?.data?.chainOptions || multiRes.data?.chainOptions || [];
    let chainStructureValid = false;
    if (multiRes.status === 200 && Array.isArray(chainOptions) && chainOptions.length > 0) {
      const firstChain = chainOptions[0];
      const hasTotalDuration = firstChain.totalDurationMinutes === 90;
      const hasTwoSteps = firstChain.steps && firstChain.steps.length === 2;
      const step1 = firstChain.steps[0];
      const step2 = firstChain.steps[1];
      const step1Matches = step1.durationMinutes === 60 && step1.serviceId === service60.id;
      const step2Matches = step2.durationMinutes === 30 && step2.serviceId === service30.id;
      const consecutiveTime = step1.endTime === step2.startTime;
      const sameSpecialist = step1.employeeId === specialist.id && step2.employeeId === specialist.id;

      chainStructureValid = hasTotalDuration && hasTwoSteps && step1Matches && step2Matches && consecutiveTime && sameSpecialist;
    }

    record(
      "EPIC5-S3",
      "Multi-Service Consecutive Chain Calculation",
      chainStructureValid,
      `Chains returned: ${chainOptions.length}. Valid 60m+30m consecutive alignment: ${chainStructureValid}`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 4: Double-Booking Prevention & Advisory Lock Concurrency
    // -------------------------------------------------------------------------
    console.log("\n--> SCENARIO 4: Double-Booking Prevention & Concurrency Lock");

    // Target a specific morning slot on nextTuesday: 10:00 (Addis Ababa = 07:00 UTC)
    const targetDateStr = nextTuesday;
    const [y, m, d] = targetDateStr.split("-").map(Number);
    const targetSlotIso = new Date(Date.UTC(y, m - 1, d, 7, 0, 0, 0)).toISOString(); // 10:00 Addis = 07:00 UTC

    // Launch 2 simultaneous booking requests for the exact same specialist and slot
    console.log(`Firing 2 concurrent booking requests for specialist ${specialist.id} at ${targetSlotIso}...`);
    const [req1, req2] = await Promise.all([
      postJson(
        "/bookings",
        {
          branchId: branch.id,
          serviceId: service60.id,
          employeeId: specialist.id,
          startTime: targetSlotIso,
          notes: "Concurrent patron A",
        },
        customerAuthHeaders
      ),
      postJson(
        "/bookings",
        {
          branchId: branch.id,
          serviceId: service60.id,
          employeeId: specialist.id,
          startTime: targetSlotIso,
          notes: "Concurrent patron B",
        },
        customerAuthHeaders
      ),
    ]);

    const statuses = [req1.status, req2.status].sort();
    const oneSuccess = statuses.includes(201) || statuses.includes(200);
    const oneConflict = statuses.includes(409);

    if (req1.data?.data?.id) cleanupBookingIds.push(req1.data.data.id);
    if (req2.data?.data?.id) cleanupBookingIds.push(req2.data.data.id);

    // Verify in database: Exactly one booking item exists for this specialist during that window
    const overlappingBookingsInDb = await prisma.bookingItem.findMany({
      where: {
        employeeId: specialist.id,
        startTime: { gte: new Date(Date.UTC(y, m - 1, d, 6, 50, 0)), lte: new Date(Date.UTC(y, m - 1, d, 7, 10, 0)) },
      },
    });

    const concurrencyPassed = oneSuccess && oneConflict && overlappingBookingsInDb.length === 1;
    record(
      "EPIC5-S4",
      "Pessimistic Advisory Lock Double-Booking Guard",
      concurrencyPassed,
      `Request 1 status: ${req1.status}, Request 2 status: ${req2.status}. DB items committed: ${overlappingBookingsInDb.length} (expected: 1 success, 1 409 conflict, 1 DB row)`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 5: Multi-Item Booking Creation with Sequence Order
    // -------------------------------------------------------------------------
    console.log("\n--> SCENARIO 5: Multi-Item Booking Creation & Sequence Tracking");

    // Book consecutive items: Step 1 at 14:00 (11:00 UTC), Step 2 at 15:00 (12:00 UTC)
    const step1Iso = new Date(Date.UTC(y, m - 1, d, 11, 0, 0, 0)).toISOString();
    const step2Iso = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0)).toISOString();

    const multiBookingRes = await postJson(
      "/bookings",
      {
        branchId: branch.id,
        items: [
          {
            serviceId: service60.id,
            employeeId: specialist.id,
            startTime: step1Iso,
            sequenceOrder: 0,
          },
          {
            serviceId: service30.id,
            employeeId: specialist.id,
            startTime: step2Iso,
            sequenceOrder: 1,
          },
        ],
        notes: "Multi-service ritual package",
      },
      customerAuthHeaders
    );

    let multiBookingValid = false;
    if (multiBookingRes.status === 201 || multiBookingRes.status === 200) {
      const createdBookingId =
        multiBookingRes.data?.data?.booking?.id ||
        multiBookingRes.data?.data?.id ||
        multiBookingRes.data?.booking?.id ||
        multiBookingRes.data?.id;
      if (createdBookingId) {
        cleanupBookingIds.push(createdBookingId);

        const dbBooking = await prisma.booking.findUnique({
          where: { id: createdBookingId },
          include: {
            items: {
              orderBy: { sequenceOrder: "asc" },
            },
          },
        });

        if (dbBooking && dbBooking.items.length === 2) {
          const item1 = dbBooking.items[0];
          const item2 = dbBooking.items[1];
          const hasCorrectSequence = item1.sequenceOrder === 0 && item2.sequenceOrder === 1;
          const hasFrozenPrices =
            (Number(item1.priceSnapshot) === 1200 || Number(item1.snapshotPrice) === 1200) &&
            (Number(item2.priceSnapshot) === 600 || Number(item2.snapshotPrice) === 600);
          const hasFrozenDurations =
            (item1.durationSnapshot === 60 || item1.snapshotDurationMinutes === 60) &&
            (item2.durationSnapshot === 30 || item2.snapshotDurationMinutes === 30);
          multiBookingValid = hasCorrectSequence && hasFrozenPrices && hasFrozenDurations;
        }
      }
    }

    record(
      "EPIC5-S5",
      "Atomic Multi-Item Booking with SequenceOrder and Snapshot Freezing",
      multiBookingValid,
      `Multi-booking status: ${multiBookingRes.status}. Items correctly sequenced and frozen: ${multiBookingValid}`
    );

  } catch (error: any) {
    console.error("Audit encounter unexpected exception:", error);
    record("EPIC5-FATAL", "Audit Runtime Exception", false, error.message || String(error));
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\n--> Cleaning up test fixtures...");

    if (cleanupBookingIds.length > 0) {
      await prisma.bookingItem.deleteMany({ where: { bookingId: { in: cleanupBookingIds } } }).catch(() => {});
      await prisma.booking.deleteMany({ where: { id: { in: cleanupBookingIds } } }).catch(() => {});
    }

    if (cleanupEmployeeIds.length > 0) {
      await prisma.scheduleException.deleteMany({ where: { employeeId: { in: cleanupEmployeeIds } } }).catch(() => {});
      await prisma.employeeSchedule.deleteMany({ where: { employeeId: { in: cleanupEmployeeIds } } }).catch(() => {});
      await prisma.employeeService.deleteMany({ where: { employeeId: { in: cleanupEmployeeIds } } }).catch(() => {});
      await prisma.employee.deleteMany({ where: { id: { in: cleanupEmployeeIds } } }).catch(() => {});
    }

    if (cleanupUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: cleanupUserIds } } }).catch(() => {});
    }

    if (cleanupServiceIds.length > 0) {
      await prisma.branchServicePrice.deleteMany({ where: { serviceId: { in: cleanupServiceIds } } }).catch(() => {});
      await prisma.service.deleteMany({ where: { id: { in: cleanupServiceIds } } }).catch(() => {});
    }

    if (cleanupCategoryIds.length > 0) {
      await prisma.serviceCategory.deleteMany({ where: { id: { in: cleanupCategoryIds } } }).catch(() => {});
    }

    if (cleanupBranchIds.length > 0) {
      await prisma.branchHours.deleteMany({ where: { branchId: { in: cleanupBranchIds } } }).catch(() => {});
      await prisma.branch.deleteMany({ where: { id: { in: cleanupBranchIds } } }).catch(() => {});
    }

    await prisma.$disconnect();
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log("             EPIC 5 SCHEDULING & CONCURRENCY AUDIT REPORT                 ");
  console.log("==========================================================================");

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`TOTAL SCENARIOS: ${total}`);
  console.log(`PASSED:          ${passed}`);
  console.log(`FAILED:          ${failed}`);

  if (failed > 0) {
    console.error(`\n❌ AUDIT FAILED: ${failed} scenario(s) did not pass verification gates.`);
    process.exit(1);
  } else {
    console.log(`\n✅ ALL SPRINT 5 EPIC 5 GATES PASSED (100% SUCCESS)`);
    process.exit(0);
  }
}

runEpic5Audit();
