import prisma from "../src/utils/prisma";
import { BranchService } from "../src/modules/branch/branch.service";
import bcrypt from "bcryptjs";

interface TestResult {
  category: string;
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const BASE_URL = "http://localhost:3000/api/v1";

async function runAudit() {
  const results: TestResult[] = [];

  console.log("=================================================================");
  console.log("   EYOB SALON SYSTEM — SPRINT 1 US3 BRANCH MANAGEMENT AUDIT     ");
  console.log("=================================================================\n");

  // 1. Authenticate Owner
  console.log(">> Authenticating Owner (owner@eyobsalon.com)...");
  const ownerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "owner@eyobsalon.com", password: "Owner@123", role: "OWNER" }),
  });
  const ownerLoginData = await ownerLoginRes.json();
  const ownerToken = ownerLoginData.data?.tokens?.accessToken || ownerLoginData.data?.accessToken;
  if (!ownerToken) {
    throw new Error(`Owner login failed: ${JSON.stringify(ownerLoginData)}`);
  }

  // 2. Authenticate Bole Admin
  console.log(">> Authenticating Bole Admin (admin.bole@eyobsalon.com)...");
  const boleLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "admin.bole@eyobsalon.com", password: "Admin@123", role: "BRANCH_ADMIN" }),
  });
  const boleLoginData = await boleLoginRes.json();
  const boleAdminToken = boleLoginData.data?.tokens?.accessToken || boleLoginData.data?.accessToken;
  if (!boleAdminToken) {
    throw new Error(`Bole Admin login failed: ${JSON.stringify(boleLoginData)}`);
  }

  // Find Kazanchis and Bole branches
  const boleBranch = await prisma.branch.findUnique({ where: { slug: "bole-bulbula" } });
  const kazanchisBranch = await prisma.branch.findUnique({ where: { slug: "kazanchis" } });
  if (!boleBranch || !kazanchisBranch) {
    throw new Error("Core seeded branches missing from database");
  }

  // -------------------------------------------------------------
  // AREA 1: Branch Creation, Contact Configuration & Deactivation
  // -------------------------------------------------------------
  console.log(">> Area 1: Branch Creation, Updates & Deactivation Safeguards...");

  // Clean previous test branch if any
  await prisma.branchHours.deleteMany({ where: { branch: { slug: "sarbet-audit" } } });
  await prisma.branch.deleteMany({ where: { slug: "sarbet-audit" } });

  // 1.1 Branch Creation
  const createRes = await fetch(`${BASE_URL}/branches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      name: "Eyob Beauty Salon - Sarbet Luxury Sanctuary",
      slug: "sarbet-audit",
      phone: "+251911998877",
      address: "Sarbet, Near Pushkin Square",
      city: "Addis Ababa",
      timezone: "Africa/Addis_Ababa",
      description: "Exclusive VIP Sanctuary",
      slotBufferMinutes: 15,
    }),
  });
  const createData = await createRes.json();
  const createdBranch = createData.data;

  results.push({
    category: "1. Branch Creation",
    scenario: "Owner provisions new branch with timezone & contact info",
    expected: "HTTP 201 Created with slug='sarbet-audit' and timezone='Africa/Addis_Ababa'",
    actual: `HTTP ${createRes.status} - ID: ${createdBranch?.id?.slice(0, 8)}..., Timezone: ${createdBranch?.timezone}`,
    passed: createRes.status === 201 && createdBranch?.timezone === "Africa/Addis_Ababa",
  });

  const branchId = createdBranch?.id;

  // 1.2 Update Contact Details
  const updateRes = await fetch(`${BASE_URL}/branches/${branchId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({
      phone: "+251911998800",
      address: "Sarbet, South Africa Street, Suite 4",
    }),
  });
  const updateData = await updateRes.json();
  const updatedInDb = await prisma.branch.findUnique({ where: { id: branchId } });

  results.push({
    category: "1. Branch Configuration",
    scenario: "Owner updates branch contact phone and address",
    expected: "HTTP 200 OK with phone='+251911998800' and updated address line",
    actual: `HTTP ${updateRes.status} - Phone: ${updatedInDb?.phoneNumber}, Address: ${updatedInDb?.addressLine}`,
    passed:
      updateRes.status === 200 &&
      updatedInDb?.phoneNumber === "+251911998800" &&
      updatedInDb?.addressLine.includes("South Africa Street"),
  });

  // 1.3 Deactivation (Soft Disable)
  const deactivateRes = await fetch(`${BASE_URL}/branches/${branchId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({ isActive: false }),
  });
  const deactivateData = await deactivateRes.json();
  const deactivatedInDb = await prisma.branch.findUnique({ where: { id: branchId } });

  results.push({
    category: "1. Branch Deactivation",
    scenario: "Owner soft-deactivates branch via status endpoint",
    expected: "HTTP 200 OK with isActive: false; database records 100% retained",
    actual: `HTTP ${deactivateRes.status} - DB isActive: ${deactivatedInDb?.isActive}`,
    passed: deactivateRes.status === 200 && deactivatedInDb?.isActive === false,
  });

  // 1.4 Booking Rejection on Deactivated Branch
  const bookingAttemptRes = await fetch(`${BASE_URL}/bookings/availability?branchId=${branchId}&serviceId=non-existent&date=2026-11-20`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const bookingAttemptData = await bookingAttemptRes.json();

  results.push({
    category: "1. Deactivation Safeguard",
    scenario: "Client requests available slots on deactivated branch",
    expected: "HTTP 404 / 400 error stating branch is inactive or not found",
    actual: `HTTP ${bookingAttemptRes.status} - Message: "${bookingAttemptData.message}"`,
    passed: bookingAttemptRes.status === 404 && bookingAttemptData.message.includes("inactive"),
  });

  // 1.5 Reactivation
  const reactivateRes = await fetch(`${BASE_URL}/branches/${branchId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({ isActive: true }),
  });
  const reactivatedInDb = await prisma.branch.findUnique({ where: { id: branchId } });

  results.push({
    category: "1. Branch Reactivation",
    scenario: "Owner reactivates branch",
    expected: "HTTP 200 OK with isActive: true",
    actual: `HTTP ${reactivateRes.status} - DB isActive: ${reactivatedInDb?.isActive}`,
    passed: reactivateRes.status === 200 && reactivatedInDb?.isActive === true,
  });

  // -------------------------------------------------------------
  // AREA 2: Branch Administrator Assignment
  // -------------------------------------------------------------
  console.log(">> Area 2: Branch Administrator Assignment...");

  // Seed / find test candidate user
  const candidateEmail = "candidate.admin@eyobsalon.com";
  let candidateUser = await prisma.user.findUnique({ where: { email: candidateEmail } });
  if (!candidateUser) {
    const passwordHash = await bcrypt.hash("Candidate@123", 10);
    candidateUser = await prisma.user.create({
      data: {
        firstName: "Selamawit",
        lastName: "Bekele",
        email: candidateEmail,
        phone: "+251911889900",
        password: passwordHash,
        role: "EMPLOYEE",
      },
    });
  }

  const assignAdminRes = await fetch(`${BASE_URL}/branches/${branchId}/assign-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify({ userId: candidateUser.id }),
  });
  const assignAdminData = await assignAdminRes.json();
  const assignedInDb = await prisma.user.findUnique({ where: { id: candidateUser.id } });

  results.push({
    category: "2. Admin Assignment",
    scenario: "Owner assigns user as Branch Administrator for Sarbet branch",
    expected: "HTTP 200 OK with role='BRANCH_ADMIN' and user.branchId matching branch",
    actual: `HTTP ${assignAdminRes.status} - User Role: ${assignedInDb?.role}, BranchId: ${assignedInDb?.branchId}`,
    passed:
      assignAdminRes.status === 200 &&
      assignedInDb?.role === "BRANCH_ADMIN" &&
      assignedInDb?.branchId === branchId,
  });

  // -------------------------------------------------------------
  // AREA 3: Overnight Operating Hours Configuration & Window Logic
  // -------------------------------------------------------------
  console.log(">> Area 3: Overnight Operating Hours Configuration & Logic...");

  // 3.1 Invalid Overnight (closeTime <= openTime without closesNextDay: true)
  const invalidOvernightRes = await fetch(`${BASE_URL}/branches/${branchId}/hours`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify([
      {
        dayOfWeek: 5, // Friday
        openTime: "09:00",
        closeTime: "03:00",
        closesNextDay: false, // Invalid: ends next day without flag
        isClosed: false,
      },
    ]),
  });
  const invalidOvernightData = await invalidOvernightRes.json();

  results.push({
    category: "3. Overnight Validation",
    scenario: "Submit cross-midnight hours (09:00 -> 03:00) with closesNextDay=false",
    expected: "HTTP 400 Validation Error enforcing closesNextDay: true",
    actual: `HTTP ${invalidOvernightRes.status} - Message: "${invalidOvernightData.message}"`,
    passed:
      invalidOvernightRes.status === 400 &&
      invalidOvernightData.message.includes("closesNextDay"),
  });

  // 3.2 Valid Overnight (closeTime: "03:00", closesNextDay: true)
  const validOvernightRes = await fetch(`${BASE_URL}/branches/${branchId}/hours`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ownerToken}`,
    },
    body: JSON.stringify([
      {
        dayOfWeek: 5, // Friday
        openTime: "09:00",
        closeTime: "03:00",
        closesNextDay: true,
        isClosed: false,
      },
    ]),
  });
  const validOvernightData = await validOvernightRes.json();
  const fridayHoursInDb = await prisma.branchHours.findUnique({
    where: { branchId_dayOfWeek: { branchId, dayOfWeek: 5 } },
  });

  results.push({
    category: "3. Overnight Operating Hours",
    scenario: "Configure Friday overnight operating hours: 09:00 -> 03:00 (Next Day)",
    expected: "HTTP 200 OK with closesNextDay: true saved in PostgreSQL",
    actual: `HTTP ${validOvernightRes.status} - Open: ${fridayHoursInDb?.openTime}, Close: ${fridayHoursInDb?.closeTime}, ClosesNextDay: ${fridayHoursInDb?.closesNextDay}`,
    passed:
      validOvernightRes.status === 200 &&
      fridayHoursInDb?.openTime === "09:00" &&
      fridayHoursInDb?.closeTime === "03:00" &&
      fridayHoursInDb?.closesNextDay === true,
  });

  // 3.3 Verification of Business Window Calculation for Saturday 01:30 AM
  // Target date: Saturday morning (e.g. 2026-11-14)
  const saturdayEarlyMorning = new Date(2026, 10, 14, 1, 30, 0); // Saturday
  const session = await BranchService.getOperatingSessionForSlot(
    branchId,
    saturdayEarlyMorning,
    "01:30"
  );

  results.push({
    category: "3. Business Window Logic",
    scenario: "Calculate business window for Saturday early morning slot at 01:30 AM",
    expected: "Slot belongs to Friday's business window with isOvernightWindow: true",
    actual: `Open: ${session.isOpen}, Day: ${session.businessDayName} (${session.businessDayOfWeek}), Overnight: ${session.isOvernightWindow}`,
    passed:
      session.isOpen === true &&
      session.businessDayOfWeek === 5 &&
      session.businessDayName === "FRIDAY" &&
      session.isOvernightWindow === true,
  });

  // -------------------------------------------------------------
  // AREA 4: Security Boundary Enforcement (Cross-Branch Isolation)
  // -------------------------------------------------------------
  console.log(">> Area 4: Security Boundary Enforcement (Cross-Branch Isolation)...");

  // Bole Admin attempts to alter Kazanchis branch operating hours
  const crossBranchHoursRes = await fetch(`${BASE_URL}/branches/${kazanchisBranch.id}/hours`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${boleAdminToken}`,
    },
    body: JSON.stringify([
      {
        dayOfWeek: 1,
        openTime: "08:00",
        closeTime: "22:00",
        closesNextDay: false,
        isClosed: false,
      },
    ]),
  });
  const crossBranchHoursData = await crossBranchHoursRes.json();

  results.push({
    category: "4. Security Isolation",
    scenario: "Bole Admin attempts to update Kazanchis branch operating hours",
    expected: "HTTP 403 Forbidden: 'Forbidden: branch access denied'",
    actual: `HTTP ${crossBranchHoursRes.status} - Message: "${crossBranchHoursData.message}"`,
    passed:
      crossBranchHoursRes.status === 403 &&
      crossBranchHoursData.message.includes("branch access denied"),
  });

  // Clean up test Sarbet branch
  await prisma.branchHours.deleteMany({ where: { branchId } });
  await prisma.user.deleteMany({ where: { email: candidateEmail } });
  await prisma.branch.deleteMany({ where: { id: branchId } });

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n=================================================================");
  console.log("                      TEST RESULTS SUMMARY                       ");
  console.log("=================================================================\n");

  let totalPassed = 0;
  for (const r of results) {
    const symbol = r.passed ? "[✓ PASS]" : "[✗ FAIL]";
    if (r.passed) totalPassed++;
    console.log(`${symbol} [${r.category}]`);
    console.log(`  Scenario: ${r.scenario}`);
    console.log(`  Expected: ${r.expected}`);
    console.log(`  Actual:   ${r.actual}\n`);
  }

  console.log("=================================================================");
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${results.length - totalPassed}`);
  console.log("=================================================================\n");

  if (totalPassed !== results.length) {
    process.exit(1);
  }
}

runAudit()
  .catch((err) => {
    console.error("FATAL AUDIT FAILURE:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
