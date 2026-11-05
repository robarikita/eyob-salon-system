import prisma from "../src/utils/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("=================================================================");
  console.log("               INSPECTING SEED USERS IN DATABASE                 ");
  console.log("=================================================================\n");

  // 1. Query all users
  const users = await prisma.user.findMany({
    include: {
      employee: {
        select: {
          status: true,
          workstation: true,
          employmentType: true,
        },
      },
      branch: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${users.length} users in database:\n`);
  users.forEach((u, i) => {
    console.log(
      `[${i + 1}] Name: ${u.firstName} ${u.lastName} | Role: ${u.role} | Email: ${u.email || "N/A"} | Phone: ${u.phone} | Branch: ${u.branch?.name || "None"} | Status: ${u.employee ? (u.employee.status ? "ACTIVE" : "INACTIVE") : "ACTIVE"}`
    );
  });

  console.log("\n=================================================================");
  console.log("          UPDATING OWNER PASSWORD (Owner@123)                    ");
  console.log("=================================================================\n");

  // Hash new password using bcrypt ($2b$10)
  const newHashedPassword = await bcrypt.hash("Owner@123", 10);

  // Check if owner@eyobsalon.com exists
  let ownerUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "owner@eyobsalon.com" },
        { email: "owner@eyobbeauty.com" },
        { phone: "+251911000001" },
        { role: "OWNER" },
      ],
    },
  });

  if (ownerUser) {
    ownerUser = await prisma.user.update({
      where: { id: ownerUser.id },
      data: {
        email: "owner@eyobsalon.com",
        phone: ownerUser.phone || "+251911000001",
        password: newHashedPassword,
        role: "OWNER",
        tokenVersion: { increment: 1 },
      },
    });
    console.log(`Updated existing owner account:`);
    console.log(`- ID: ${ownerUser.id}`);
    console.log(`- Email: ${ownerUser.email}`);
    console.log(`- Phone: ${ownerUser.phone}`);
    console.log(`- Role: ${ownerUser.role}`);
    console.log(`- Password: Owner@123 (hashed: ${ownerUser.password.slice(0, 10)}...)`);
  } else {
    // Create owner if not found
    ownerUser = await prisma.user.create({
      data: {
        firstName: "Eyob",
        lastName: "Hailu",
        email: "owner@eyobsalon.com",
        phone: "+251911000001",
        password: newHashedPassword,
        role: "OWNER",
      },
    });
    console.log(`Created new owner account:`);
    console.log(`- ID: ${ownerUser.id}`);
    console.log(`- Email: ${ownerUser.email}`);
    console.log(`- Phone: ${ownerUser.phone}`);
    console.log(`- Role: ${ownerUser.role}`);
    console.log(`- Password: Owner@123 (hashed: ${ownerUser.password.slice(0, 10)}...)`);
  }

  // 2. Execute test POST request to /api/v1/auth/login using owner@eyobsalon.com and Owner@123
  console.log("\n=================================================================");
  console.log("          TESTING LOGIN HTTP REQUEST VIA /api/v1/auth/login      ");
  console.log("=================================================================\n");

  const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api/v1";

  // Test with email
  console.log(`Attempting login with email: "owner@eyobsalon.com" and password: "Owner@123"...`);
  const emailRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "owner@eyobsalon.com",
      password: "Owner@123",
    }),
  });

  const emailData = await emailRes.json();
  console.log(`Response Status: HTTP ${emailRes.status}`);
  console.log(`Response Body:`, JSON.stringify(emailData, null, 2));

  // Test with phone
  console.log(`\nAttempting login with phone: "${ownerUser.phone}" and password: "Owner@123"...`);
  const phoneRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: ownerUser.phone,
      password: "Owner@123",
    }),
  });

  const phoneData = await phoneRes.json();
  console.log(`Response Status: HTTP ${phoneRes.status}`);
  console.log(`Response Body:`, JSON.stringify(phoneData, null, 2));

  console.log("\n=================================================================");
  console.log("                   VERIFIED CREDENTIALS                          ");
  console.log("=================================================================");
  if (emailRes.status === 200) {
    console.log(`SUCCESS: Login verified for Owner!`);
    console.log(`Email:    ${ownerUser.email}`);
    console.log(`Phone:    ${ownerUser.phone}`);
    console.log(`Password: Owner@123`);
  } else {
    console.error(`FAILURE: Status code was ${emailRes.status}`);
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("Error executing verify_users script:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
