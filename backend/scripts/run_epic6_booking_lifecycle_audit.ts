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

async function getJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function run() {
  console.log("=================================================================");
  console.log(" EYOB SALON — SPRINT 6 EPIC 6: BOOKING LIFECYCLE AUDIT          ");
  console.log("=================================================================\n");

  const pwd = await hashPassword("Password123!");

  // 1. Setup Branches
  const boleBranch = await prisma.branch.upsert({
    where: { slug: "epic6-bole" },
    update: { isActive: true },
    create: {
      name: "Epic6 Bole Sanctuary",
      slug: "epic6-bole",
      addressLine: "Bole Medhanialem",
      city: "Addis Ababa",
      phoneNumber: "+251911000001",
      isActive: true,
    },
  });

  const kazanchisBranch = await prisma.branch.upsert({
    where: { slug: "epic6-kazanchis" },
    update: { isActive: true },
    create: {
      name: "Epic6 Kazanchis Sanctuary",
      slug: "epic6-kazanchis",
      addressLine: "Kazanchis",
      city: "Addis Ababa",
      phoneNumber: "+251911000002",
      isActive: true,
    },
  });

  // 2. Setup Category & Services
  const category = await prisma.serviceCategory.upsert({
    where: { slug: "epic6-hair" },
    update: { isActive: true },
    create: {
      name: "Epic6 Hair Styling",
      slug: "epic6-hair",
      isActive: true,
    },
  });

  const service1 = await prisma.service.upsert({
    where: { code: "EPIC6-SRV-1" },
    update: { isActive: true, basePrice: 1500, durationMinutes: 60, approvalStatus: "APPROVED" },
    create: {
      code: "EPIC6-SRV-1",
      name: "Royal Hair Ritual",
      amharicName: "የፀጉር አሰራር",
      slug: "royal-hair-ritual-epic6",
      basePrice: 1500,
      durationMinutes: 60,
      categoryId: category.id,
      branchId: boleBranch.id,
      isActive: true,
      approvalStatus: "APPROVED",
    },
  });

  await prisma.branchService.upsert({
    where: {
      branchId_serviceId: {
        branchId: boleBranch.id,
        serviceId: service1.id,
      },
    },
    update: { isActive: true, customPrice: 1500, requiredDeposit: 300 },
    create: {
      branchId: boleBranch.id,
      serviceId: service1.id,
      customPrice: 1500,
      requiredDeposit: 300,
      isActive: true,
    },
  });

  // 3. Setup Users & Roles
  // Owner
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner.epic6@eyobsalon.com" },
    update: { role: "OWNER", password: pwd, phone: "+251911990001" },
    create: {
      email: "owner.epic6@eyobsalon.com",
      phone: "+251911990001",
      password: pwd,
      firstName: "Owner",
      lastName: "Global",
      role: "OWNER",
    },
  });

  // Bole Admin
  const boleAdminUser = await prisma.user.upsert({
    where: { email: "admin.bole.epic6@eyobsalon.com" },
    update: { role: "BRANCH_ADMIN", branchId: boleBranch.id, password: pwd, phone: "+251911990002" },
    create: {
      email: "admin.bole.epic6@eyobsalon.com",
      phone: "+251911990002",
      password: pwd,
      firstName: "Bole",
      lastName: "Admin",
      role: "BRANCH_ADMIN",
      branchId: boleBranch.id,
    },
  });

  // Kazanchis Admin
  const kazAdminUser = await prisma.user.upsert({
    where: { email: "admin.kaz.epic6@eyobsalon.com" },
    update: { role: "BRANCH_ADMIN", branchId: kazanchisBranch.id, password: pwd, phone: "+251911990003" },
    create: {
      email: "admin.kaz.epic6@eyobsalon.com",
      phone: "+251911990003",
      password: pwd,
      firstName: "Kazanchis",
      lastName: "Admin",
      role: "BRANCH_ADMIN",
      branchId: kazanchisBranch.id,
    },
  });

  // Specialist A (Bole)
  const specAUser = await prisma.user.upsert({
    where: { email: "specA.epic6@eyobsalon.com" },
    update: { role: "EMPLOYEE", branchId: boleBranch.id, password: pwd, phone: "+251911100001" },
    create: {
      email: "specA.epic6@eyobsalon.com",
      phone: "+251911100001",
      password: pwd,
      firstName: "Hanan",
      lastName: "Master",
      role: "EMPLOYEE",
      branchId: boleBranch.id,
    },
  });

  const employeeA = await prisma.employee.upsert({
    where: { userId: specAUser.id },
    update: {
      branchId: boleBranch.id,
      status: "ACTIVE",
      isActive: true,
      workstation: "Suite 101",
      phone: "+251911100001",
      email: "specA.epic6@eyobsalon.com",
    },
    create: {
      userId: specAUser.id,
      email: "specA.epic6@eyobsalon.com",
      firstName: "Hanan",
      lastName: "Master",
      phone: "+251911100001",
      branchId: boleBranch.id,
      status: "ACTIVE",
      isActive: true,
      workstation: "Suite 101",
    },
  });

  // Assign service1 to Employee A
  await prisma.employeeService.upsert({
    where: {
      employeeId_serviceId: {
        employeeId: employeeA.id,
        serviceId: service1.id,
      },
    },
    update: { isQualified: true },
    create: {
      employeeId: employeeA.id,
      serviceId: service1.id,
      isQualified: true,
    },
  });

  // Ensure Employee A has active shifts for all days
  for (let dow = 0; dow <= 6; dow++) {
    await prisma.employeeSchedule.upsert({
      where: {
        employeeId_dayOfWeek: {
          employeeId: employeeA.id,
          dayOfWeek: dow,
        },
      },
      update: {
        startTime: "08:30",
        endTime: "20:00",
        isWorking: true,
      },
      create: {
        employeeId: employeeA.id,
        dayOfWeek: dow,
        startTime: "08:30",
        endTime: "20:00",
        isWorking: true,
      },
    });
  }

  // Specialist B (Bole, not assigned to test booking)
  const specBUser = await prisma.user.upsert({
    where: { email: "specB.epic6@eyobsalon.com" },
    update: { role: "EMPLOYEE", branchId: boleBranch.id, password: pwd, phone: "+251911100002" },
    create: {
      email: "specB.epic6@eyobsalon.com",
      phone: "+251911100002",
      password: pwd,
      firstName: "Sara",
      lastName: "Artisan",
      role: "EMPLOYEE",
      branchId: boleBranch.id,
    },
  });

  const employeeB = await prisma.employee.upsert({
    where: { userId: specBUser.id },
    update: {
      branchId: boleBranch.id,
      status: "ACTIVE",
      isActive: true,
      workstation: "Suite 102",
      phone: "+251911100002",
      email: "specB.epic6@eyobsalon.com",
    },
    create: {
      userId: specBUser.id,
      email: "specB.epic6@eyobsalon.com",
      firstName: "Sara",
      lastName: "Artisan",
      phone: "+251911100002",
      branchId: boleBranch.id,
      status: "ACTIVE",
      isActive: true,
      workstation: "Suite 102",
    },
  });

  // Customers
  const cust1User = await prisma.user.upsert({
    where: { email: "cust1.epic6@eyobsalon.com" },
    update: { role: "CUSTOMER", password: pwd, phone: "+251911990004" },
    create: {
      email: "cust1.epic6@eyobsalon.com",
      phone: "+251911990004",
      password: pwd,
      firstName: "Selam",
      lastName: "Patron",
      role: "CUSTOMER",
    },
  });

  const cust2User = await prisma.user.upsert({
    where: { email: "cust2.epic6@eyobsalon.com" },
    update: { role: "CUSTOMER", password: pwd, phone: "+251911990005" },
    create: {
      email: "cust2.epic6@eyobsalon.com",
      phone: "+251911990005",
      password: pwd,
      firstName: "Tigist",
      lastName: "Patron",
      role: "CUSTOMER",
    },
  });

  // Authenticate all users
  const login = async (email: string, role: string) => {
    const res = await postJson("/auth/login", { identifier: email, password: "Password123!", role });
    const token = res.data?.data?.tokens?.accessToken || res.data?.data?.accessToken || res.data?.accessToken;
    if (!token) {
      throw new Error(`Login failed for ${email} (${role}): ${JSON.stringify(res.data)}`);
    }
    return { Authorization: `Bearer ${token}` };
  };

  const ownerHeaders = await login(ownerUser.email, "OWNER");
  const boleAdminHeaders = await login(boleAdminUser.email, "BRANCH_ADMIN");
  const kazAdminHeaders = await login(kazAdminUser.email, "BRANCH_ADMIN");
  const specAHeaders = await login(specAUser.email, "EMPLOYEE");
  const specBHeaders = await login(specBUser.email, "EMPLOYEE");
  const cust1Headers = await login(cust1User.email, "CUSTOMER");
  const cust2Headers = await login(cust2User.email, "CUSTOMER");

  console.log("✓ Authenticated all test users.\n");

  // =================================================================
  // TEST 1: Booking Creation, Human-Readable Number & Immutable Snapshots
  // =================================================================
  console.log("--- Test 1: Creation, Booking Number & Snapshots ---");
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  futureDate.setUTCHours(10, 0, 0, 0);

  const createRes = await postJson(
    "/bookings",
    {
      branchId: boleBranch.id,
      serviceId: service1.id,
      employeeId: employeeA.id,
      startTime: futureDate.toISOString(),
      notes: "Epic 6 Lifecycle Verification",
    },
    cust1Headers
  );

  const createdBooking = createRes.data?.data?.booking;
  const isCreated201 = createRes.status === 201 && !!createdBooking;
  const hasValidBookingNumber = /^EYB-\d{5,6}$/.test(createdBooking?.bookingNumber || "");

  const item0 = createdBooking?.items?.[0];
  const hasSnapshots =
    item0?.snapshotServiceName === "Royal Hair Ritual" &&
    Number(item0?.snapshotPrice) === 1500 &&
    Number(item0?.snapshotDurationMinutes) === 60 &&
    Number(item0?.snapshotDepositAmount) === 300 &&
    item0?.snapshotEmployeeName === "Hanan Master";

  record(
    "1.1",
    "Customer Appointment Creation",
    isCreated201,
    `Status ${createRes.status}, ID: ${createdBooking?.id}`
  );

  record(
    "1.2",
    "Human-Readable Booking Number Format (EYB-[5-6 DIGITS])",
    hasValidBookingNumber,
    `BookingNumber: ${createdBooking?.bookingNumber}`
  );

  record(
    "1.3",
    "Immutable Snapshot Verification (Service, Price, Duration, Deposit, Employee)",
    hasSnapshots,
    `SnapshotService: '${item0?.snapshotServiceName}', SnapshotEmployee: '${item0?.snapshotEmployeeName}', SnapshotPrice: ${item0?.snapshotPrice}`
  );

  // =================================================================
  // TEST 2: Finite State Machine Valid Lifecycle
  // PENDING_PAYMENT -> CONFIRMED -> IN_PROGRESS -> COMPLETED
  // =================================================================
  console.log("\n--- Test 2: FSM Valid Lifecycle Flow ---");
  const testBookingId = createdBooking.id;

  // If status is PENDING_PAYMENT, transition to CONFIRMED
  if (createdBooking.status === "PENDING_PAYMENT") {
    const toConfirmed = await patchJson(
      `/bookings/${testBookingId}/status`,
      { targetStatus: "CONFIRMED" },
      boleAdminHeaders
    );
    record(
      "2.1",
      "Transition PENDING_PAYMENT -> CONFIRMED",
      toConfirmed.status === 200,
      `Status ${toConfirmed.status}`
    );
  } else {
    record(
      "2.1",
      "Initial Status is already CONFIRMED",
      createdBooking.status === "CONFIRMED",
      `Status: ${createdBooking.status}`
    );
  }

  // CONFIRMED -> IN_PROGRESS (by Specialist A)
  const toInProgress = await patchJson(
    `/bookings/${testBookingId}/status`,
    { targetStatus: "IN_PROGRESS" },
    specAHeaders
  );
  record(
    "2.2",
    "Transition CONFIRMED -> IN_PROGRESS (Specialist A)",
    toInProgress.status === 200 && toInProgress.data?.data?.booking?.status === "IN_PROGRESS",
    `Status ${toInProgress.status}, DB Status: ${toInProgress.data?.data?.booking?.status}`
  );

  // IN_PROGRESS -> COMPLETED (by Specialist A)
  const toCompleted = await patchJson(
    `/bookings/${testBookingId}/status`,
    { targetStatus: "COMPLETED" },
    specAHeaders
  );
  const completedBooking = toCompleted.data?.data?.booking;
  const isCompletedValid =
    toCompleted.status === 200 &&
    completedBooking?.status === "COMPLETED" &&
    Number(completedBooking?.balanceDue) === 0 &&
    completedBooking?.paymentStatus === "PAID";

  record(
    "2.3",
    "Transition IN_PROGRESS -> COMPLETED (Zero Balance Due & Payment Marked Paid)",
    isCompletedValid,
    `Status ${toCompleted.status}, balanceDue: ${completedBooking?.balanceDue}, paymentStatus: ${completedBooking?.paymentStatus}`
  );

  // =================================================================
  // TEST 3: Illegal Jumps & Invalid Transitions (Must Throw 400 Bad Request)
  // =================================================================
  console.log("\n--- Test 3: Illegal FSM Transitions & Jumps ---");

  // Attempt jump from COMPLETED backwards to CONFIRMED
  const backwardJump = await patchJson(
    `/bookings/${testBookingId}/status`,
    { targetStatus: "CONFIRMED" },
    ownerHeaders
  );
  record(
    "3.1",
    "Backwards Jump COMPLETED -> CONFIRMED Blocked",
    backwardJump.status === 400,
    `Expected 400, got ${backwardJump.status}: ${backwardJump.data?.message || ""}`
  );

  // Attempt jump from COMPLETED to CANCELLED
  const completedToCancelled = await patchJson(
    `/bookings/${testBookingId}/status`,
    { targetStatus: "CANCELLED", reason: "Cannot cancel completed" },
    ownerHeaders
  );
  record(
    "3.2",
    "Terminal State Exit COMPLETED -> CANCELLED Blocked",
    completedToCancelled.status === 400,
    `Expected 400, got ${completedToCancelled.status}: ${completedToCancelled.data?.message || ""}`
  );

  // Create a second fresh booking to test illegal forward jump
  const freshRes = await postJson(
    "/bookings",
    {
      branchId: boleBranch.id,
      serviceId: service1.id,
      employeeId: employeeA.id,
      startTime: futureDate.toISOString(),
    },
    cust1Headers
  );
  const freshBookingId = freshRes.data?.data?.booking?.id;

  // If status is CONFIRMED, attempt illegal jump directly to COMPLETED without IN_PROGRESS
  const illegalForwardJump = await patchJson(
    `/bookings/${freshBookingId}/status`,
    { targetStatus: "COMPLETED" },
    ownerHeaders
  );
  record(
    "3.3",
    "Illegal Forward Jump CONFIRMED -> COMPLETED without IN_PROGRESS Blocked",
    illegalForwardJump.status === 400,
    `Expected 400, got ${illegalForwardJump.status}: ${illegalForwardJump.data?.message || ""}`
  );

  // Invalid status string
  const invalidStatusRes = await patchJson(
    `/bookings/${freshBookingId}/status`,
    { targetStatus: "NON_EXISTENT_STATUS" },
    ownerHeaders
  );
  record(
    "3.4",
    "Invalid Target Status Rejected",
    invalidStatusRes.status === 400,
    `Expected 400, got ${invalidStatusRes.status}: ${invalidStatusRes.data?.message || ""}`
  );

  // =================================================================
  // TEST 4: Customer Cancellation Rules & Audit Logging
  // =================================================================
  console.log("\n--- Test 4: Customer Cancellation Rules & Audit Logging ---");

  // Attempt cancellation without reason
  const cancelNoReason = await patchJson(
    `/bookings/${freshBookingId}/status`,
    { targetStatus: "CANCELLED" },
    cust1Headers
  );
  record(
    "4.1",
    "Customer Cancellation Without Reason Blocked (Min 3 chars)",
    cancelNoReason.status === 400,
    `Expected 400, got ${cancelNoReason.status}: ${cancelNoReason.data?.message || ""}`
  );

  // Attempt cancellation with reason < 3 chars
  const cancelShortReason = await patchJson(
    `/bookings/${freshBookingId}/status`,
    { targetStatus: "CANCELLED", reason: "ab" },
    cust1Headers
  );
  record(
    "4.2",
    "Customer Cancellation With < 3 Chars Reason Blocked",
    cancelShortReason.status === 400,
    `Expected 400, got ${cancelShortReason.status}: ${cancelShortReason.data?.message || ""}`
  );

  // Valid Cancellation with Reason >= 3 chars
  const validCancel = await patchJson(
    `/bookings/${freshBookingId}/status`,
    { targetStatus: "CANCELLED", reason: "Personal emergency out of town" },
    cust1Headers
  );
  const cancelledBooking = validCancel.data?.data?.booking;
  const isCancelSuccess =
    validCancel.status === 200 &&
    cancelledBooking?.status === "CANCELLED" &&
    cancelledBooking?.cancellationReason === "Personal emergency out of town" &&
    !!cancelledBooking?.cancelledAt;

  record(
    "4.3",
    "Valid Customer Cancellation Succeeded & Cancellation Reason Recorded",
    isCancelSuccess,
    `Status ${validCancel.status}, DB Reason: '${cancelledBooking?.cancellationReason}', CancelledAt: ${cancelledBooking?.cancelledAt}`
  );

  // Attempt to cancel again (already CANCELLED)
  const cancelAgain = await patchJson(
    `/bookings/${freshBookingId}/status`,
    { targetStatus: "CANCELLED", reason: "Try again" },
    cust1Headers
  );
  record(
    "4.4",
    "Re-cancellation of Already CANCELLED Appointment Blocked",
    cancelAgain.status === 400,
    `Expected 400, got ${cancelAgain.status}: ${cancelAgain.data?.message || ""}`
  );

  // Customer attempts to cancel completed booking
  const cancelCompleted = await patchJson(
    `/bookings/${testBookingId}/status`,
    { targetStatus: "CANCELLED", reason: "Attempt cancel completed" },
    cust1Headers
  );
  record(
    "4.5",
    "Customer Cancellation of COMPLETED Appointment Blocked",
    cancelCompleted.status === 400,
    `Expected 400, got ${cancelCompleted.status}: ${cancelCompleted.data?.message || ""}`
  );

  // =================================================================
  // TEST 5: IDOR & Role / Branch Scoping Security
  // =================================================================
  console.log("\n--- Test 5: IDOR & Branch Scoping Security ---");

  // Create third booking for Customer 1
  const booking3Res = await postJson(
    "/bookings",
    {
      branchId: boleBranch.id,
      serviceId: service1.id,
      employeeId: employeeA.id,
      startTime: futureDate.toISOString(),
    },
    cust1Headers
  );
  const booking3Id = booking3Res.data?.data?.booking?.id;

  // Customer 2 attempts to fetch Customer 1's booking
  const cust2ViewCust1 = await getJson(`/bookings/${booking3Id}`, cust2Headers);
  record(
    "5.1",
    "Customer 2 IDOR Read on Customer 1 Booking Blocked (403 Forbidden)",
    cust2ViewCust1.status === 403,
    `Expected 403, got ${cust2ViewCust1.status}`
  );

  // Customer 2 attempts to cancel Customer 1's booking
  const cust2CancelCust1 = await patchJson(
    `/bookings/${booking3Id}/status`,
    { targetStatus: "CANCELLED", reason: "Malicious cancellation" },
    cust2Headers
  );
  record(
    "5.2",
    "Customer 2 IDOR Cancellation on Customer 1 Booking Blocked (403 Forbidden)",
    cust2CancelCust1.status === 403,
    `Expected 403, got ${cust2CancelCust1.status}`
  );

  // Kazanchis Admin attempts to view Bole Booking
  const kazAdminViewBole = await getJson(`/bookings/${booking3Id}`, kazAdminHeaders);
  record(
    "5.3",
    "Cross-Branch Admin Read Access Blocked (403 Forbidden)",
    kazAdminViewBole.status === 403,
    `Expected 403, got ${kazAdminViewBole.status}`
  );

  // Kazanchis Admin attempts to transition Bole Booking
  const kazAdminMutateBole = await patchJson(
    `/bookings/${booking3Id}/status`,
    { targetStatus: "IN_PROGRESS" },
    kazAdminHeaders
  );
  record(
    "5.4",
    "Cross-Branch Admin Mutation Access Blocked (403 Forbidden)",
    kazAdminMutateBole.status === 403,
    `Expected 403, got ${kazAdminMutateBole.status}`
  );

  // Bole Admin can view and manage Bole Booking
  const boleAdminViewBole = await getJson(`/bookings/${booking3Id}`, boleAdminHeaders);
  record(
    "5.5",
    "Scoped Branch Admin Can Read Assigned Branch Bookings (200 OK)",
    boleAdminViewBole.status === 200,
    `Status ${boleAdminViewBole.status}`
  );

  // Owner has global bypass to view Bole Booking
  const ownerViewBole = await getJson(`/bookings/${booking3Id}`, ownerHeaders);
  record(
    "5.6",
    "Owner Global Clearance Access (200 OK)",
    ownerViewBole.status === 200,
    `Status ${ownerViewBole.status}`
  );

  // =================================================================
  // TEST 6: Staff Floor Execution & Specialist Isolation
  // =================================================================
  console.log("\n--- Test 6: Staff Floor Execution & Specialist Isolation ---");

  // Specialist B (unassigned) attempts to transition Specialist A's booking
  const specBMutateSpecA = await patchJson(
    `/bookings/${booking3Id}/status`,
    { targetStatus: "IN_PROGRESS" },
    specBHeaders
  );
  record(
    "6.1",
    "Unassigned Specialist Transition Blocked (403 Forbidden)",
    specBMutateSpecA.status === 403,
    `Expected 403, got ${specBMutateSpecA.status}`
  );

  // Specialist A (assigned) transitions CONFIRMED -> IN_PROGRESS
  const specAStart = await patchJson(
    `/bookings/${booking3Id}/status`,
    { targetStatus: "IN_PROGRESS" },
    specAHeaders
  );
  record(
    "6.2",
    "Assigned Specialist Transitions to IN_PROGRESS (200 OK)",
    specAStart.status === 200 && specAStart.data?.data?.booking?.status === "IN_PROGRESS",
    `Status ${specAStart.status}, DB Status: ${specAStart.data?.data?.booking?.status}`
  );

  // Specialist A completes appointment
  const specAComplete = await patchJson(
    `/bookings/${booking3Id}/status`,
    { targetStatus: "COMPLETED" },
    specAHeaders
  );
  record(
    "6.3",
    "Assigned Specialist Transitions to COMPLETED (200 OK)",
    specAComplete.status === 200 && specAComplete.data?.data?.booking?.status === "COMPLETED",
    `Status ${specAComplete.status}, DB Status: ${specAComplete.data?.data?.booking?.status}`
  );

  // =================================================================
  // TEST 7: No-Show & Terminal FSM Verification
  // =================================================================
  console.log("\n--- Test 7: No-Show Handling & Terminal Exits ---");

  // Create fourth booking
  const booking4Res = await postJson(
    "/bookings",
    {
      branchId: boleBranch.id,
      serviceId: service1.id,
      employeeId: employeeA.id,
      startTime: futureDate.toISOString(),
    },
    cust1Headers
  );
  const booking4Id = booking4Res.data?.data?.booking?.id;

  // Mark as NO_SHOW by Bole Admin
  const noShowRes = await patchJson(
    `/bookings/${booking4Id}/status`,
    { targetStatus: "NO_SHOW" },
    boleAdminHeaders
  );
  record(
    "7.1",
    "Transition CONFIRMED -> NO_SHOW (200 OK)",
    noShowRes.status === 200 && noShowRes.data?.data?.booking?.status === "NO_SHOW",
    `Status ${noShowRes.status}, DB Status: ${noShowRes.data?.data?.booking?.status}`
  );

  // Attempt transition from NO_SHOW to IN_PROGRESS (Blocked by FSM terminal rule)
  const noShowToInProgress = await patchJson(
    `/bookings/${booking4Id}/status`,
    { targetStatus: "IN_PROGRESS" },
    boleAdminHeaders
  );
  record(
    "7.2",
    "Terminal State Exit NO_SHOW -> IN_PROGRESS Blocked (400 Bad Request)",
    noShowToInProgress.status === 400,
    `Expected 400, got ${noShowToInProgress.status}: ${noShowToInProgress.data?.message || ""}`
  );

  // =================================================================
  // TEST 8: Customer Booking Query Filtering (UPCOMING, PAST, CANCELLED)
  // =================================================================
  console.log("\n--- Test 8: Customer Portal Query Filtering ---");

  const upcomingList = await getJson("/bookings/my-bookings?statusFilter=UPCOMING", cust1Headers);
  const pastList = await getJson("/bookings/my-bookings?statusFilter=PAST", cust1Headers);
  const cancelledList = await getJson("/bookings/my-bookings?statusFilter=CANCELLED", cust1Headers);

  const hasPastCompleted = Array.isArray(pastList.data?.data?.bookings || pastList.data) &&
    (pastList.data?.data?.bookings || pastList.data).some((b: any) => b.id === testBookingId);

  const hasCancelledBooking = Array.isArray(cancelledList.data?.data?.bookings || cancelledList.data) &&
    (cancelledList.data?.data?.bookings || cancelledList.data).some((b: any) => b.id === freshBookingId);

  record(
    "8.1",
    "Customer /my-bookings?statusFilter=PAST Includes COMPLETED",
    hasPastCompleted,
    `Found completed booking ${testBookingId} in past appointments`
  );

  record(
    "8.2",
    "Customer /my-bookings?statusFilter=CANCELLED Includes CANCELLED/NO_SHOW",
    hasCancelledBooking,
    `Found cancelled booking ${freshBookingId} in cancelled appointments`
  );

  // =================================================================
  // SUMMARY
  // =================================================================
  console.log("\n=================================================================");
  console.log(" EPIC 6: BOOKING LIFECYCLE AUDIT SUMMARY                         ");
  console.log("=================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Scenarios: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);

  if (failed > 0) {
    console.error("\nFAILURES DETECTED:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.error(` - [${r.step}] ${r.scenario}: ${r.details}`));
    process.exit(1);
  } else {
    console.log("\n✓ ALL SPRINT 6 EPIC 6 LIFECYCLE SCENARIOS PASSED PERFECTLY!");
    process.exit(0);
  }
}

run()
  .catch((e) => {
    console.error("FATAL AUDIT ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
