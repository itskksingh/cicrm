import { loadEnvConfig } from "@next/env";
const projectDir = process.cwd();
loadEnvConfig(projectDir);

import { PrismaClient, Priority, LeadStatus, Sender, CallOutcome, Role } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "../lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("🌱 Starting Database Seed Process...");

  // 1. Create or Login the Admin User via Supabase Auth
  const email = "hi@kksingh.dev";
  const password = "Kishan@293";
  let userId = "";

  console.log(`\n🔐 Authenticating primary user: ${email}`);
  
  // Try to login first (in case it already exists)
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInData?.user) {
    console.log("✅ User already exists in Supabase Auth, logged in.");
    userId = signInData.user.id;
  } else {
    // Need to sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (signUpError) {
      console.error("❌ Failed to create Supabase User:", signUpError.message);
      process.exit(1);
    }
    
    if (signUpData?.user) {
      console.log("✅ Successfully created new Supabase User.");
      userId = signUpData.user.id;
    }
  }

  // 2. Synchronize Internal Staff Record
  console.log("\n👨‍⚕️ Synchronizing Staff Record in Prisma...");
  
  await prisma.staff.upsert({
    where: { id: userId },
    update: {
      name: "K K Singh",
      phone: "+91 98765 43210",
      email: email,
      role: Role.ADMIN, // Making this user an Admin
      department: "Administration",
    },
    create: {
      id: userId,
      name: "K K Singh",
      phone: "+91 98765 43210",
      email: email,
      role: Role.ADMIN,
      department: "Administration",
    },
  });

  console.log("✅ Staff record synchronized.");

  // 3. Wiping Old Test Data
  console.log("\n🧹 Cleaning old test records...");
  await prisma.callLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.lead.deleteMany();
  console.log("✅ Old data cleared.");

  // 4. Generating Dummy Leads
  console.log("\n🧪 Injecting 15 Dummy Leads & Chat Histories...");

  const departments = ["Surgery", "Cardiology", "Orthopedics", "General", "Pediatrics"];
  const dummyLeads = [
    { name: "John Doe", phone: "+1 555-0101", age: 45, problem: "Severe chest pain", priority: Priority.HOT, status: LeadStatus.ASSIGNED },
    { name: "Alice Smith", phone: "+1 555-0102", age: 29, problem: "Routine checkup inquiry", priority: Priority.COLD, status: LeadStatus.NEW },
    { name: "Raj Sharma", phone: "+1 555-0103", age: 62, problem: "Knee joint swelling and pain", priority: Priority.WARM, status: LeadStatus.NEW },
    { name: "Emma Wilson", phone: "+1 555-0104", age: 34, problem: "Bleeding after minor fall", priority: Priority.HOT, status: LeadStatus.ASSIGNED },
    { name: "Michael Chang", phone: "+1 555-0105", age: 50, problem: "Consultation for bypass", priority: Priority.WARM, status: LeadStatus.NEW },
    { name: "Sarah Connor", phone: "+1 555-0106", age: 28, problem: "Vaccine availability", priority: Priority.COLD, status: LeadStatus.CLOSED },
    { name: "Robert Bruce", phone: "+1 555-0107", age: 71, problem: "Heart palpitations", priority: Priority.HOT, status: LeadStatus.ASSIGNED },
    { name: "Emily Blunt", phone: "+1 555-0108", age: 40, problem: "Lower back pain", priority: Priority.WARM, status: LeadStatus.NEW },
    { name: "Chris Evans", phone: "+1 555-0109", age: 35, problem: "Sports injury surgery pricing", priority: Priority.WARM, status: LeadStatus.NEW },
    { name: "Natalie Portman", phone: "+1 555-0110", age: 31, problem: "Visiting hours inquiry", priority: Priority.COLD, status: LeadStatus.NEW },
    { name: "Will Smith", phone: "+1 555-0111", age: 54, problem: "Sudden loss of vision", priority: Priority.HOT, status: LeadStatus.ASSIGNED },
    { name: "Mark Ruffalo", phone: "+1 555-0112", age: 45, problem: "Mild headache", priority: Priority.COLD, status: LeadStatus.NEW },
    { name: "Scarlett Johansson", phone: "+1 555-0113", age: 38, problem: "Migraine medication refill", priority: Priority.WARM, status: LeadStatus.NEW },
    { name: "Tom Holland", phone: "+1 555-0114", age: 26, problem: "Sprained ankle", priority: Priority.WARM, status: LeadStatus.NEW },
    { name: "Zendaya", phone: "+1 555-0115", age: 25, problem: "Fractured wrist", priority: Priority.HOT, status: LeadStatus.ASSIGNED },
  ];

  let leadCount = 0;
  for (const leadData of dummyLeads) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const assignedTo = leadData.status === LeadStatus.ASSIGNED || leadData.status === LeadStatus.CLOSED ? userId : null;

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        name: leadData.name,
        phone: leadData.phone,
        age: leadData.age,
        problem: leadData.problem,
        department: dept,
        priority: leadData.priority,
        status: leadData.status,
        assignedToId: assignedTo,
        aiSummary: `Patient might require immediate assistance based on symptoms related to ${dept}.`,
        aiConfidence: Math.random() * (0.99 - 0.75) + 0.75, // Random confidence between 75% and 99%
      },
    });

    // Create mock messages for each lead
    await prisma.message.createMany({
      data: [
        {
          leadId: lead.id,
          sender: Sender.USER,
          content: `Hi, I am reaching out regarding ${leadData.problem.toLowerCase()}. Can someone help?`,
          isRead: true,
        },
        {
          leadId: lead.id,
          sender: Sender.BOT,
          content: `Hello! I have noted your symptoms. Let me transfer you to our ${dept} department.`,
          isRead: true,
        },
      ],
    });

    // Give some leads unread messages
    if (leadData.priority === Priority.HOT || leadData.status === LeadStatus.NEW) {
      await prisma.message.create({
        data: {
          leadId: lead.id,
          sender: Sender.USER,
          content: `Is a doctor available to call me now?`,
          isRead: false,
        }
      });
    }

    // Add Call Logs for assigned or closed leads
    if (leadData.status === LeadStatus.CLOSED) {
      await prisma.callLog.create({
        data: {
          leadId: lead.id,
          staffId: userId,
          duration: Math.floor(Math.random() * 300) + 60, // 60s to 360s
          outcome: CallOutcome.CONVERTED,
          notes: "Patient booked consultation successfully.",
        }
      });
      // Increment call attempts
      await prisma.lead.update({
        where: { id: lead.id },
        data: { callAttempts: 1, lastCallAt: new Date() }
      });
    } else if (leadData.status === LeadStatus.ASSIGNED && Math.random() > 0.5) {
      await prisma.callLog.create({
        data: {
          leadId: lead.id,
          staffId: userId,
          duration: Math.floor(Math.random() * 60) + 10,
          outcome: CallOutcome.FOLLOW_UP,
          notes: "Patient asked to be called back later today.",
        }
      });
      await prisma.lead.update({
        where: { id: lead.id },
        data: { callAttempts: 1, lastCallAt: new Date() }
      });
    }

    leadCount++;
  }

  console.log(`✅ ${leadCount} Dummy Leads successfully injected into the database.`);
  console.log("🎉 Seeding complete! You can now check the dashboard.");
}

main()
  .catch((e) => {
    console.error("❌ Fatal Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
