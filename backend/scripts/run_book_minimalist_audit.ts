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

async function getJson(endpoint: string, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...headers },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, data: json };
}

async function runAudit() {
  console.log("==========================================================================");
  console.log(" EYOB SALON — /BOOK MINIMALIST PURGE & SPECIALIST AUDIT                   ");
  console.log("==========================================================================\n");

  try {
    // -----------------------------------------------------------------
    // SETUP: Discover Branches
    // -----------------------------------------------------------------
    console.log("--- SETUP: Identifying Core Sanctuary Branches ---");
    const boleBranch = await prisma.branch.findFirst({
      where: { name: { contains: "Bole" } },
    });
    const kazanchisBranch = await prisma.branch.findFirst({
      where: { name: { contains: "Kazanchis" } },
    });

    if (!boleBranch || !kazanchisBranch) {
      throw new Error("Required branches not found in database.");
    }
    record("SETUP", "Branch Discovery", true, `Bole: ${boleBranch.name}, Kazanchis: ${kazanchisBranch.name}`);

    // -----------------------------------------------------------------
    // TEST 1: Categories Purged of Garbage & Test Artifacts
    // -----------------------------------------------------------------
    console.log("\n--- TEST 1: Category Integrity & Garbage Purge ---");
    const categoriesRes = await getJson("/services/categories");
    const categories: any[] = categoriesRes.data?.data || categoriesRes.data?.categories || [];

    const hasGarbageCategories = categories.some((c) => {
      const name = (c.name || "").toLowerCase();
      const slug = (c.slug || "").toLowerCase();
      return name.includes("bbbb") || name.includes("ssss") || slug.includes("bbbb") || slug.includes("ssss");
    });

    record(
      "TEST 1.1",
      "Garbage Category Purge Verification",
      !hasGarbageCategories,
      `Categories count: ${categories.length}, Garbage found: ${hasGarbageCategories}`
    );

    const allApproved = categories.every((c) => c.status === "APPROVED" && c.isActive !== false);
    record(
      "TEST 1.2",
      "All Public Categories Active & Approved",
      allApproved,
      `Legitimate categories verified: ${categories.map((c) => c.name).join(", ")}`
    );

    // -----------------------------------------------------------------
    // TEST 2: Strict Minimalist Descriptions (Zero Paragraph Blocks)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 2: Service Description Minimalist Audit ---");
    const servicesRes = await getJson("/services?status=active");
    const services: any[] = servicesRes.data?.services || servicesRes.data?.data || [];

    let longDescFound = false;
    let verboseServiceName = "";

    for (const s of services) {
      const descWords = s.description ? s.description.trim().split(/\s+/).length : 0;
      const descAmWords = s.descriptionAm ? s.descriptionAm.trim().split(/\s+/).length : 0;
      if (descWords > 3 || (s.description && s.description.length > 25)) {
        longDescFound = true;
        verboseServiceName = `${s.name}: "${s.description}" (${descWords} words)`;
        break;
      }
      if (descAmWords > 3 || (s.descriptionAm && s.descriptionAm.length > 25)) {
        longDescFound = true;
        verboseServiceName = `${s.name}: "${s.descriptionAm}" (${descAmWords} words)`;
        break;
      }
    }

    record(
      "TEST 2.1",
      "No Verbose Description Paragraphs in Catalog",
      !longDescFound,
      longDescFound ? `Violation: ${verboseServiceName}` : `Verified ${services.length} active rituals: 0 long paragraphs`
    );

    // -----------------------------------------------------------------
    // TEST 3: Catalog Parity (Home vs /book)
    // -----------------------------------------------------------------
    console.log("\n--- TEST 3: Catalog Parity (Home vs /book) ---");
    const homeRes = await getJson("/services");
    const homeServices: any[] = homeRes.data?.services || homeRes.data?.data || [];

    const homeIds = homeServices.map((s) => s.id).sort();
    const bookIds = services.map((s) => s.id).sort();
    const countsMatch = homeIds.length === bookIds.length;
    const idsMatch = countsMatch && homeIds.every((id, idx) => id === bookIds[idx]);

    record(
      "TEST 3.1",
      "Catalog Parity Between Home and Booking Page",
      countsMatch && idsMatch,
      `Home count: ${homeServices.length}, Book count: ${services.length}, Parity: ${idsMatch}`
    );

    // -----------------------------------------------------------------
    // TEST 4: Real Database Specialists Roster for /book
    // -----------------------------------------------------------------
    console.log("\n--- TEST 4: Real Database Specialists Roster ---");
    // Guest query for specialists assigned to Bole Branch
    const boleEmployeesRes = await getJson(`/employees?branchId=${boleBranch.id}`);
    const boleEmployees: any[] = boleEmployeesRes.data?.data || [];

    record(
      "TEST 4.1",
      "Specialist Roster Query Success (Guest Access)",
      boleEmployeesRes.status === 200 && boleEmployees.length > 0,
      `Status: ${boleEmployeesRes.status}, Found: ${boleEmployees.length} specialists for ${boleBranch.name}`
    );

    // Verify all returned employees belong to Bole and have no financial leakage
    const allBoleBranch = boleEmployees.every((e) => e.branchId === boleBranch.id);
    const noFinancialLeakage = boleEmployees.every(
      (e) => e.baseSalary === undefined && e.commissionRate === undefined
    );

    record(
      "TEST 4.2",
      "Specialist Scoping & Financial Data Sanitization",
      allBoleBranch && noFinancialLeakage,
      `Branch scoped: ${allBoleBranch}, Financials stripped: ${noFinancialLeakage}`
    );

    // Verify Kazanchis branch specialist query
    const kazanchisEmployeesRes = await getJson(`/employees?branchId=${kazanchisBranch.id}`);
    const kazanchisEmployees: any[] = kazanchisEmployeesRes.data?.data || [];

    record(
      "TEST 4.3",
      "Kazanchis Specialist Branch Isolation",
      kazanchisEmployeesRes.status === 200 && kazanchisEmployees.every((e) => e.branchId === kazanchisBranch.id),
      `Found ${kazanchisEmployees.length} specialists strictly scoped to Kazanchis (${kazanchisEmployees.map(e => e.firstName + ' ' + e.lastName).join(', ')})`
    );

  } catch (err: any) {
    console.error("Audit failure:", err);
    record("FATAL", "Execution Aborted", false, err.message);
  } finally {
    await prisma.$disconnect();
  }

  // -----------------------------------------------------------------
  // RESULTS SCORECARD
  // -----------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log(" AUDIT RESULTS SCORECARD");
  console.log("==========================================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total:  ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Rate:   ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed === 0) {
    console.log("✅ ALL /BOOK MINIMALIST & SPECIALIST AUDITS PASSED WITH 100% SUCCESS!\n");
  } else {
    console.error("❌ AUDIT FAILURES DETECTED! Review output above.\n");
    process.exit(1);
  }
}

runAudit();
