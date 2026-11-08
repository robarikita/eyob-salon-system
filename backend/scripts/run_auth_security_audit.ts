import prisma from "../src/utils/prisma";
import { hashPassword } from "../src/utils/password";
import crypto from "crypto";

interface AuditResult {
  category: string;
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const auditResults: AuditResult[] = [];

function recordResult(category: string, scenario: string, expected: string, actual: string, passed: boolean) {
  auditResults.push({ category, scenario, expected, actual, passed });
}

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api/v1";

async function postJson(endpoint: string, body: any, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function getJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runSecurityAudit() {
  console.log("=================================================================");
  console.log("  EYOB SALON SYSTEM — SPRINT 1 US1 AUTHENTICATION & SECURITY AUDIT");
  console.log("=================================================================\n");

  const testEmail = "security.audit@eyobsalon.com";
  const testPhone = "+251911445566";
  const initialPassword = "InitialSecurePassword123!";
  const updatedPassword = "UpdatedSecurePassword456!";

  // 0. Ensure clean test user in PostgreSQL
  await prisma.user.deleteMany({
    where: {
      OR: [{ email: testEmail }, { phone: testPhone }],
    },
  });

  const hashedPassword = await hashPassword(initialPassword);
  const testUser = await prisma.user.create({
    data: {
      firstName: "Security",
      lastName: "Auditor",
      email: testEmail,
      phone: testPhone,
      password: hashedPassword,
      role: "CUSTOMER",
    },
  });

  // -------------------------------------------------------------
  // AREA 1: PASSWORD HASHING (PostgreSQL Salt & Plaintext Check)
  // -------------------------------------------------------------
  console.log(">> Area 1: Verifying Password Hashing & Bcrypt Salt in PostgreSQL...");
  const dbUser = await prisma.user.findUnique({
    where: { id: testUser.id },
  });

  const isBcrypt = dbUser?.password.startsWith("$2a$") || dbUser?.password.startsWith("$2b$");
  const isSaltValidLength = (dbUser?.password.length || 0) === 60;
  const isPlaintextAbsent = !dbUser?.password.includes(initialPassword);
  const hashingPassed = !!isBcrypt && isSaltValidLength && isPlaintextAbsent;

  recordResult(
    "1. Password Hashing",
    "Inspect raw password column in PostgreSQL user record",
    "Bcrypt hash ($2a$ or $2b$), 60 characters length, plain-text never persisted",
    `Prefix: ${dbUser?.password.slice(0, 4)}, Length: ${dbUser?.password.length}, Plaintext absent: ${isPlaintextAbsent}`,
    hashingPassed
  );

  // -------------------------------------------------------------
  // AREA 2: IDENTIFIER FLEXIBILITY (Email vs Phone Number)
  // -------------------------------------------------------------
  console.log(">> Area 2: Verifying Identifier Flexibility (Email vs Phone Number)...");

  // 2a. Login with Email
  const emailLogin = await postJson("/auth/login", {
    identifier: testEmail,
    password: initialPassword,
    role: "CUSTOMER",
  });

  const emailPassed = emailLogin.status === 200 && !!emailLogin.data.data?.tokens?.accessToken;
  recordResult(
    "2. Identifier Flexibility",
    `Login using email identifier ("${testEmail}")`,
    "HTTP 200 OK with valid JWT tokens",
    `HTTP ${emailLogin.status} - User ID: ${emailLogin.data.data?.user?.id?.slice(0, 8)}...`,
    emailPassed
  );

  // 2b. Login with Ethiopian phone number in identifier field
  const phoneLogin = await postJson("/auth/login", {
    identifier: testPhone,
    password: initialPassword,
    role: "CUSTOMER",
  });

  const phonePassed = phoneLogin.status === 200 && !!phoneLogin.data.data?.tokens?.accessToken;
  recordResult(
    "2. Identifier Flexibility",
    `Login using Ethiopian mobile number identifier ("${testPhone}")`,
    "HTTP 200 OK with valid JWT tokens",
    `HTTP ${phoneLogin.status} - Phone: ${phoneLogin.data.data?.user?.phone}`,
    phonePassed
  );

  // 2c. Invalid credentials check (neutral error message)
  const invalidCreds = await postJson("/auth/login", {
    identifier: testEmail,
    password: "WrongPassword999!",
    role: "CUSTOMER",
  });

  const invalidPassed = invalidCreds.status === 401 && invalidCreds.data.message === "Invalid credentials";
  recordResult(
    "2. Identifier Flexibility",
    "Login attempt with incorrect password",
    'HTTP 401 Unauthorized with safe message "Invalid credentials" (no user enumeration)',
    `HTTP ${invalidCreds.status} - Message: "${invalidCreds.data.message}"`,
    invalidPassed
  );

  // -------------------------------------------------------------
  // AREA 3: TOKEN EXPIRATION & TAMPERING
  // -------------------------------------------------------------
  console.log(">> Area 3: Verifying Token Expiration & Tampering Protections...");

  // 3a. Tampered JWT
  const tamperedRes = await getJson("/auth/me", {
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.tamperedsignature",
  });
  const tamperedPassed = tamperedRes.status === 401;
  recordResult(
    "3. Token Tampering",
    "Request protected endpoint /auth/me with forged JWT signature",
    "HTTP 401 Unauthorized (Invalid or expired token)",
    `HTTP ${tamperedRes.status} - Message: "${tamperedRes.data.message}"`,
    tamperedPassed
  );

  // 3b. Expired Password Reset Token
  const expiredRawToken = crypto.randomBytes(32).toString("hex");
  const expiredHashed = crypto.createHash("sha256").update(expiredRawToken).digest("hex");
  await prisma.user.update({
    where: { id: testUser.id },
    data: {
      passwordResetToken: expiredHashed,
      passwordResetExpires: new Date(Date.now() - 1000 * 60 * 15), // expired 15 mins ago
    },
  });

  const expiredResetRes = await postJson("/auth/reset-password", {
    token: expiredRawToken,
    newPassword: updatedPassword,
  });
  const expiredResetPassed = expiredResetRes.status === 400 && expiredResetRes.data.message.includes("expired");
  recordResult(
    "3. Token Expiration",
    "Attempt password reset with expired token",
    "HTTP 400 Validation Error stating token is invalid or expired",
    `HTTP ${expiredResetRes.status} - Message: "${expiredResetRes.data.message}"`,
    expiredResetPassed
  );

  // -------------------------------------------------------------
  // AREA 4: SESSION INVALIDATION ON PASSWORD RESET
  // -------------------------------------------------------------
  console.log(">> Area 4: Verifying Session Invalidation on Password Reset...");

  // 4a. Log in and get active token
  const preResetLogin = await postJson("/auth/login", {
    identifier: testEmail,
    password: initialPassword,
    role: "CUSTOMER",
  });
  const oldAccessToken = preResetLogin.data.data?.tokens?.accessToken;

  // Verify old token works before reset
  const preResetCheck = await getJson("/auth/me", {
    Authorization: `Bearer ${oldAccessToken}`,
  });
  const preResetCheckPassed = preResetCheck.status === 200;

  // 4b. Request forgot password and get valid reset token
  const forgotRes = await postJson("/auth/forgot-password", {
    identifier: testEmail,
  });
  const validResetToken = forgotRes.data.data?.resetToken;

  // 4c. Reset password
  const resetRes = await postJson("/auth/reset-password", {
    token: validResetToken,
    newPassword: updatedPassword,
  });
  const resetSuccess = resetRes.status === 200;

  // 4d. Verify OLD access token is now REJECTED
  const postResetOldTokenCheck = await getJson("/auth/me", {
    Authorization: `Bearer ${oldAccessToken}`,
  });
  const oldTokenRevoked = postResetOldTokenCheck.status === 401;

  // 4e. Verify login with NEW password succeeds
  const newLogin = await postJson("/auth/login", {
    identifier: testEmail,
    password: updatedPassword,
    role: "CUSTOMER",
  });
  const newPasswordWorks = newLogin.status === 200 && !!newLogin.data.data?.tokens?.accessToken;

  const sessionInvalidationPassed =
    preResetCheckPassed && resetSuccess && oldTokenRevoked && newPasswordWorks;

  recordResult(
    "4. Session Invalidation",
    "Password reset revokes previously issued JWTs and invalidates active sessions",
    "Pre-reset token returns 200 OK; post-reset old token rejected with HTTP 401; new password logs in",
    `Pre-reset: HTTP ${preResetCheck.status} | Post-reset old token: HTTP ${postResetOldTokenCheck.status} (Revoked) | New login: HTTP ${newLogin.status}`,
    sessionInvalidationPassed
  );

  // -------------------------------------------------------------
  // AREA 5: BRUTE-FORCE LOCKOUT (HTTP 429 Too Many Requests)
  // -------------------------------------------------------------
  console.log(">> Area 5: Verifying Brute-Force Lockout (HTTP 429)...");
  const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
  let attemptsResponses: number[] = [];

  // Make 5 consecutive failed attempts
  for (let i = 1; i <= 5; i++) {
    const failRes = await postJson(
      "/auth/login",
      { identifier: testEmail, password: "IncorrectPassword!", role: "CUSTOMER" },
      { "x-test-ip": testIp }
    );
    attemptsResponses.push(failRes.status);
  }

  // 6th attempt should be blocked by rate limiter
  const sixthAttempt = await postJson(
    "/auth/login",
    { identifier: testEmail, password: "IncorrectPassword!", role: "CUSTOMER" },
    { "x-test-ip": testIp }
  );

  const lockoutPassed =
    attemptsResponses.every((s) => s === 401) &&
    sixthAttempt.status === 429 &&
    sixthAttempt.data.message.includes("Too many failed login attempts");

  recordResult(
    "5. Brute-Force Lockout",
    "5 consecutive failed login attempts from distinct IP followed by 6th attempt",
    "Attempts 1-5 return HTTP 401; Attempt 6 returns HTTP 429 Too Many Requests with safe message",
    `Attempts 1-5: [${attemptsResponses.join(", ")}] | Attempt 6: HTTP ${sixthAttempt.status} - "${sixthAttempt.data.message}"`,
    lockoutPassed
  );

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  console.log("\n=================================================================");
  console.log("                      TEST RESULTS SUMMARY");
  console.log("=================================================================\n");

  let allPassed = true;
  for (const r of auditResults) {
    const symbol = r.passed ? "[✓ PASS]" : "[✗ FAIL]";
    if (!r.passed) allPassed = false;
    console.log(`${symbol} [${r.category}]`);
    console.log(`  Scenario: ${r.scenario}`);
    console.log(`  Expected: ${r.expected}`);
    console.log(`  Actual:   ${r.actual}\n`);
  }

  console.log("=================================================================");
  console.log(`Total Tests Run: ${auditResults.length}`);
  console.log(`Passed: ${auditResults.filter((r) => r.passed).length}`);
  console.log(`Failed: ${auditResults.filter((r) => !r.passed).length}`);
  console.log("=================================================================\n");

  // Clean up test user
  await prisma.user.deleteMany({
    where: {
      OR: [{ email: testEmail }, { phone: testPhone }],
    },
  });

  if (!allPassed) {
    process.exit(1);
  }
}

runSecurityAudit()
  .catch((err) => {
    console.error("Audit Script Error:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

