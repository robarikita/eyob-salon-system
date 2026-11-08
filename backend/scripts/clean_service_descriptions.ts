import prisma from "../src/utils/prisma";

async function cleanDatabase() {
  console.log("=== EYOB SALON: PURGING FILLER DESCRIPTIONS, TEST CATEGORIES & MOCK DATA ===");

  // 1. Purge long verbose description paragraphs from Service table
  const services = await prisma.service.findMany();
  console.log(`Found ${services.length} services to clean.`);

  for (const s of services) {
    // If description has more than 3 words or contains marketing boilerplate, set to null
    const wordCount = s.description ? s.description.trim().split(/\s+/).length : 0;
    const wordCountAm = s.descriptionAm ? s.descriptionAm.trim().split(/\s+/).length : 0;

    let newDesc = s.description;
    let newDescAm = s.descriptionAm;

    if (wordCount > 3 || (s.description && s.description.length > 25)) {
      newDesc = null;
    }
    if (wordCountAm > 3 || (s.descriptionAm && s.descriptionAm.length > 25)) {
      newDescAm = null;
    }

    if (newDesc !== s.description || newDescAm !== s.descriptionAm) {
      await prisma.service.update({
        where: { id: s.id },
        data: {
          description: newDesc,
          descriptionAm: newDescAm,
        },
      });
      console.log(`✓ Stripped long description for service: "${s.name}"`);
    }
  }

  // 2. Delete test categories with garbage names (e.g. ssssss, bbbbbb)
  const garbageCategories = await prisma.serviceCategory.findMany({
    where: {
      OR: [
        { name: { contains: "bbbbbb" } },
        { name: { contains: "ssssss" } },
        { name: { contains: "test", mode: "insensitive" } },
        { slug: { contains: "bbbbbb" } },
        { slug: { contains: "ssssss" } },
      ],
    },
    include: { services: true },
  });

  for (const cat of garbageCategories) {
    console.log(`Found garbage category: "${cat.name}" (${cat.id})`);
    // Unlink any services first
    if (cat.services.length > 0) {
      await prisma.service.updateMany({
        where: { categoryId: cat.id },
        data: { categoryId: null },
      });
    }
    await prisma.serviceCategory.delete({ where: { id: cat.id } });
    console.log(`✓ Deleted garbage category: "${cat.name}"`);
  }

  // 3. Reactivate legitimate beauty categories
  const legitimateCategories = [
    "Hair Styling & Couture",
    "Luxury Nail Architecture",
    "Holistic Spa & Scalp Therapy",
    "Advanced Aesthetics & Facials",
    "Bridal & Royal Special Occasions",
  ];

  await prisma.serviceCategory.updateMany({
    where: {
      name: { in: legitimateCategories },
    },
    data: {
      isActive: true,
      status: "APPROVED",
    },
  });
  console.log("✓ Reactivated legitimate salon categories.");

  // Also link services that match category name to their categoryId
  const allCats = await prisma.serviceCategory.findMany();
  for (const cat of allCats) {
    await prisma.service.updateMany({
      where: {
        category: cat.name,
        categoryId: null,
      },
      data: {
        categoryId: cat.id,
      },
    });
  }

  // 4. Clean Employee table (strip any mock bios or test employees)
  const testEmployees = await prisma.employee.findMany({
    where: {
      OR: [
        { firstName: { contains: "2031" } },
        { firstName: { contains: "8311" } },
        { lastName: { contains: "2031" } },
        { lastName: { contains: "8311" } },
      ],
    },
  });

  for (const emp of testEmployees) {
    await prisma.employeeService.deleteMany({ where: { employeeId: emp.id } });
    await prisma.employeeSchedule.deleteMany({ where: { employeeId: emp.id } });
    await prisma.employee.delete({ where: { id: emp.id } });
    console.log(`✓ Removed duplicate test employee: ${emp.firstName} ${emp.lastName}`);
  }

  console.log("=== CLEANUP FINISHED SUCCESSFULLY ===");
}

cleanDatabase()
  .catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
