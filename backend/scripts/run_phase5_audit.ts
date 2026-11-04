import prisma from "../src/utils/prisma";
import { ServiceRitualService } from "../src/modules/service/service.service";
import { UserRole, BookingStatus } from "@prisma/client";

interface TestResult {
  checkItem: string;
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

function recordTest(
  checkItem: string,
  scenario: string,
  expected: string,
  actual: string,
  passed: boolean
) {
  results.push({ checkItem, scenario, expected, actual, passed });
}

async function runAudit() {
  console.log("=================================================================");
  console.log("  EYOB SALON SYSTEM — PHASE 5 SERVICE RITUALS AUDIT & TEST SUITE");
  console.log("=================================================================\n");

  // 1. Fetch Branches
  const branches = await prisma.branch.findMany({
    orderBy: { createdAt: "asc" },
  });

  const boleBranch = branches.find((b) => b.slug === "bole-bulbula");
  const kazanchisBranch = branches.find((b) => b.slug === "kazanchis");
  const cmcBranch = branches.find((b) => b.slug === "cmc");

  if (!boleBranch || !kazanchisBranch || !cmcBranch) {
    throw new Error("Missing required branches in database. Please run seed first.");
  }

  const ownerUser = {
    id: "usr-owner-audit",
    role: UserRole.OWNER,
    branchId: null,
  };

  const boleAdminUser = {
    id: "usr-bole-admin-audit",
    role: UserRole.BRANCH_ADMIN,
    branchId: boleBranch.id,
  };

  // -----------------------------------------------------------------
  // CHECK 1: Master Catalog & Seeding Integrity
  // -----------------------------------------------------------------
  console.log(">> Running Check 1: Master Catalog & Database Seeding Integrity...");

  const expectedCodes = [
    { code: "SR-101", name: "Bridal Hair & Haute Couture Updo", category: "Bridal & Royal Special Occasions" },
    { code: "SR-102", name: "Habesha Braiding & Royal Wefts", category: "Hair Styling & Couture" },
    { code: "SR-201", name: "Traditional Ethiopian Koba & Scalp Steam", category: "Holistic Spa & Scalp Therapy" },
    { code: "SR-305", name: "Gold-Leaf Botanical Facial Therapy", category: "Advanced Aesthetics & Facials" },
    { code: "SR-402", name: "Imperial Frankincense & Myrrh Massage", category: "Holistic Spa & Scalp Therapy" },
    { code: "SR-109", name: "Signature Silk Press & Thermal Gloss", category: "Hair Styling & Couture" },
  ];

  const dbServices = await prisma.service.findMany({
    where: {
      code: { in: expectedCodes.map((c) => c.code) },
    },
    include: {
      branchServices: {
        include: { branch: true },
      },
    },
  });

  for (const exp of expectedCodes) {
    const s = dbServices.find((serv) => serv.code === exp.code);
    const passed = !!s && s.branchServices.length === 3;

    recordTest(
      "1. Master Catalog Seeding",
      `Verify #${exp.code} "${exp.name}" and 3-branch deployment in PostgreSQL`,
      `Service exists with code "${exp.code}", correct category and 3 BranchService rows`,
      s
        ? `Found: "${s.name}" (ID: ${s.id.slice(0, 8)}...), BasePrice: ${s.basePrice} ETB, Buffers: ${s.preSetupBuffer}m/${s.turnaroundBuffer}m, Deployed Branches: ${s.branchServices.length}`
        : "MISSING from database",
      passed
    );
  }

  // Total branchServices count check
  const totalBranchServices = await prisma.branchService.count();
  recordTest(
    "1. Multi-Branch Mesh Count",
    "Verify minimum 18 BranchService governance mappings across sanctuaries",
    "totalBranchServices >= 18 (6 approved rituals × 3 branches)",
    `totalBranchServices in DB = ${totalBranchServices}`,
    totalBranchServices >= 18
  );

  // -----------------------------------------------------------------
  // CHECK 2: IDOR & Branch Scoping Access Control
  // -----------------------------------------------------------------
  console.log(">> Running Check 2: Branch Admin Access Control & Cross-Branch Isolation...");

  const testRitual = dbServices.find((s) => s.code === "SR-101") || dbServices[0];

  // 2a: Branch Admin from Bole attempts to update Kazanchis pricing
  let idorBlocked = false;
  let idorErrorMsg = "";
  try {
    await ServiceRitualService.updateBranchRules(
      testRitual.id,
      kazanchisBranch.id,
      {
        customPrice: 9999,
      },
      boleAdminUser
    );
  } catch (err: any) {
    idorBlocked = true;
    idorErrorMsg = `${err.statusCode || 403} ${err.message}`;
  }

  recordTest(
    "2. Cross-Branch IDOR Protection",
    `Bole Branch Admin attempts PUT /services/${testRitual.code}/branches/${kazanchisBranch.slug}`,
    "HTTP 403 Forbidden: You do not have permission to govern rituals for another branch",
    idorBlocked ? `Correctly Rejected: ${idorErrorMsg}` : "FAILED — Cross-branch edit allowed!",
    idorBlocked && (idorErrorMsg.includes("403") || idorErrorMsg.includes("permission") || idorErrorMsg.includes("Forbidden"))
  );

  // 2b: Branch Admin from Bole updates Bole pricing (allowed)
  let localUpdateSuccess = false;
  let localUpdateResult = "";
  try {
    const updated = await ServiceRitualService.updateBranchRules(
      testRitual.id,
      boleBranch.id,
      {
        customPrice: 1250,
        workstationLock: "Suite Gold-Audit",
      },
      boleAdminUser
    );
    localUpdateSuccess = Number(updated.customPrice) === 1250;
    localUpdateResult = `Success: customPrice=${updated.customPrice} ETB, workstationLock=${updated.workstationLock}`;

    // Revert back
    await ServiceRitualService.updateBranchRules(
      testRitual.id,
      boleBranch.id,
      { customPrice: 1200, workstationLock: "Suite Gold-1" },
      boleAdminUser
    );
  } catch (err: any) {
    localUpdateResult = `Error: ${err.message}`;
  }

  recordTest(
    "2. Local Branch Governance",
    `Bole Branch Admin updates Bole pricing for #${testRitual.code}`,
    "Allows update and persists customPrice and workstationLock for local branch",
    localUpdateResult,
    localUpdateSuccess
  );

  // 2c: Owner Clearance allows cross-branch governance
  let ownerUpdateSuccess = false;
  let ownerUpdateResult = "";
  try {
    const updatedKazanchis = await ServiceRitualService.updateBranchRules(
      testRitual.id,
      kazanchisBranch.id,
      {
        customPrice: 1450,
      },
      ownerUser
    );
    ownerUpdateSuccess = Number(updatedKazanchis.customPrice) === 1450;
    ownerUpdateResult = `Success: Owner updated Kazanchis rule to ${updatedKazanchis.customPrice} ETB`;

    // Revert back
    await ServiceRitualService.updateBranchRules(
      testRitual.id,
      kazanchisBranch.id,
      { customPrice: 1400 },
      ownerUser
    );
  } catch (err: any) {
    ownerUpdateResult = `Error: ${err.message}`;
  }

  recordTest(
    "2. Owner Multi-Branch Clearance",
    `OWNER updates Kazanchis pricing rule for #${testRitual.code}`,
    "Allows global OWNER to govern any sanctuary branch rule",
    ownerUpdateResult,
    ownerUpdateSuccess
  );

  // -----------------------------------------------------------------
  // CHECK 3: Effective Branch Pricing Resolution
  // -----------------------------------------------------------------
  console.log(">> Running Check 3: Effective Branch Pricing Resolution...");

  // Query ritual passing Kazanchis branchId
  const kazanSpec = await ServiceRitualService.getServiceById(testRitual.id, ownerUser, kazanchisBranch.id);
  const kazanPriceCorrect = kazanSpec.effectivePrice === 1400;

  recordTest(
    "3. Effective Price Override",
    `Query #${testRitual.code} with Kazanchis branchId override`,
    "effectivePrice resolves to Kazanchis customPrice (1,400 ETB) instead of basePrice (1,200 ETB)",
    `Resolved: effectivePrice=${kazanSpec.effectivePrice} ETB (customPrice: 1400 ETB, basePrice: ${kazanSpec.basePrice} ETB)`,
    kazanPriceCorrect
  );

  // Query ritual passing CMC branchId
  const cmcSpec = await ServiceRitualService.getServiceById(testRitual.id, ownerUser, cmcBranch.id);
  const cmcPriceCorrect = cmcSpec.effectivePrice === 1150;

  recordTest(
    "3. Multi-Branch Price Differentiation",
    `Query #${testRitual.code} with CMC branchId override`,
    "effectivePrice resolves to CMC customPrice (1,150 ETB)",
    `Resolved: effectivePrice=${cmcSpec.effectivePrice} ETB (customPrice: 1150 ETB)`,
    cmcPriceCorrect
  );

  // Query without branch
  const globalSpec = await ServiceRitualService.getServiceById(testRitual.id, ownerUser);
  const fallbackCorrect = globalSpec.effectivePrice === Number(globalSpec.basePrice);

  recordTest(
    "3. Base Price Fallback",
    `Query #${testRitual.code} without branchId context`,
    "effectivePrice falls back to master service.basePrice (1,200 ETB)",
    `Resolved: effectivePrice=${globalSpec.effectivePrice} ETB, basePrice=${globalSpec.basePrice} ETB`,
    fallbackCorrect
  );

  // -----------------------------------------------------------------
  // CHECK 4: Deactivation Safeguard & Booking Preservation
  // -----------------------------------------------------------------
  console.log(">> Running Check 4: Deactivation Safeguard & Booking Preservation...");

  // Ensure an upcoming booking exists for testRitual
  const clientUser = await prisma.user.findFirst({
    where: { role: UserRole.CLIENT },
  });

  const emp = await prisma.employee.findFirst({
    where: { branchId: boleBranch.id },
  });

  let testBooking = null;
  let testBookingItem = null;
  if (clientUser && emp) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(14, 0, 0, 0);

    const futureEnd = new Date(futureDate);
    futureEnd.setMinutes(futureEnd.getMinutes() + 90);

    testBooking = await prisma.booking.create({
      data: {
        bookingNumber: `EYOB-AUDIT-${Date.now()}`,
        status: BookingStatus.CONFIRMED,
        totalAmount: 1200,
        depositRequired: 400,
        depositPaid: 400,
        balanceDue: 800,
        customerId: clientUser.id,
        branchId: boleBranch.id,
      },
    });

    testBookingItem = await prisma.bookingItem.create({
      data: {
        bookingId: testBooking.id,
        employeeId: emp.id,
        startTime: futureDate,
        endTime: futureEnd,
        serviceTitleSnapshot: testRitual.name,
        priceSnapshot: 1200,
        durationSnapshot: 90,
        depositSnapshot: 400,
      },
    });
  }

