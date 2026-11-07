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

async function getJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function runAudit() {
  console.log("=================================================================");
  console.log(" EYOB SALON — SPRINT 2 US1 CUSTOMER REGISTRATION & ACCESS AUDIT   ");
  console.log("=================================================================\n");

  const testPhone1 = "+251912999001";
  const testPhone1Updated = "+251912999002";
  const testPhone2 = "+251912999003";
  const testEmail1 = "helen.berhane@gmail.com";
  const testEmail2 = "second.user@gmail.com";

  // Pre-cleanup in case of previous failed run
  await prisma.user.deleteMany({
    where: {
      phone: { in: [testPhone1, testPhone1Updated, testPhone2] },
    },
  });

  let customerToken = "";
  let customerId = "";

  // -------------------------------------------------------------
  // STEP 1: Customer Open Registration (Global Account Provisioning)
  // -------------------------------------------------------------
  console.log("--> Testing Customer Open Registration with Global Pass...");
  const regRes = await postJson("/auth/register", {
    firstName: "Helen",
    lastName: "Berhane",
    phone: testPhone1,
    email: testEmail1,
    password: "Password@123",
  });

  const regPassed =
    regRes.status === 201 &&
    regRes.data?.data?.tokens?.accessToken &&
    regRes.data?.data?.user?.role === "CUSTOMER" &&
    regRes.data?.data?.user?.branchId === null;

  record(
    "STEP 1.1",
    "Customer Open Registration API",
    regPassed,
    `Status ${regRes.status}, role=${regRes.data?.data?.user?.role}, branchId=${regRes.data?.data?.user?.branchId}`
  );

  customerToken = regRes.data?.data?.tokens?.accessToken || "";
  customerId = regRes.data?.data?.user?.id || "";

  // Database Level Check for Global Account & Defaults
  const dbUser = await prisma.user.findUnique({
    where: { phone: testPhone1 },
  });

  const dbPassed =
    dbUser !== null &&
    dbUser.role === "CUSTOMER" &&
    dbUser.branchId === null &&
    dbUser.preferredLang === "EN" &&
    dbUser.smsNotifications === true &&
    dbUser.emailNotifications === true;

  record(
    "STEP 1.2",
    "Prisma DB Global Verification & Preference Defaults",
    dbPassed,
    `branchId=${dbUser?.branchId}, preferredLang=${dbUser?.preferredLang}, smsNotifications=${dbUser?.smsNotifications}, emailNotifications=${dbUser?.emailNotifications}`
  );

  // -------------------------------------------------------------
  // STEP 2: Cross-Branch Access (Bole, Kazanchis, etc.)
  // -------------------------------------------------------------
  console.log("\n--> Testing Global Cross-Branch Access Eligibility...");
  const branches = await prisma.branch.findMany({ take: 2 });
  if (branches.length >= 2) {
    const branch1Services = await getJson(`/services/branch/${branches[0].id}`, {
      Authorization: `Bearer ${customerToken}`,
    });
    const branch2Services = await getJson(`/services/branch/${branches[1].id}`, {
      Authorization: `Bearer ${customerToken}`,
    });

    const crossBranchPassed =
      branch1Services.status !== 403 &&
      branch2Services.status !== 403;

    record(
      "STEP 2",
      "Global Cross-Branch Inquiries (No 403 Forbidden)",
      crossBranchPassed,
      `Branch 1 (${branches[0].name}) status=${branch1Services.status}, Branch 2 (${branches[1].name}) status=${branch2Services.status}`
    );
  } else {
    record("STEP 2", "Global Cross-Branch Inquiries", true, "Fewer than 2 branches in DB, skipped cross query");
  }

  // -------------------------------------------------------------
  // STEP 3: Customer Profile Read (/api/v1/customers/me)
  // -------------------------------------------------------------
  console.log("\n--> Testing GET /api/v1/customers/me...");
  const profileRes = await getJson("/customers/me", {
    Authorization: `Bearer ${customerToken}`,
  });

  const pData = profileRes.data?.data;
  const profilePassed =
    profileRes.status === 200 &&
    pData?.firstName === "Helen" &&
    pData?.lastName === "Berhane" &&
    pData?.phone === testPhone1 &&
    pData?.email === testEmail1 &&
    pData?.isGlobalAccount === true &&
    pData?.preferredLang === "EN" &&
    pData?.smsNotifications === true &&
    pData?.emailNotifications === true &&
    pData?.stats !== undefined;

  record(
    "STEP 3",
    "Customer Profile Retrieval & Statistics Structure",
    profilePassed,
    `Status ${profileRes.status}, isGlobalAccount=${pData?.isGlobalAccount}, totalBookings=${pData?.stats?.totalBookings}`
  );

  // -------------------------------------------------------------
  // STEP 4: Customer Profile Update (/api/v1/customers/me)
  // -------------------------------------------------------------
  console.log("\n--> Testing PATCH /api/v1/customers/me (Update Preferences & Info)...");
  const updateRes = await patchJson(
    "/customers/me",
    {
      firstName: "Helen-Luxury",
      lastName: "Berhane-Queen",
      phone: testPhone1Updated,
      preferredLang: "AM",
      smsNotifications: false,
      emailNotifications: true,
    },
    { Authorization: `Bearer ${customerToken}` }
  );

  const uData = updateRes.data?.data;
  const updatePassed =
    updateRes.status === 200 &&
    uData?.firstName === "Helen-Luxury" &&
    uData?.lastName === "Berhane-Queen" &&
    uData?.phone === testPhone1Updated &&
    uData?.preferredLang === "AM" &&
    uData?.smsNotifications === false &&
    uData?.emailNotifications === true;

  record(
    "STEP 4.1",
    "Customer Profile Update API Response",
    updatePassed,
    `Status ${updateRes.status}, name="${uData?.firstName} ${uData?.lastName}", preferredLang=${uData?.preferredLang}, sms=${uData?.smsNotifications}`
  );

  // Verify in PostgreSQL via Prisma
  const updatedDbUser = await prisma.user.findUnique({
    where: { id: customerId },
  });

  const dbUpdatePassed =
    updatedDbUser !== null &&
    updatedDbUser.firstName === "Helen-Luxury" &&
    updatedDbUser.lastName === "Berhane-Queen" &&
    updatedDbUser.phone === testPhone1Updated &&
    updatedDbUser.preferredLang === "AM" &&
    updatedDbUser.smsNotifications === false &&
    updatedDbUser.emailNotifications === true;

  record(
    "STEP 4.2",
    "Prisma DB Persistence of Updated Preferences",
    dbUpdatePassed,
    `DB phone=${updatedDbUser?.phone}, lang=${updatedDbUser?.preferredLang}, sms=${updatedDbUser?.smsNotifications}`
  );

  // -------------------------------------------------------------
  // STEP 5: Collision Protection (409 Conflict)
  // -------------------------------------------------------------
  console.log("\n--> Testing Collision Protection (Duplicate Phone & Email)...");
  // Register second customer
  const reg2Res = await postJson("/auth/register", {
    firstName: "Second",
    lastName: "User",
    phone: testPhone2,
    email: testEmail2,
    password: "Password@123",
  });

  record(
    "STEP 5.1",
    "Register Colliding Target Customer",
    reg2Res.status === 201,
    `Status ${reg2Res.status}, user2 phone=${testPhone2}`
  );

  // Attempt duplicate registration with same phone -> must be 409
  const dupRegRes = await postJson("/auth/register", {
    firstName: "Third",
    lastName: "User",
    phone: testPhone2,
    email: "third.user@gmail.com",
    password: "Password@123",
  });

  const dupRegPassed = dupRegRes.status === 409;
  record(
    "STEP 5.2",
    "Duplicate Registration Collision Guard (409 Conflict)",
    dupRegPassed,
    `Status ${dupRegRes.status}, message="${dupRegRes.data?.message}"`
  );

  // Attempt duplicate phone update in profile -> must be 409
  const dupPhoneRes = await patchJson(
    "/customers/me",
    { phone: testPhone2 },
    { Authorization: `Bearer ${customerToken}` }
  );

  const dupPhonePassed = dupPhoneRes.status === 409;
  record(
    "STEP 5.3",
    "Profile Update Duplicate Phone Guard (409 Conflict)",
    dupPhonePassed,
    `Status ${dupPhoneRes.status}, message="${dupPhoneRes.data?.message}"`
  );

  // Attempt duplicate email update in profile -> must be 409
  const dupEmailRes = await patchJson(
    "/customers/me",
    { email: testEmail2 },
    { Authorization: `Bearer ${customerToken}` }
  );

  const dupEmailPassed = dupEmailRes.status === 409;
  record(
    "STEP 5.4",
    "Profile Update Duplicate Email Guard (409 Conflict)",
    dupEmailPassed,
    `Status ${dupEmailRes.status}, message="${dupEmailRes.data?.message}"`
  );

  // -------------------------------------------------------------
  // STEP 6: Clean Up Test Records
  // -------------------------------------------------------------
  console.log("\n--> Cleaning up audit test data...");
  await prisma.user.deleteMany({
    where: {
      phone: { in: [testPhone1, testPhone1Updated, testPhone2] },
    },
  });
  console.log("✓ Audit test users cleanly removed from DB.\n");

  // Summary
  const allPassed = results.every((r) => r.passed);
  console.log("=================================================================");
  console.log(` AUDIT SUMMARY: ${results.filter((r) => r.passed).length}/${results.length} PASSED`);
  console.log("=================================================================");
  if (!allPassed) {
    process.exit(1);
  }
}

runAudit()
  .catch((err) => {
    console.error("Fatal audit execution error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

