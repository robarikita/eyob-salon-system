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

async function runAudit() {
  console.log("=================================================================");
  console.log(" EYOB SALON — SPRINT 2 US2: CUSTOMER PRIVACY & BRANCH LIFECYCLE  ");
  console.log("=================================================================\n");

  const ts = Date.now();
  const custAPhone = `+251921${String(ts).slice(-6)}`;
  const custBPhone = `+251922${String(ts).slice(-6)}`;
  const custAEmail = `customer.a.${ts}@eyobtest.com`;
  const custBEmail = `customer.b.${ts}@eyobtest.com`;
  const adminEmail = `admin.iso.${ts}@eyobtest.com`;
  const adminPhone = `+251923${String(ts).slice(-6)}`;

  try {
    // 0. Authenticate Owner
    const ownerLogin = await postJson("/auth/login", {
      identifier: "owner@eyobsalon.com",
      password: "Owner@123",
    });

    const ownerToken =
      ownerLogin.data.data?.tokens?.accessToken || ownerLogin.data.data?.accessToken;

    if (ownerLogin.status !== 200 || !ownerToken) {
      throw new Error(`Owner login failed: ${JSON.stringify(ownerLogin.data)}`);
    }
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    record("SETUP", "Owner Authentication", true, "Owner logged in successfully.");

    // -----------------------------------------------------------------
    // TEST 1: Branch Inactive vs Active Lifecycle & Slot Reservation
    // -----------------------------------------------------------------
    console.log("\n--- TEST 1: Branch Inactive vs Active Lifecycle ---");
    const testBranch1Name = `Inactive Test Branch ${ts}`;
    const branch1Res = await postJson(
      "/branches",
      {
        name: testBranch1Name,
        phone: "+251911888001",
        address: "Test Address Bole",
        city: "Addis Ababa",
      },
      ownerHeaders
    );

    const testBranch1 = branch1Res.data.data;
    record(
      "TEST 1.1",
      "Create Branch for Inactive Lifecycle",
      branch1Res.status === 201 && testBranch1?.isActive === true,
      `Branch created with active status: ${testBranch1?.id}`
    );

    // Toggle status to inactive
    const toggleInactiveRes = await patchJson(
      `/branches/${testBranch1.id}/toggle-status`,
      { isActive: false },
      ownerHeaders
    );

    record(
      "TEST 1.2",
      "Toggle Branch to Inactive",
      toggleInactiveRes.status === 200 && toggleInactiveRes.data.data?.isActive === false,
      `Branch isActive set to false via /toggle-status`
    );

    // Verify slot / availability check fails for inactive branch
    const availabilityRes = await getJson(
      `/bookings/availability?branchId=${testBranch1.id}&serviceId=dummy&date=2026-12-01`
    );

    record(
      "TEST 1.3",
      "Block Availability for Inactive Branch",
      availabilityRes.status === 404 &&
        (availabilityRes.data?.message?.includes("inactive") ||
          availabilityRes.data?.message?.includes("not found")),
      `Availability rejected with 404: "${availabilityRes.data?.message}"`
    );

    // Toggle status back to active
    const toggleActiveRes = await patchJson(
      `/branches/${testBranch1.id}/toggle-status`,
      { isActive: true },
      ownerHeaders
    );

    record(
      "TEST 1.4",
      "Re-activate Branch",
      toggleActiveRes.status === 200 && toggleActiveRes.data.data?.isActive === true,
      `Branch successfully reactivated`
    );

    // -----------------------------------------------------------------
    // TEST 2: Permanent Branch Delete (Cascade & Removal)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 2: Permanent Branch Delete ---");
    const testBranch2Name = `Permanent Delete Branch ${ts}`;
    const branch2Res = await postJson(
      "/branches",
      {
        name: testBranch2Name,
        phone: "+251911888002",
        address: "Cascade Delete Address",
        city: "Addis Ababa",
        admin: {
          name: "Scoped Branch Manager",
          email: adminEmail,
          phone: adminPhone,
          password: "Admin@Password123",
        },
      },
      ownerHeaders
    );

    const testBranch2 = branch2Res.data.data;
    const branchAdminId = testBranch2.admin?.id;

    record(
      "TEST 2.1",
      "Create Branch with Assigned Admin",
      branch2Res.status === 201 && !!branchAdminId,
      `Branch ${testBranch2?.id} created with Admin: ${branchAdminId}`
    );

    // Permanent delete
    const permDeleteRes = await deleteJson(
      `/branches/${testBranch2.id}/permanent`,
      ownerHeaders
    );

    record(
      "TEST 2.2",
      "Execute Permanent Delete via DELETE /branches/:id/permanent",
      permDeleteRes.status === 200 && permDeleteRes.data.success === true,
      `Response: ${permDeleteRes.data.message}`
    );

    // Verify branch does not exist
    const fetchDeletedBranch = await getJson(`/branches/${testBranch2.id}`, ownerHeaders);
    const dbBranch = await prisma.branch.findUnique({ where: { id: testBranch2.id } });

    record(
      "TEST 2.3",
      "Verify Complete Database Removal of Branch",
      fetchDeletedBranch.status === 404 && dbBranch === null,
      `Branch record completely removed from DB queries`
    );

    // Verify unlinked branch administrator
    const unlinkedAdmin = await prisma.user.findUnique({ where: { id: branchAdminId } });
    record(
      "TEST 2.4",
      "Verify Branch Administrator Unlinked",
      unlinkedAdmin !== null && unlinkedAdmin.branchId === null,
      `Admin user ${branchAdminId} unlinked from deleted branch (branchId: null)`
    );

    // -----------------------------------------------------------------
    // TEST 3: Customer Isolation & Privacy (IDOR Protection)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 3: Customer Isolation & Privacy ---");

    // Register Customer A
    const regCustA = await postJson("/auth/register", {
      firstName: "Rahel",
      lastName: "Tesfaye",
      phone: custAPhone,
      email: custAEmail,
      password: "CustomerA@123",
      preferredLang: "EN",
    });

    const custAToken =
      regCustA.data.data?.tokens?.accessToken || regCustA.data.data?.accessToken;
    const custAId =
      regCustA.data.data?.user?.id || regCustA.data.data?.id;
    const custAHeaders = { Authorization: `Bearer ${custAToken}` };

    record(
      "TEST 3.1",
      "Register Customer A",
      regCustA.status === 201 && !!custAToken,
      `Customer A created with ID ${custAId}`
    );

    // Register Customer B
    const regCustB = await postJson("/auth/register", {
      firstName: "Selamawit",
      lastName: "Bekele",
      phone: custBPhone,
      email: custBEmail,
      password: "CustomerB@123",
      preferredLang: "AM",
    });

    const custBToken =
      regCustB.data.data?.tokens?.accessToken || regCustB.data.data?.accessToken;
    const custBId =
      regCustB.data.data?.user?.id || regCustB.data.data?.id;
    const custBHeaders = { Authorization: `Bearer ${custBToken}` };

    record(
      "TEST 3.2",
      "Register Customer B",
      regCustB.status === 201 && !!custBToken,
      `Customer B created with ID ${custBId}`
    );

    // Customer A queries Customer B's profile: MUST return 403 Forbidden
    const crossProfileRes = await getJson(`/customers/${custBId}`, custAHeaders);

    record(
      "TEST 3.3",
      "Customer A queries Customer B Profile (Forbidden Check)",
      crossProfileRes.status === 403 &&
        crossProfileRes.data?.message === "Access denied: unauthorized profile query",
      `Expected 403, got status ${crossProfileRes.status}: "${crossProfileRes.data?.message}"`
    );

    // Customer A queries own profile: MUST succeed (200 OK)
    const selfProfileRes = await getJson(`/customers/${custAId}`, custAHeaders);

    record(
      "TEST 3.4",
      "Customer A queries Own Profile (Allowed)",
      selfProfileRes.status === 200 && selfProfileRes.data.data?.id === custAId,
      `Customer A accessed own profile successfully: ${selfProfileRes.data.data?.email}`
    );

    // Create a mock booking for Customer B directly in DB to test booking isolation
    const activeBranch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!activeBranch) throw new Error("No active branch found for booking test");

    const bookingB = await prisma.booking.create({
      data: {
        bookingNumber: `BK-TEST-${ts}`,
        status: "CONFIRMED",
        totalAmount: 1200,
        depositRequired: 300,
        depositPaid: 300,
        balanceDue: 900,
        customerId: custBId,
        branchId: activeBranch.id,
      },
    });

    // Customer A attempts to access Customer B's booking: MUST return 403 Forbidden
    const crossBookingRes = await getJson(`/bookings/${bookingB.id}`, custAHeaders);

    record(
      "TEST 3.5",
      "Customer A queries Customer B Booking (Forbidden Check)",
      crossBookingRes.status === 403,
      `Expected 403 Forbidden on cross-patron booking, got status ${crossBookingRes.status}`
    );

    // Customer B accesses own booking: MUST succeed (200 OK)
    const ownBookingRes = await getJson(`/bookings/${bookingB.id}`, custBHeaders);

    record(
      "TEST 3.6",
      "Customer B queries Own Booking (Allowed)",
      ownBookingRes.status === 200 && ownBookingRes.data.data?.booking?.id === bookingB.id,
      `Customer B accessed own appointment details successfully`
    );

    // -----------------------------------------------------------------
    // TEST 4: Admin Clientele Directory & Cross-Branch History
    // -----------------------------------------------------------------
    console.log("\n--- TEST 4: Administrative Clientele Directory ---");

    // Customer tries to call admin clientele endpoint: MUST return 403 Forbidden
    const custClienteleRes = await getJson("/customers", custAHeaders);

    record(
      "TEST 4.1",
      "Customer Access to Clientele Directory Blocked",
      custClienteleRes.status === 403,
      `Customer access to admin clientele directory returned HTTP ${custClienteleRes.status}`
    );

    // Owner queries clientele directory: MUST return 200 OK with dossiers
    const ownerClienteleRes = await getJson(
      `/customers?search=${encodeURIComponent(custAPhone)}`,
      ownerHeaders
    );

    const foundCust = ownerClienteleRes.data.data?.customers?.[0];
    record(
      "TEST 4.2",
      "Owner Searches Clientele Directory by Phone",
      ownerClienteleRes.status === 200 && foundCust?.phone === custAPhone,
      `Found patron "${foundCust?.fullName}" (${foundCust?.phone}) with visit stats`
    );

    // Owner queries Customer B's cross-branch appointment history
    const ownerHistoryRes = await getJson(`/customers/${custBId}/history`, ownerHeaders);

    const customerHistory = ownerHistoryRes.data.data;
    record(
      "TEST 4.3",
      "Owner Inspects Patron Cross-Branch History",
      ownerHistoryRes.status === 200 &&
        customerHistory?.customer?.id === custBId &&
        customerHistory?.appointments?.length >= 1,
      `Owner retrieved cross-branch history for ${customerHistory?.customer?.fullName} (${customerHistory?.appointments?.length} bookings)`
    );

    // Clean up test branches and users
    if (testBranch1?.id) {
      await deleteJson(`/branches/${testBranch1.id}/permanent`, ownerHeaders).catch(() => {});
    }
    await prisma.booking.deleteMany({ where: { customerId: { in: [custAId, custBId] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [custAId, custBId, branchAdminId] } } }).catch(() => {});
  } catch (err: any) {
    console.error("FATAL AUDIT ERROR:", err);
    record("FATAL", "Audit execution failure", false, err.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n=================================================================");
  console.log(" AUDIT SUMMARY & SCORECARD                                      ");
  console.log("=================================================================");
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;

  console.log(`TOTAL SCENARIOS EXECUTED : ${totalTests}`);
  console.log(`PASSED                   : ${passedTests}`);
  console.log(`FAILED                   : ${failedTests}`);

  if (failedTests > 0) {
    console.log("\nFAILED SCENARIOS:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`  - [${r.step}] ${r.scenario}: ${r.details}`));
    process.exit(1);
  } else {
    console.log("\n✓ ALL CUSTOMER PRIVACY & BRANCH LIFECYCLE TESTS PASSED PERFECTLY!");
    process.exit(0);
  }
}

runAudit();