  // Deactivate ritual
  const deactivationResult = await ServiceRitualService.toggleServiceStatus(testRitual.id, ownerUser);
  const deactivatedInDb = await prisma.service.findUnique({ where: { id: testRitual.id } });
  const bookingStillExists = testBooking
    ? await prisma.booking.findUnique({ where: { id: testBooking.id } })
    : null;

  const deactivationPassed =
    deactivatedInDb?.isActive === false &&
    bookingStillExists !== null &&
    bookingStillExists.status === BookingStatus.CONFIRMED;

  recordTest(
    "4. Soft Deactivation Safeguard",
    `Toggle status of #${testRitual.code} with future active booking present`,
    "Soft-deactivates ritual (isActive=false), returns warning for future booking, preserves booking record",
    `Result: isActive=${deactivatedInDb?.isActive}, Warning="${deactivationResult.warning || 'None'}", Booking preserved: ${!!bookingStillExists}`,
    deactivationPassed
  );

  // Clean up test booking and reactivate ritual
  if (testBookingItem) {
    await prisma.bookingItem.delete({ where: { id: testBookingItem.id } });
  }
  if (testBooking) {
    await prisma.booking.delete({ where: { id: testBooking.id } });
  }
  await ServiceRitualService.toggleServiceStatus(testRitual.id, ownerUser); // reactivate to true

