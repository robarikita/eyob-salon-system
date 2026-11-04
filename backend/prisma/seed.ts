import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with branches, owner, services, and staff...");

  // 1. Branches
  const branchesData = [
    {
      name: "Bole Bulbula Branch",
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

  // 2. Owner user
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
        branchId: branches[0].id,
      },
    });
    console.log(`Created Owner user: ${owner.email}`);
  }

  // 3. Catalog Services per branch
  const servicesTemplate = [
    { title: "Hair Styling & Couture Cut", price: 500, duration: 60, depositAmount: 100 },
    { title: "Bridal Hair & Haute Couture Updo", price: 1200, duration: 90, depositAmount: 250 },
    { title: "Keratin & Protein Therapy", price: 800, duration: 90, depositAmount: 200 },
    { title: "Deep Scalp Detox & Botanical Ritual", price: 400, duration: 45, depositAmount: 100 },
    { title: "Facial Rejuvenation Ritual", price: 500, duration: 60, depositAmount: 100 },
    { title: "Signature Gel Manicure", price: 300, duration: 40, depositAmount: 50 },
  ];

  for (const branch of branches) {
    for (const st of servicesTemplate) {
      const existing = await prisma.service.findFirst({
        where: { branchId: branch.id, title: st.title },
      });
      if (!existing) {
        await prisma.service.create({
          data: {
            title: st.title,
            branchId: branch.id,
            price: st.price,
            duration: st.duration,
            depositAmount: st.depositAmount,
          },
        });
      }
    }
  }

  // 4. Sample Specialists
  const boleBranch = branches.find((b) => b.slug === "bole-bulbula") || branches[0];
  const kazanchisBranch = branches.find((b) => b.slug === "kazanchis") || branches[0];
  const cmcBranch = branches.find((b) => b.slug === "cmc") || branches[0];

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
    },
  ];

  for (const staff of sampleStaff) {
    const existing = await prisma.employee.findFirst({
      where: { phone: staff.phone },
    });

    if (!existing) {
      const parts = staff.fullName.split(" ");
      const emp = await prisma.employee.create({
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

      // Assign branch services
      const branchServices = await prisma.service.findMany({
        where: { branchId: staff.branchId },
        take: 4,
      });

      for (const bs of branchServices) {
        await prisma.employeeService.create({
          data: {
            employeeId: emp.id,
            serviceId: bs.id,
            customDurationMinutes: bs.duration,
            customCommissionRate: staff.commissionRate,
          },
        });
      }

      console.log(`Created sample specialist: ${emp.firstName} ${emp.lastName}`);
    }
  }

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
