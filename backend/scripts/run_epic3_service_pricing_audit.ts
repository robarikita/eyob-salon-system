import { PrismaClient } from "@prisma/client";

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

async function putJson(endpoint: string, data: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
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

async function runAudit() {
  console.log("==========================================================================");
  console.log(" EYOB SALON — SPRINT 3 EPIC 3: DYNAMIC SERVICE CATALOG & PRICING AUDIT    ");
  console.log("==========================================================================\n");

  const ts = Date.now();
  let createdServiceId: string | null = null;
  let testBookingId: string | null = null;

  try {
    // -----------------------------------------------------------------
    // SETUP: Authenticate as Owner
    // -----------------------------------------------------------------
    console.log("--- SETUP: Owner Authentication ---");
    const ownerLogin = await postJson("/auth/login", {
      identifier: "owner@eyobsalon.com",
      password: "Owner@123",
      role: "OWNER",
    });

    const ownerToken =
      ownerLogin.data.data?.tokens?.accessToken || ownerLogin.data.data?.accessToken;

    if (ownerLogin.status !== 200 || !ownerToken) {
      throw new Error(`Owner login failed: ${JSON.stringify(ownerLogin.data)}`);
    }
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    record("SETUP", "Owner Authentication", true, "Owner authenticated with JWT.");

    // Retrieve active branches
    const branchesRes = await getJson("/branches", ownerHeaders);
    const activeBranches = (branchesRes.data.data || []).filter((b: any) => b.isActive);
    if (activeBranches.length < 2) {
      throw new Error("Need at least 2 active branches to test multi-branch pricing & deposit hierarchy.");
    }
    const branchA = activeBranches[0];
    const branchB = activeBranches[1];
    record("SETUP", "Branch Discovery", true, `Branch A: ${branchA.name} (${branchA.id}), Branch B: ${branchB.name} (${branchB.id})`);

    // -----------------------------------------------------------------
    // TEST 1: Dynamic Service CRUD with Custom Duration (75 min) & Slug
    // -----------------------------------------------------------------
    console.log("\n--- TEST 1: Service Creation with Custom Duration & Slug ---");
    const servicePayload = {
      name: `Imperial Royal Updo ${ts}`,
      nameAm: "ልዩ የሙሽራ ፀጉር ስራ",
      category: "Bridal & Royal Special Occasions",
      durationMinutes: 75,
      basePrice: 1500,
      depositType: "NONE",
      depositValue: 0,
      imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035",
    };

    const createRes = await postJson("/services", servicePayload, ownerHeaders);
    const createdService = createRes.data.data;
    createdServiceId = createdService?.id;

    record(
      "TEST 1.1",
      "Dynamic Service Creation",
      createRes.status === 201 && !!createdServiceId,
      `Service created with ID ${createdServiceId}, status ${createRes.status}`
    );

    record(
      "TEST 1.2",
      "Duration & Slug Validation",
      createdService?.durationMinutes === 75 && !!createdService?.slug,
      `Duration: ${createdService?.durationMinutes} min, Slug: ${createdService?.slug}`
    );

    // Read back via GET /services/:id
    const getRes = await getJson(`/services/${createdServiceId}`, ownerHeaders);
    const fetchedService = getRes.data.data;

    record(
      "TEST 1.3",
      "Retrieve Service by ID",
      getRes.status === 200 && Number(fetchedService?.basePrice) === 1500,
      `Retrieved service with basePrice: ${fetchedService?.basePrice}`
    );

    // Verify initial ServicePriceHistory record exists
    const initialHistory = await prisma.servicePriceHistory.findMany({
      where: { serviceId: createdServiceId },
    });
    record(
      "TEST 1.4",
      "Initial Baseline Price History Entry",
      initialHistory.length >= 1 && Number(initialHistory[0].price) === 1500 && initialHistory[0].branchId === null,
      `Baseline history record logged: ${initialHistory.length} entry, price ${initialHistory[0]?.price}`
    );

    // -----------------------------------------------------------------
    // TEST 2: Soft Toggle Activation / Deactivation
    // -----------------------------------------------------------------
    console.log("\n--- TEST 2: Soft Toggle Activation & Filtering ---");
    const toggleDeactivate = await patchJson(`/services/${createdServiceId}/toggle-status`, {}, ownerHeaders);
    const deactivatedData = toggleDeactivate.data.data?.service || toggleDeactivate.data.data;
    const isDeactivated = deactivatedData?.isActive === false || deactivatedData?.status === false;

    record(
      "TEST 2.1",
      "Soft Deactivation Toggle",
      toggleDeactivate.status === 200 && isDeactivated,
      `Service status toggled to inactive: ${isDeactivated}`
    );

    // Query active services: should not contain createdServiceId
    const activeListRes = await getJson("/services?isActive=true", ownerHeaders);
    const activeServices = activeListRes.data.data || [];
    const isInActiveList = activeServices.some((s: any) => s.id === createdServiceId);

    record(
      "TEST 2.2",
      "Inactive Filter Isolation",
      !isInActiveList,
      `Deactivated service is hidden from active catalog queries (found: ${isInActiveList})`
    );

    // Reactivate
    const toggleReactivate = await patchJson(`/services/${createdServiceId}/toggle-status`, {}, ownerHeaders);
    const reactivatedData = toggleReactivate.data.data?.service || toggleReactivate.data.data;
    const isReactivated = reactivatedData?.isActive === true || reactivatedData?.status === true;

    record(
      "TEST 2.3",
      "Reactivation Toggle",
      toggleReactivate.status === 200 && isReactivated,
      `Service restored to active status: ${isReactivated}`
    );

    // -----------------------------------------------------------------
    // TEST 3: Base Price Mutation with Immutable Price Audit Trail
    // -----------------------------------------------------------------
    console.log("\n--- TEST 3: Base Price Mutation & History Audit Trail ---");
    const updateRes = await patchJson(
      `/services/${createdServiceId}`,
      { basePrice: 1800 },
      ownerHeaders
    );

    record(
      "TEST 3.1",
      "Base Price Mutation",
      updateRes.status === 200 && Number(updateRes.data.data?.basePrice) === 1800,
      `Service basePrice updated to 1800 ETB`
    );

    // Query Price History endpoint
    const historyRes = await getJson(`/services/${createdServiceId}/price-history`, ownerHeaders);
    const historyItems = historyRes.data.data || [];
    const latestGlobal = historyItems.find((h: any) => Number(h.price) === 1800);

    record(
      "TEST 3.2",
      "Price History Endpoint Audit Log",
      historyRes.status === 200 && !!latestGlobal && latestGlobal.branchId === null,
      `Found history record for 1800 ETB, changedBy: ${latestGlobal?.changedBy}`
    );

    // -----------------------------------------------------------------
    // TEST 4: Branch-Specific Price Override & Audit Trail
    // -----------------------------------------------------------------
    console.log("\n--- TEST 4: Branch Price Override & Audit Trail ---");
    const branchOverrideRes = await postJson(
      `/services/${createdServiceId}/branch-price`,
      {
        branchId: branchA.id,
        customPrice: 2200,
        customDurationMinutes: 85,
        reason: "VIP Sanctuary Launch Tier",
      },
      ownerHeaders
    );

    record(
      "TEST 4.1",
      "Branch Price Override Creation",
      branchOverrideRes.status === 200 && Number(branchOverrideRes.data.data?.customPrice) === 2200,
      `Branch price set to 2200 ETB, customDuration 85 min for branch ${branchA.name}`
    );

    // Verify branch-specific history record
    const branchHistoryRes = await getJson(
      `/services/${createdServiceId}/price-history?branchId=${branchA.id}`,
      ownerHeaders
    );
    const branchHistoryItems = branchHistoryRes.data.data || [];
    const branchAudit = branchHistoryItems.find(
      (h: any) => Number(h.price) === 2200 && h.branchId === branchA.id
    );

    record(
      "TEST 4.2",
      "Branch Price Audit Record",
      !!branchAudit && branchAudit.reason === "VIP Sanctuary Launch Tier",
      `Audit record logged for branch ${branchA.id} with reason: "${branchAudit?.reason}"`
    );

    // -----------------------------------------------------------------
    // TEST 5: 3-Tier Deposit Calculation Hierarchy
    // -----------------------------------------------------------------
    console.log("\n--- TEST 5: 3-Tier Deposit Calculation Hierarchy ---");

    // Ensure Branch A has default 20% deposit rule
    await putJson(
      `/branches/${branchA.id}/deposit-rule`,
      { defaultDepositType: "PERCENTAGE", defaultDepositValue: 20 },
      ownerHeaders
    );

    // Tier 3: Branch Default (Branch A default: 20% of 2200 = 440 ETB)
    // (Service has depositType: NONE, Branch override has depositType: null)
    const branchACalc1 = await getJson(`/services/${createdServiceId}?branchId=${branchA.id}`, ownerHeaders);
    const effectiveDepositTier3 = Number(branchACalc1.data.data?.effectiveDeposit);

    record(
      "TEST 5.1",
      "Deposit Tier 3 (Branch Default 20%)",
      effectiveDepositTier3 === 440,
      `Calculated: ${effectiveDepositTier3} ETB (expected 440 ETB: 20% of 2200)`
    );

    // Tier 2: Service Global Override (Fixed 350 ETB)
    await patchJson(
      `/services/${createdServiceId}`,
      { depositType: "FIXED", depositValue: 350 },
      ownerHeaders
    );

    // For Branch B (which has no branchPrice override, basePrice = 1800)
    // Service Fixed 350 ETB should override Branch B's default 20% (which would be 360)
    const branchBCalc = await getJson(`/services/${createdServiceId}?branchId=${branchB.id}`, ownerHeaders);
    const effectiveDepositTier2 = Number(branchBCalc.data.data?.effectiveDeposit);

    record(
      "TEST 5.2",
      "Deposit Tier 2 (Service Global Fixed 350 ETB)",
      effectiveDepositTier2 === 350,
      `Calculated: ${effectiveDepositTier2} ETB for Branch B (expected 350 ETB Fixed)`
    );

    // Tier 1: Branch Service Override (Branch A: 50% Percentage Deposit)
    await postJson(
      `/services/${createdServiceId}/branch-price`,
      {
        branchId: branchA.id,
        customPrice: 2200,
        customDurationMinutes: 85,
        depositType: "PERCENTAGE",
        depositValue: 50,
        reason: "VIP 50% deposit lock",
      },
      ownerHeaders
    );

    const branchACalc2 = await getJson(`/services/${createdServiceId}?branchId=${branchA.id}`, ownerHeaders);
    const effectiveDepositTier1 = Number(branchACalc2.data.data?.effectiveDeposit);

    record(
      "TEST 5.3",
      "Deposit Tier 1 (Branch Override 50% Deposit)",
      effectiveDepositTier1 === 1100,
      `Calculated: ${effectiveDepositTier1} ETB for Branch A (expected 1100 ETB: 50% of 2200, overriding service fixed 350)`
    );

    // -----------------------------------------------------------------
    // TEST 6: Immutable Snapshot Test on Past Bookings
    // -----------------------------------------------------------------
    console.log("\n--- TEST 6: Immutable Booking Price & Deposit Snapshot ---");

    // Find or create customer user
    let customer = await prisma.user.findFirst({
      where: { role: "CUSTOMER" },
    });
    if (!customer) {
      customer = await prisma.user.create({
        data: {
          firstName: "Audit",
          lastName: "Customer",
          email: `audit.cust.${ts}@eyobsalon.com`,
          phone: `+251977${String(ts).slice(-6)}`,
          role: "CUSTOMER",
          password: "dummyPassword123",
        },
      });
    }

    // Find employee assigned to Branch A
    const employee = await prisma.employee.findFirst({
      where: { branchId: branchA.id, status: true },
    });

    if (!employee) {
      throw new Error(`No active employee found for Branch A (${branchA.name})`);
    }

    // Select working day (Tuesday, 2 days ahead)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    const dateStr = targetDate.toISOString().split("T")[0];

    const availRes = await getJson(
      `/bookings/availability?branchId=${branchA.id}&serviceId=${createdServiceId}&employeeId=${employee.id}&date=${dateStr}`,
      ownerHeaders
    );
    const slots = availRes.data.data?.availableSlots || [];
    const chosenSlot = slots[0] || "09:00";
    const [hh, mm] = chosenSlot.split(":").map(Number);
    // Addis Ababa is UTC+3
    const slotIso = new Date(
      Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), hh - 3, mm, 0)
    ).toISOString();

    // Create booking for Branch A with our service
    const bookingRes = await postJson(
      "/bookings",
      {
        branchId: branchA.id,
        serviceId: createdServiceId,
        employeeId: employee.id,
        startTime: slotIso,
        notes: "Epic 3 Snapshot Test Booking",
      },
      ownerHeaders
    );

    const booking = bookingRes.data.data?.booking || bookingRes.data.data;
    testBookingId = booking?.id;

    record(
      "TEST 6.1",
      "Booking Creation with Snapshot",
      bookingRes.status === 201 && !!testBookingId,
      `Booking created: ${testBookingId}, totalAmount: ${booking?.totalAmount}`
    );

    // Fetch booking item from database directly to inspect frozen snapshot columns
    const initialItem = await prisma.bookingItem.findFirst({
      where: { bookingId: testBookingId },
    });

    const initialSnapshotPrice = Number(initialItem?.snapshotPrice || 0);
    const initialSnapshotDeposit = Number(initialItem?.snapshotDepositAmount || 0);
    const initialSnapshotDuration = initialItem?.snapshotDurationMinutes;

    record(
      "TEST 6.2",
      "Initial Snapshot Verification",
      initialSnapshotPrice === 2200 && initialSnapshotDeposit === 1100 && initialSnapshotDuration === 85,
      `Captured Snapshot -> Price: ${initialSnapshotPrice} ETB, Deposit: ${initialSnapshotDeposit} ETB, Duration: ${initialSnapshotDuration} min`
    );

    // MUTATION: Drastically change service base price to 5,000 ETB and branch custom price to 6,000 ETB
    console.log("Mutating Service Base Price -> 5,000 ETB and Branch Custom Price -> 6,000 ETB...");
    await patchJson(`/services/${createdServiceId}`, { basePrice: 5000 }, ownerHeaders);
    await postJson(
      `/services/${createdServiceId}/branch-price`,
      {
        branchId: branchA.id,
        customPrice: 6000,
        customDurationMinutes: 120,
        depositType: "FIXED",
        depositValue: 2000,
        reason: "Radical inflation adjustment",
      },
      ownerHeaders
    );

    // RE-QUERY the past booking and verify that snapshot columns REMAIN IMMUTABLE
    const postMutationItem = await prisma.bookingItem.findFirst({
      where: { bookingId: testBookingId },
    });

    const postPrice = Number(postMutationItem?.snapshotPrice || 0);
    const postDeposit = Number(postMutationItem?.snapshotDepositAmount || 0);
    const postDuration = postMutationItem?.snapshotDurationMinutes;

    const isSnapshotImmutable =
      postPrice === 2200 &&
      postDeposit === 1100 &&
      postDuration === 85;

    record(
      "TEST 6.3",
      "Past Booking Immutability Proof",
      isSnapshotImmutable,
      `Frozen Snapshot Post-Mutation -> Price: ${postPrice} ETB (not 6000), Deposit: ${postDeposit} ETB (not 2000), Duration: ${postDuration} min (not 120)`
    );

  } catch (err: any) {
    console.error("\n❌ AUDIT ENCOUNTERED UNEXPECTED ERROR:", err);
    record("ERROR", "Unhandled Exception", false, err.message || String(err));
  } finally {
    // -----------------------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------------------
    console.log("\n--- CLEANUP ---");
    try {
      if (testBookingId) {
        await prisma.bookingItem.deleteMany({ where: { bookingId: testBookingId } });
        await prisma.booking.deleteMany({ where: { id: testBookingId } });
        console.log(`✓ Cleaned up test booking: ${testBookingId}`);
      }
      if (createdServiceId) {
        await prisma.servicePriceHistory.deleteMany({ where: { serviceId: createdServiceId } });
        await prisma.branchServicePrice.deleteMany({ where: { serviceId: createdServiceId } });
        await prisma.service.deleteMany({ where: { id: createdServiceId } });
        console.log(`✓ Cleaned up test service: ${createdServiceId}`);
      }
      await prisma.$disconnect();
    } catch (cleanErr: any) {
      console.warn("Cleanup warning:", cleanErr.message);
    }
  }

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log(" AUDIT RESULTS SUMMARY                                                   ");
  console.log("==========================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total Scenarios: ${total}`);
  console.log(`Passed:          ${passed}`);
  console.log(`Failed:          ${failed}`);

  if (failed > 0) {
    console.log("\nFailed Scenarios:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(` - [${r.step}] ${r.scenario}: ${r.details}`));
    process.exit(1);
  } else {
    console.log("\n✨ ALL SPRINT 3 EPIC 3 SERVICE & PRICING AUDITS PASSED WITH ZERO FAILURES!");
    process.exit(0);
  }
}

runAudit();