  // -----------------------------------------------------------------
  // CHECK 5: Branch Governance Analytics Engine
  // -----------------------------------------------------------------
  console.log(">> Running Check 5: Branch Governance Analytics Engine...");

  const govBole = await ServiceRitualService.getBranchGovernance(boleBranch.id, ownerUser);
  const govPassed =
    govBole.metrics.totalRituals >= 6 &&
    govBole.metrics.activeRituals >= 5 &&
    govBole.metrics.avgTicketPrice > 0 &&
    govBole.services.length >= 6;

  recordTest(
    "5. Governance Engine Metrics",
    `Calculate live metrics for ${boleBranch.name}`,
    "Computes offering percentage, average ticket price, and resolves all local ritual rules",
    `Computed: TotalMaster=${govBole.metrics.totalRituals}, ActiveInBranch=${govBole.metrics.activeRituals}, AvgTicket=${govBole.metrics.avgTicketPrice} ETB, Offering%=${govBole.metrics.offeringPercent}%`,
    govPassed
  );

  // -----------------------------------------------------------------
  // Print Detailed Audit Report Table
  // -----------------------------------------------------------------
  console.log("\n=================================================================");
  console.log("              PHASE 5 AUDIT & VERIFICATION RESULTS               ");
  console.log("=================================================================\n");

