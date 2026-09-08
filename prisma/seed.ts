import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding…");

  const admin = await prisma.user.upsert({
    where: { email: "director@naturalandnaqi.com" },
    update: {},
    create: {
      email: "director@naturalandnaqi.com",
      name: "Director",
      role: "ADMIN",
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "team@bunyandigital.co" },
    update: {},
    create: {
      email: "team@bunyandigital.co",
      name: "Sam Carter",
      role: "MEMBER",
    },
  });

  const serviceDefs = [
    { name: "eBay Management", colorHex: "#E08245" },
    { name: "Website Management", colorHex: "#7FA8D9" },
    { name: "Paid Ads", colorHex: "#C1622B" },
    { name: "SEO", colorHex: "#7FBFA0" },
    { name: "Content & Social", colorHex: "#9DBADA" },
  ];

  const serviceTypes = [];
  for (const [i, def] of serviceDefs.entries()) {
    const st = await prisma.serviceType.upsert({
      where: { name: def.name },
      update: {},
      create: { ...def, order: i },
    });
    serviceTypes.push(st);
  }
  const [ebay, website, ads, seo, content] = serviceTypes;

  const clientDefs = [
    {
      name: "Aria Home Goods",
      companyName: "Aria Home Goods Ltd",
      contactName: "Priya Shah",
      contactEmail: "priya@ariahome.co.uk",
      status: "ACTIVE" as const,
      services: [
        { serviceType: ebay, monthlyValue: 850, status: "ACTIVE" as const },
        { serviceType: content, monthlyValue: 400, status: "ACTIVE" as const },
      ],
      assignMember: true,
    },
    {
      name: "Northfield Outdoors",
      companyName: "Northfield Outdoors Ltd",
      contactName: "Tom Reilly",
      contactEmail: "tom@northfieldoutdoors.com",
      status: "ACTIVE" as const,
      services: [
        { serviceType: website, monthlyValue: 600, status: "ACTIVE" as const },
        { serviceType: seo, monthlyValue: 500, status: "ACTIVE" as const },
      ],
      assignMember: true,
    },
    {
      name: "Little Wren Baby Co",
      companyName: null,
      contactName: "Amara Okafor",
      contactEmail: "amara@littlewren.co",
      status: "ACTIVE" as const,
      services: [
        { serviceType: ebay, monthlyValue: 700, status: "ACTIVE" as const },
        { serviceType: ads, monthlyValue: 550, status: "ACTIVE" as const },
      ],
      assignMember: false,
    },
    {
      name: "Castle & Vine",
      companyName: "Castle & Vine Interiors",
      contactName: "James Whitfield",
      contactEmail: "james@castlevine.co.uk",
      status: "LEAD" as const,
      services: [],
      assignMember: false,
    },
    {
      name: "Solstice Skincare",
      companyName: "Solstice Skincare Ltd",
      contactName: "Nadia Hussain",
      contactEmail: "nadia@solsticeskin.com",
      status: "PAUSED" as const,
      services: [{ serviceType: website, monthlyValue: 450, status: "PAUSED" as const }],
      assignMember: false,
    },
  ];

  const taskTitles: Record<string, string[]> = {
    BACKLOG: ["Audit current listing titles", "Plan Q3 content calendar", "Research competitor pricing"],
    IN_PROGRESS: ["Optimise top 10 product listings", "Rebuild homepage hero section", "Set up abandoned cart flow"],
    IN_REVIEW: ["Client sign-off on new banner ads", "Review keyword targeting doc"],
    DONE: ["Migrate store to new template", "Fix broken checkout redirect", "Publish September newsletter"],
  };

  let clientIndex = 0;
  for (const def of clientDefs) {
    const client = await prisma.client.upsert({
      where: { id: `seed-client-${clientIndex}` },
      update: {},
      create: {
        id: `seed-client-${clientIndex}`,
        name: def.name,
        companyName: def.companyName,
        contactName: def.contactName,
        contactEmail: def.contactEmail,
        status: def.status,
        activities: { create: { type: "CREATED", message: `Client created by ${admin.name}`, userId: admin.id } },
      },
    });
    clientIndex++;

    const createdServices = [];
    for (const s of def.services) {
      const cs = await prisma.clientService.create({
        data: {
          clientId: client.id,
          serviceTypeId: s.serviceType.id,
          monthlyValue: s.monthlyValue,
          status: s.status,
          startDate: new Date(),
        },
      });
      createdServices.push(cs);
    }

    if (def.assignMember) {
      await prisma.clientMember.upsert({
        where: { clientId_userId: { clientId: client.id, userId: member.id } },
        update: {},
        create: { clientId: client.id, userId: member.id },
      });
    }

    if (def.services.length > 0) {
      let pos = 0;
      for (const [stage, titles] of Object.entries(taskTitles)) {
        for (const title of titles.slice(0, stage === "DONE" ? 1 : 2)) {
          const dueDate =
            stage !== "DONE"
              ? new Date(Date.now() + (Math.random() * 20 - 5) * 24 * 60 * 60 * 1000)
              : undefined;
          await prisma.task.create({
            data: {
              clientId: client.id,
              clientServiceId: createdServices[0]?.id,
              title: `${title} — ${def.name}`,
              stage: stage as "BACKLOG" | "IN_PROGRESS" | "IN_REVIEW" | "DONE",
              position: pos * 1024,
              priority: ["LOW", "MEDIUM", "HIGH", "URGENT"][Math.floor(Math.random() * 4)] as
                | "LOW"
                | "MEDIUM"
                | "HIGH"
                | "URGENT",
              assignedToId: def.assignMember && Math.random() > 0.4 ? member.id : admin.id,
              dueDate,
              completedAt: stage === "DONE" ? new Date() : undefined,
              activities: {
                create: {
                  clientId: client.id,
                  type: "CREATED",
                  message: `Task "${title}" created`,
                  userId: admin.id,
                },
              },
            },
          });
          pos++;
        }
      }
    }
  }

  console.log("Seed complete.");
  console.log(`Admin: ${admin.email}`);
  console.log(`Member: ${member.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
