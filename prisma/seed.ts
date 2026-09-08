import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding…");

  const admin = await prisma.user.upsert({
    where: { email: "info@bunyandigital.co" },
    update: {},
    create: {
      email: "info@bunyandigital.co",
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
    { name: "eBay Listings", colorHex: "#F0B27A" },
    { name: "eBay Listings + Messages", colorHex: "#E08245" },
    { name: "eBay Full Operations", colorHex: "#B5651D" },
    { name: "eBay Full Management + Ads", colorHex: "#8B4513" },
    { name: "eBay Listing Transfer (one-time)", colorHex: "#8A97A3" },
    { name: "Website Management", colorHex: "#7FA8D9" },
    { name: "Ecommerce Website Build", colorHex: "#5B87C4" },
    { name: "Portfolio Website Build", colorHex: "#A8C4E0" },
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
  const byName = new Map(serviceTypes.map((s) => [s.name, s]));
  const service = (name: string) => {
    const found = byName.get(name);
    if (!found) throw new Error(`Seed service type not found: ${name}`);
    return found;
  };
  const ebayMessages = service("eBay Listings + Messages");
  const ebayFullOps = service("eBay Full Operations");
  const ebayTransfer = service("eBay Listing Transfer (one-time)");
  const website = service("Website Management");
  const ads = service("Paid Ads");
  const seo = service("SEO");
  const content = service("Content & Social");

  const clientDefs = [
    {
      name: "Aria Home Goods",
      companyName: "Aria Home Goods Ltd",
      contactName: "Priya Shah",
      contactEmail: "priya@ariahome.co.uk",
      status: "ACTIVE" as const,
      services: [
        { serviceType: ebayMessages, priceValue: 129, status: "ACTIVE" as const, billingType: "MONTHLY" as const },
        { serviceType: content, priceValue: 400, status: "ACTIVE" as const, billingType: "MONTHLY" as const },
        { serviceType: ebayTransfer, priceValue: 50, status: "COMPLETED" as const, billingType: "ONE_OFF" as const },
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
        { serviceType: website, priceValue: 600, status: "ACTIVE" as const, billingType: "MONTHLY" as const },
        { serviceType: seo, priceValue: 500, status: "ACTIVE" as const, billingType: "MONTHLY" as const },
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
        { serviceType: ebayFullOps, priceValue: 229, status: "ACTIVE" as const, billingType: "MONTHLY" as const },
        { serviceType: ads, priceValue: 550, status: "ACTIVE" as const, billingType: "MONTHLY" as const },
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
      services: [{ serviceType: website, priceValue: 450, status: "PAUSED" as const, billingType: "MONTHLY" as const }],
      assignMember: false,
    },
  ];

  const jobsByStage: Record<string, string[]> = {
    BACKLOG: ["Audit current listing titles", "Plan Q3 content calendar"],
    IN_PROGRESS: ["Optimise top 10 product listings", "Rebuild homepage hero section"],
    IN_REVIEW: ["Client sign-off on new banner ads"],
    DONE: ["Migrate store to new template", "Fix broken checkout redirect"],
  };

  const taskTitles = [
    "Draft copy",
    "Get client approval",
    "Publish live",
    "QA on mobile",
    "Update tracking sheet",
  ];

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
          priceValue: s.priceValue,
          status: s.status,
          billingType: s.billingType,
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
      let jobPos = 0;
      for (const [stage, titles] of Object.entries(jobsByStage)) {
        for (const title of titles) {
          const dueDate =
            stage !== "DONE"
              ? new Date(Date.now() + (Math.random() * 20 - 5) * 24 * 60 * 60 * 1000)
              : undefined;
          const assignedToId = def.assignMember && Math.random() > 0.4 ? member.id : admin.id;

          const job = await prisma.job.create({
            data: {
              clientId: client.id,
              clientServiceId: createdServices[0]?.id,
              title: `${title} — ${def.name}`,
              stage: stage as "BACKLOG" | "IN_PROGRESS" | "IN_REVIEW" | "DONE",
              position: jobPos * 1024,
              priority: ["LOW", "MEDIUM", "HIGH", "URGENT"][Math.floor(Math.random() * 4)] as
                | "LOW"
                | "MEDIUM"
                | "HIGH"
                | "URGENT",
              recurrence: ["NONE", "NONE", "DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY"][
                Math.floor(Math.random() * 6)
              ] as "NONE" | "DAILY" | "WEEKLY" | "FORTNIGHTLY" | "MONTHLY",
              assignedToId,
              dueDate,
              completedAt: stage === "DONE" ? new Date() : undefined,
              activities: {
                create: {
                  clientId: client.id,
                  type: "CREATED",
                  message: `Job "${title}" created`,
                  userId: admin.id,
                },
              },
            },
          });
          jobPos++;

          const numTasks = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < numTasks; i++) {
            const done = stage === "DONE" || (stage === "IN_PROGRESS" && Math.random() > 0.5);
            const task = await prisma.task.create({
              data: {
                jobId: job.id,
                title: taskTitles[i % taskTitles.length],
                position: i * 1024,
                done,
                completedAt: done ? new Date() : undefined,
              },
            });

            if (done || Math.random() > 0.5) {
              await prisma.timeEntry.create({
                data: {
                  taskId: task.id,
                  userId: assignedToId,
                  minutes: [15, 30, 45, 60, 90, 120][Math.floor(Math.random() * 6)],
                  workDate: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
                },
              });
            }
          }
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