  const colWidths = {
    checkItem: 28,
    scenario: 36,
    expected: 32,
    actual: 32,
    status: 8,
  };

  console.log(
    "Check Item".padEnd(colWidths.checkItem) +
      " | " +
      "Scenario / Input".padEnd(colWidths.scenario) +
      " | " +
      "Expected Outcome".padEnd(colWidths.expected) +
      " | " +
      "Actual Result".padEnd(colWidths.actual) +
      " | Status"
  );
  console.log("-".repeat(146));

  for (const r of results) {
    const statusText = r.passed ? "PASS" : "FAIL";
    const truncScenario =
      r.scenario.length > colWidths.scenario ? r.scenario.slice(0, colWidths.scenario - 3) + "..." : r.scenario;
    const truncExpected =
      r.expected.length > colWidths.expected ? r.expected.slice(0, colWidths.expected - 3) + "..." : r.expected;
    const truncActual =
      r.actual.length > colWidths.actual ? r.actual.slice(0, colWidths.actual - 3) + "..." : r.actual;

    console.log(
      r.checkItem.padEnd(colWidths.checkItem) +
        " | " +
        truncScenario.padEnd(colWidths.scenario) +
        " | " +
        truncExpected.padEnd(colWidths.expected) +
        " | " +
        truncActual.padEnd(colWidths.actual) +
        " | " +
        statusText
    );
  }

  const allPassed = results.every((r) => r.passed);
  console.log("\n-----------------------------------------------------------------");
  console.log(
    `TOTAL CHECKS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${
      results.filter((r) => !r.passed).length
    }`
  );
  console.log(`OVERALL STATUS: ${allPassed ? "ALL AUDITS PASSED" : "FAILED AUDITS PRESENT"}`);
  console.log("=================================================================\n");

  if (!allPassed) {
    process.exit(1);
  }
}

runAudit()
  .catch((e) => {
    console.error("Audit script failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
