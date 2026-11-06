import prisma from "../src/utils/prisma";
import bcrypt from "bcryptjs";

export const STANDARD_PERMISSIONS = [
  // Bookings
  { name: "view_bookings", description: "View appointment records and schedules" },
  { name: "create_booking", description: "Create appointments and reservations" },
  { name: "update_booking", description: "Update appointment status, time, and assignment" },
  { name: "cancel_booking", description: "Cancel or reject bookings" },

  // Staff & Employees
  { name: "view_employees", description: "View employee profiles and rosters" },
  { name: "manage_employees", description: "Create, update, and manage employee profiles" },
  { name: "manage_schedules", description: "Manage weekly shifts and schedule exceptions" },

  // Services & Pricing
  { name: "view_services", description: "View service rituals and catalog" },
  { name: "manage_services", description: "Create and update service catalog" },
  { name: "manage_prices", description: "Modify base prices and branch-specific rates" },

  // Financial & Governance
  { name: "record_cash_payment", description: "Accept and record cash and POS payments" },
  { name: "view_reports", description: "Access income aggregations and performance reports" },
  { name: "view_audit_logs", description: "Inspect sensitive system audit logs" },
  { name: "manage_branches", description: "Create and govern branch locations" },
  { name: "manage_roles", description: "Create, configure, and assign roles and permissions" },
];

export async function seedRbac() {
  console.log(">> Seeding Granular Permissions...");
  const permissionMap = new Map<string, string>();

  for (const perm of STANDARD_PERMISSIONS) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: { name: perm.name, description: perm.description },
    });
    permissionMap.set(p.name, p.id);
  }

  console.log(`>> Upserted ${permissionMap.size} permissions.`);

  // 1. System Role: OWNER (all permissions)
  const ownerRole = await prisma.role.upsert({
    where: { name: "OWNER" },
    update: { description: "Salon Owner with global cross-branch authority", isSystemRole: true },
    create: {
      name: "OWNER",
      description: "Salon Owner with global cross-branch authority",
      isSystemRole: true,
    },
  });

  // Assign all permissions to OWNER
  for (const permId of permissionMap.values()) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: ownerRole.id,
          permissionId: permId,
        },
      },
      update: {},
      create: { roleId: ownerRole.id, permissionId: permId },
    });
  }

  // 2. System Role: BRANCH_ADMIN (all branch permissions except view_audit_logs and manage_branches)
  const branchAdminPermissions = [
    "view_bookings",
    "create_booking",
    "update_booking",
    "cancel_booking",
    "view_employees",
    "manage_employees",
    "manage_schedules",
    "view_services",
    "manage_services",
    "manage_prices",
    "record_cash_payment",
    "view_reports",
  ];

  const branchAdminRole = await prisma.role.upsert({
    where: { name: "BRANCH_ADMIN" },
    update: { description: "Branch Administrator scoped to assigned branch", isSystemRole: true },
    create: {
      name: "BRANCH_ADMIN",
      description: "Branch Administrator scoped to assigned branch",
      isSystemRole: true,
    },
  });

  // Clear and re-assign exact permissions
  await prisma.rolePermission.deleteMany({
    where: { roleId: branchAdminRole.id },
  });

  for (const permName of branchAdminPermissions) {
    const permId = permissionMap.get(permName);
    if (permId) {
      await prisma.rolePermission.create({
        data: { roleId: branchAdminRole.id, permissionId: permId },
      });
    }
  }

  // 3. System Role: EMPLOYEE
  const employeeRole = await prisma.role.upsert({
    where: { name: "EMPLOYEE" },
    update: { description: "Salon Specialist / Floor Staff", isSystemRole: true },
    create: {
      name: "EMPLOYEE",
      description: "Salon Specialist / Floor Staff",
      isSystemRole: true,
    },
  });

  await prisma.rolePermission.deleteMany({
    where: { roleId: employeeRole.id },
  });
  for (const permName of ["view_bookings", "view_services"]) {
    const permId = permissionMap.get(permName);
    if (permId) {
      await prisma.rolePermission.create({
        data: { roleId: employeeRole.id, permissionId: permId },
      });
    }
  }

  // 4. Fetch Bole Bulbula branch
  const boleBranch = await prisma.branch.findUnique({
    where: { slug: "bole-bulbula" },
  });

  if (!boleBranch) {
    throw new Error("Bole Bulbula branch not found. Run seed first.");
  }

  // 5. Seed / Update Owner User
  const ownerHashedPassword = await bcrypt.hash("Owner@123", 10);
  const ownerUser = await prisma.user.upsert({
    where: { phone: "+251911000001" },
    update: {
      email: "owner@eyobsalon.com",
      password: ownerHashedPassword,
      role: "OWNER",
      roleId: ownerRole.id,
      branchId: boleBranch.id,
    },
    create: {
      firstName: "Eyob",
      lastName: "Hailu",
      email: "owner@eyobsalon.com",
      phone: "+251911000001",
      password: ownerHashedPassword,
      role: "OWNER",
      roleId: ownerRole.id,
      branchId: boleBranch.id,
    },
  });
  console.log(`>> Owner User seeded: ${ownerUser.email} (Role: ${ownerRole.name})`);

  // 6. Seed / Update Branch Admin User for Bole Bulbula
  const adminHashedPassword = await bcrypt.hash("Admin@123", 10);
  const boleAdminUser = await prisma.user.upsert({
    where: { phone: "+251911000002" },
    update: {
      firstName: "Bole",
      lastName: "Administrator",
      email: "admin.bole@eyobsalon.com",
      password: adminHashedPassword,
      role: "BRANCH_ADMIN",
      roleId: branchAdminRole.id,
      branchId: boleBranch.id,
    },
    create: {
      firstName: "Bole",
      lastName: "Administrator",
      email: "admin.bole@eyobsalon.com",
      phone: "+251911000002",
      password: adminHashedPassword,
      role: "BRANCH_ADMIN",
      roleId: branchAdminRole.id,
      branchId: boleBranch.id,
    },
  });
  console.log(`>> Bole Admin User seeded: ${boleAdminUser.email} (${boleAdminUser.phone}) assigned to branch ${boleBranch.name}`);

  console.log(">> RBAC and Permissions seeding completed successfully!");
}

if (require.main === module) {
  seedRbac()
    .catch((err) => {
      console.error("RBAC seed error:", err);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

