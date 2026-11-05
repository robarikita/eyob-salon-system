import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with branches, owner, Phase 5 approved service rituals, and staff...");

  // 1. Branches
  const branchesData = [
    {
      name: "Eyob Beauty Salon - Bole Bulbula",
      slug: "bole-bulbula",
      phoneNumber: "+251911234567",
      addressLine: "Behind Morning Star Mall, Building 3, Ground Floor",
      city: "Addis Ababa",
      slotBufferMinutes: 10,
    },
    {
      name: "Kazanchis Branch",
      slug: "kazanchis",
      phoneNumber: "+251911234568",
      addressLine: "Near UNECA Compound, Floor 2, Premium Plaza",
      city: "Addis Ababa",
      slotBufferMinutes: 10,
    },
    {
      name: "CMC Branch",
      slug: "cmc",
      phoneNumber: "+251911234569",
      addressLine: "Tsehay Real Estate Square, Wing B, Suite 104",
      city: "Addis Ababa",
      slotBufferMinutes: 10,
    },
  ];

  const branches: any[] = [];
  for (const b of branchesData) {
    let branch = await prisma.branch.findUnique({ where: { slug: b.slug } });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          ...b,
          branchHours: {
            create: Array.from({ length: 7 }, (_, i) => ({
              dayOfWeek: i,
              openTime: "08:30",
              closeTime: "20:30",
              isClosed: false,
            })),
          },
        },
      });
      console.log(`Created branch: ${branch.name}`);
    }
    branches.push(branch);
  }

  const boleBranch = branches.find((b) => b.slug === "bole-bulbula") || branches[0];
  const kazanchisBranch = branches.find((b) => b.slug === "kazanchis") || branches[1];
  const cmcBranch = branches.find((b) => b.slug === "cmc") || branches[2];

  // 2. Owner User
  const ownerPassword = await bcrypt.hash("EyobOwner#2025!", 10);
  let owner = await prisma.user.findUnique({ where: { phone: "+251911000001" } });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        firstName: "Eyob",
        lastName: "Hailu",
        email: "owner@eyobbeauty.com",
        phone: "+251911000001",
        password: ownerPassword,
        role: UserRole.OWNER,
        branchId: boleBranch.id,
      },
    });
    console.log(`Created Owner user: ${owner.email}`);
  }

  // 3. Approved Service Rituals (Phase 5 Master Catalog)
  const approvedRituals = [
    {
      code: "SR-101",
      name: "Bridal Hair & Haute Couture Updo",
      amharicName: "የሙሽራ የፀጉር አሰራር እና ዘውድ ዝግጅት",
      category: "Bridal & Royal Special Occasions",
      subCategory: "Crown Wefts, Bridal Veil & Traditional Braids",
      description:
        "Imperial bridal coiffure engineered with heirloom braiding architectures, precious metals anchoring, and long-wear structural tension control for Habesha bridal ceremonies.",
      basePrice: 1200,
      durationMinutes: 90,
      preSetupBuffer: 10,
      turnaroundBuffer: 15,
      workstationType: "VIP Bridal Suite / Chair #01",
      minGuildRank: "Master Stylist (Guild Tier II or above)",
      requiresApprentice: true,
      requiredProtocols: ["Habesha Bridal Weaving Protocol", "Advanced Heated Styling Safety"],
      standardCommission: 18,
      depositAmount: 300,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBhXpuwSeMXFO5Iir8pCbkmEsFJocEEJCq4rXtkg62rfLuTS1gtFCs-AJwJGpg_6PccZ1uOlcwHMmH-Sx7CAFnk_WTRWg4FY2sG9R_rbdTMlrhKJ4UNMAV4G_QdLUqSw-rtAWiIMblVS_VnvqBBLcNfZCW8SMAJlHa4yPh6TNte3Mzy7C77rWlFPjjVxcnaAjrXhvsFof6lJPq8-5OSFIqIQILnNb1hs1irh_psfGiq",
      isActive: true,
      branchRules: {
        "bole-bulbula": { customPrice: 1200, requiredDeposit: 300, customTurnaround: 15, workstationLock: "VIP Bridal Suite #01", isActive: true },
        "kazanchis": { customPrice: 1400, requiredDeposit: 400, customTurnaround: 15, workstationLock: "VIP Terrace Suite", isActive: true },
        "cmc": { customPrice: 1150, requiredDeposit: 300, customTurnaround: 15, workstationLock: "Imperial Villa Suite #01", isActive: true },
      },
    },
    {
      code: "SR-102",
      name: "Keratin & Protein Botanical Therapy",
      amharicName: "የኬራቲን እና ፕሮቲን ህክምና",
      category: "Hair Styling & Couture",
      subCategory: "Organic Restorative Keratin Infusion",
      description:
        "Deep restructuring botanical treatment for heat protection and silk finish. Formulated for resilient curl preservation.",
      basePrice: 800,
      durationMinutes: 90,
      preSetupBuffer: 5,
      turnaroundBuffer: 15,
      workstationType: "Executive Styling Station",
      minGuildRank: "Senior Stylist (Guild Tier I)",
      requiresApprentice: false,
      requiredProtocols: ["Keratin Thermal Safety", "Micro-Mist Infusion Protocol"],
      standardCommission: 15,
      depositAmount: 200,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBgLRdIuRA57Y01URzQZ8KtdpszN5MvpOyQRS_UJXHCVUQkqL-9Mc77cMa5j8nDVoGMeRZ1fZRpvf0-el08rHeWWJTWyVIRQ4zhykyxTtwSL2v6JF3JARCHElX3Hsetob6oLFWvTvHjwGf79apeobD14JMJIIE4qXb3fuuIJmvTK3FKtOZZDM_sHwZEiTSNkPifzGR5AWgOzw0B1ke7H8MQBRYvdsdx31INVtlLU2Lp",
      isActive: true,
      branchRules: {
        "bole-bulbula": { customPrice: 800, requiredDeposit: 200, customTurnaround: 15, workstationLock: "Executive Chair 02", isActive: true },
        "kazanchis": { customPrice: 850, requiredDeposit: 200, customTurnaround: 15, workstationLock: "Executive Chair 01", isActive: true },
        "cmc": { customPrice: 800, requiredDeposit: 200, customTurnaround: 15, workstationLock: "Executive Chair 03", isActive: true },
      },
    },
    {
      code: "SR-201",
      name: "Royal 24k Gold & Frankincense Facial",
      amharicName: "የ24 ካራት ወርቅ እና ዕጣን ህክምና",
      category: "Advanced Aesthetics & Facials",
      subCategory: "Aesthetic Rejuvenation Sanctuary Protocol",
      description:
        "Ancient Ethiopian aromatic botanical steam, enzymatic exfoliation, and 24k gold leaf skin renewal.",
      basePrice: 650,
      durationMinutes: 75,
      preSetupBuffer: 10,
      turnaroundBuffer: 20,
      workstationType: "Aesthetic Facial & Laser Capsule",
      minGuildRank: "Senior Aesthetician",
      requiresApprentice: false,
      requiredProtocols: ["24k Foil Application", "Highland Frankincense Smudging"],
      standardCommission: 20,
      depositAmount: 150,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDNo9MjN3nAvZFh0hyh3DAiKPcHaRz3aEnqgv-6Q6JBY9BPqpyACVfA60UzPIOspNjbALiENJi1eUv5HXpi9h3PjwqGnUA-OkzUSed-ehbF0pio4yK2Nu7wG8Bslh3pbr_vKzON3DDyZpbhgIReWHB8ubKWvTGrPkbS9S6JDQslbY7p-1d4326t9-Fh9W62WL-Vlv_vevplDo3vbLDdWlSorFSNUpaSUvaVwawtzmvC",
      isActive: true,
      branchRules: {
        "bole-bulbula": { customPrice: 650, requiredDeposit: 150, customTurnaround: 20, workstationLock: "Aesthetic Pod 01", isActive: true },
        "kazanchis": { customPrice: 700, requiredDeposit: 200, customTurnaround: 20, workstationLock: "Laser & Skin Chamber", isActive: true },
        "cmc": { customPrice: 650, requiredDeposit: 150, customTurnaround: 20, workstationLock: "Aesthetic Pod 02", isActive: false }, // Paused
      },
    },
    {
      code: "SR-305",
      name: "Signature Scalp Detox & Herbal Rinse",
      amharicName: "የስካልፕ ዲቶክስ እና የእፅዋት ማጠቢያ",
      category: "Holistic Spa & Scalp Therapy",
      subCategory: "Addis Highland Botanic Essential Wash",
      description:
        "Aromatherapy scalp massage with Habesha herbal infusions and pressure point therapy.",
      basePrice: 450,
      durationMinutes: 45,
      preSetupBuffer: 5,
      turnaroundBuffer: 10,
      workstationType: "Sanctuary Wash & Aromatherapy Bar",
      minGuildRank: "Certified Stylist",
      requiresApprentice: false,
      requiredProtocols: ["Scalp Acupressure Protocol", "Botanical Extraction Decoction"],
      standardCommission: 15,
      depositAmount: 100,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDs1_YcNDYgAMGBvABmtoW1Uf8SRqTCWZfJNhnf5lcAaJh4j9TaCfqT8sUlpy6wq8G-mWw5l2HUYPgRuS4pPCPN4lkMtFnvr4adZrKDDe7EclL9CQ5oIvzTu4nFxPKiPhHB4OEsMRJy33INKwCmJiB_pMEruLOzuTi3F5SJX1Sx_-A4JTxpojJefVZdI2h8-_vf70S4UtZA7UZk4ivWELG3wLEAfzKpi9J-AqrJ-SjY",
      isActive: true,
      branchRules: {
        "bole-bulbula": { customPrice: 450, requiredDeposit: 100, customTurnaround: 10, workstationLock: "Wash Bar Chair 01", isActive: true },
        "kazanchis": { customPrice: 450, requiredDeposit: 100, customTurnaround: 10, workstationLock: "Hydro Wash Bar", isActive: true },
        "cmc": { customPrice: 400, requiredDeposit: 100, customTurnaround: 10, workstationLock: "Botanical Sink 01", isActive: true },
      },
    },
    {
      code: "SR-402",
      name: "Velvet Gel Sculpture & Russian Manicure",
      amharicName: "ቬልቬት ጄል ሜኒኪውር",
      category: "Luxury Nail Architecture",
      subCategory: "Precision Dry Manicure & Architecture",
      description:
        "Precision cuticle treatment, almond tip extension, and custom metallic foil art.",
      basePrice: 350,
      durationMinutes: 60,
      preSetupBuffer: 5,
      turnaroundBuffer: 15,
      workstationType: "Imperial Nail & Pedicure Lounge",
      minGuildRank: "Nail Artisan",
      requiresApprentice: false,
      requiredProtocols: ["E-File Safety Protocol", "Sanitization & Autoclave Protocol"],
      standardCommission: 15,
      depositAmount: 100,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB0xhQ9bDZ39TX8q23OhQv2e0DBdyo1mc2PXVyWx2TJ0WAAxhmDnObC7y0KLKRYCC6LfEH_mXnSqlpS2ObQYAG8l_WwNaIEvUBa0mrvPW-lZm1EK9iYKsTXV0B0D7WIKOcAVZDlTYYCWhkyqnLe0NJxjQJ01b99NwVJ2OJ8hi7gKTgDRJoOADJFkkrDPN8u08g5OULe_CFgug00PBCVY3-XS7PuVJP1PiDCpH8P-iwI",
      isActive: true,
      branchRules: {
        "bole-bulbula": { customPrice: 350, requiredDeposit: 100, customTurnaround: 15, workstationLock: "Nail Pod 03", isActive: true },
        "kazanchis": { customPrice: 380, requiredDeposit: 100, customTurnaround: 15, workstationLock: "Nail Lounge Suite A", isActive: true },
        "cmc": { customPrice: 350, requiredDeposit: 100, customTurnaround: 15, workstationLock: "Nail Pod 01", isActive: true },
      },
    },
    {
      code: "SR-109",
      name: "Autumn Argan Oil Thermal Infusion",
      amharicName: "የመኸር አርጋን ቴርማል ቅባት",
      category: "Hair Styling & Couture",
      subCategory: "Seasonal Botanical Steaming",
      description:
        "Seasonal heat activation treatment utilizing organic cold-pressed argan oil. Preserved for recurring seasonal releases.",
      basePrice: 500,
      durationMinutes: 50,
      preSetupBuffer: 0,
      turnaroundBuffer: 15,
      workstationType: "Thermal Steaming Pod",
      minGuildRank: "Stylist",
      requiresApprentice: false,
      requiredProtocols: ["Thermal Safety Protocol"],
      standardCommission: 12,
      depositAmount: 100,
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD8lSi98iUXQxqtJrWBNEB4REAGocU--PAaSh2KClbJIX4JzbM75EEM_SvDx8XfVgLOqsVkddtJ_zeWyBHcOA5pYrG3cOSpGTXYBas1IrWoxr-FeFyeLxHjgcYFc2VWvIki9qBXoBmbjl0xAzWVDvuQcddtVQxn2icwtAzxMnSOMwPp38D-_C1pbZAAhXWGsM5fyhH8LEFkFEik98YJvdB9CmDj857rs-dXAQvxWtWb",
      isActive: false, // Inactive seasonal
      branchRules: {
        "bole-bulbula": { customPrice: 500, requiredDeposit: 100, customTurnaround: 15, workstationLock: "Steaming Pod 01", isActive: false },
        "kazanchis": { customPrice: 520, requiredDeposit: 100, customTurnaround: 15, workstationLock: "Thermal Chamber", isActive: false },
        "cmc": { customPrice: 500, requiredDeposit: 100, customTurnaround: 15, workstationLock: "Steaming Pod 02", isActive: false },
      },
    },
  ];

  const seededServices: any[] = [];

  for (const ritual of approvedRituals) {
    const { branchRules, ...serviceData } = ritual;
    const service = await prisma.service.upsert({
      where: { code: ritual.code },
      update: {
        name: serviceData.name,
        amharicName: serviceData.amharicName,
        category: serviceData.category,
        subCategory: serviceData.subCategory,
        description: serviceData.description,
        basePrice: serviceData.basePrice,
        durationMinutes: serviceData.durationMinutes,
        preSetupBuffer: serviceData.preSetupBuffer,
        turnaroundBuffer: serviceData.turnaroundBuffer,
        workstationType: serviceData.workstationType,
        minGuildRank: serviceData.minGuildRank,
        requiresApprentice: serviceData.requiresApprentice,
        requiredProtocols: serviceData.requiredProtocols,
        standardCommission: serviceData.standardCommission,
        depositAmount: serviceData.depositAmount,
        imageUrl: serviceData.imageUrl,
        isActive: serviceData.isActive,
      },
      create: {
        code: serviceData.code,
        name: serviceData.name,
        amharicName: serviceData.amharicName,
        category: serviceData.category,
        subCategory: serviceData.subCategory,
        description: serviceData.description,
        basePrice: serviceData.basePrice,
        durationMinutes: serviceData.durationMinutes,
        preSetupBuffer: serviceData.preSetupBuffer,
        turnaroundBuffer: serviceData.turnaroundBuffer,
        workstationType: serviceData.workstationType,
        minGuildRank: serviceData.minGuildRank,
        requiresApprentice: serviceData.requiresApprentice,
        requiredProtocols: serviceData.requiredProtocols,
        standardCommission: serviceData.standardCommission,
        depositAmount: serviceData.depositAmount,
        imageUrl: serviceData.imageUrl,
        isActive: serviceData.isActive,
      },
    });

    console.log(`Upserted Master Ritual: ${service.code} — ${service.name}`);
    seededServices.push(service);

    // Provision BranchService rules for Bole, Kazanchis, and CMC
    for (const [slug, rule] of Object.entries(branchRules)) {
      const targetBranch = branches.find((b) => b.slug === slug);
      if (targetBranch) {
        await prisma.branchService.upsert({
          where: {
            branchId_serviceId: {
              branchId: targetBranch.id,
              serviceId: service.id,
            },
          },
          update: {
            customPrice: rule.customPrice,
            requiredDeposit: rule.requiredDeposit,
            customTurnaround: rule.customTurnaround,
            workstationLock: rule.workstationLock,
            isActive: rule.isActive,
          },
          create: {
            branchId: targetBranch.id,
            serviceId: service.id,
            customPrice: rule.customPrice,
            requiredDeposit: rule.requiredDeposit,
            customTurnaround: rule.customTurnaround,
            workstationLock: rule.workstationLock,
            isActive: rule.isActive,
          },
        });
      }
    }
  }

  // 4. Sample Specialists
  const sampleStaff = [
    {
      fullName: "Sara Ahmed",
      amharicName: "ሳራ አህመድ",
      phone: "+251911234567",
      email: "sara.ahmed@eyobbeauty.com",
      branchId: boleBranch.id,
      ritualTitle: "Senior Hair Stylist",
      employmentType: "Full-Time (40 hrs/wk)",
      workstation: "Chair 04 — VIP Styling Suite A",
      baseSalary: 12000,
      commissionRate: 15,
      status: true,
      serviceCodes: ["SR-101", "SR-102"],
    },
    {
      fullName: "Helen Tesfaye",
      amharicName: "ሔለን ተስፋዬ",
      phone: "+251928841920",
      email: "helen.t@eyobbeauty.com",
      branchId: kazanchisBranch.id,
      ritualTitle: "Master Makeup Artist",
      employmentType: "Full-Time (40 hrs/wk)",
      workstation: "Suite 02 — Editorial Glam",
      baseSalary: 14000,
      commissionRate: 18,
      status: true,
      serviceCodes: ["SR-101", "SR-201"],
    },
    {
      fullName: "Tigist Gidey",
      amharicName: "ትዕግስት ግደይ",
      phone: "+251934009811",
      email: "tigist.g@eyobbeauty.com",
      branchId: boleBranch.id,
      ritualTitle: "Nail Care Specialist",
      employmentType: "Full-Time (40 hrs/wk)",
      workstation: "Station 03 — Bio-Care Nail Bar",
      baseSalary: 9500,
      commissionRate: 12,
      status: true,
      serviceCodes: ["SR-402"],
    },
    {
      fullName: "Meron Tadesse",
      amharicName: "ሜሮን ታደሰ",
      phone: "+251917552100",
      email: "meron.t@eyobbeauty.com",
      branchId: boleBranch.id,
      ritualTitle: "Branch Lead & Cosmetologist",
      employmentType: "Full-Time (44 hrs/wk)",
      workstation: "Suite 01 — Aesthetic Clinic",
      baseSalary: 18000,
      commissionRate: 20,
      status: true,
      serviceCodes: ["SR-201", "SR-305"],
    },
    {
      fullName: "Bethel Alemu",
      amharicName: "ቤቴል አለሙ",
      phone: "+251942210045",
      email: "bethel.a@eyobbeauty.com",
      branchId: cmcBranch.id,
      ritualTitle: "Senior Colorist",
      employmentType: "Full-Time (40 hrs/wk)",
      workstation: "Balayage Chair 02",
      baseSalary: 13000,
      commissionRate: 15,
      status: true,
      serviceCodes: ["SR-101", "SR-102"],
    },
  ];

  for (const staff of sampleStaff) {
    let emp = await prisma.employee.findFirst({
      where: { phone: staff.phone },
    });

    if (!emp) {
      const parts = staff.fullName.split(" ");
      emp = await prisma.employee.create({
        data: {
          firstName: parts[0],
          lastName: parts[1] || parts[0],
          amharicName: staff.amharicName,
          phone: staff.phone,
          email: staff.email,
          branchId: staff.branchId,
          ritualTitle: staff.ritualTitle,
          employmentType: staff.employmentType,
          workstation: staff.workstation,
          baseSalary: staff.baseSalary,
          commissionRate: staff.commissionRate,
          status: staff.status,
          joinedDate: new Date("2023-01-15"),
          schedules: {
            create: Array.from({ length: 7 }, (_, dayOfWeek) => ({
              dayOfWeek,
              startTime: "08:30",
              endTime: "17:30",
              breakStartTime: "13:00",
              breakEndTime: "14:00",
              isWorking: dayOfWeek !== 1, // Mon off
            })),
          },
        },
      });
      console.log(`Created sample specialist: ${emp.firstName} ${emp.lastName}`);
    }

    // Assign designated rituals
    for (const code of staff.serviceCodes) {
      const s = seededServices.find((item) => item.code === code);
      if (s) {
        await prisma.employeeService.upsert({
          where: {
            employeeId_serviceId: {
              employeeId: emp.id,
              serviceId: s.id,
            },
          },
          update: {
            customDurationMinutes: s.durationMinutes,
            customCommissionRate: staff.commissionRate,
          },
          create: {
            employeeId: emp.id,
            serviceId: s.id,
            customDurationMinutes: s.durationMinutes,
            customCommissionRate: staff.commissionRate,
          },
        });
      }
    }
  }

  // Ensure all legacy services have standardCommission backfilled
  await prisma.service.updateMany({
    where: { standardCommission: null },
    data: { standardCommission: 15.00 },
  });

  console.log("Database seeded successfully with Phase 5 rituals & governance.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
