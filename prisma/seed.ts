/**
 * Fixed-password seed for the TEST phase.
 *
 * Creates the super admin, one test admin, and a few sample students with
 * published profiles and projects so the screens have something to show. The
 * email verification code is built later; here passwords are fixed and known.
 *
 * These accounts are NON-PRODUCTION. Before the real launch this seed is
 * removed, email-code sign-in is turned on, and real passwords replace these.
 */
import { PrismaClient, type Category, type Domain } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { SUPER_ADMIN_EMAIL } from "../lib/constants";

const prisma = new PrismaClient();

// One known password for every seeded account (test only).
const TEST_PASSWORD = "learnbay-test-2026";

type SeedProject = {
  slug: string;
  title: string;
  description: string;
  category: Category;
  toolsText: string;
  domain: Domain;
  liveUrl: string;
};

type SeedStudent = {
  slug: string;
  email: string;
  name: string;
  headline: string;
  about: string;
  courseCompleted:
    | "DATA_SCIENCE"
    | "BUSINESS_ANALYTICS_AND_DATA_ANALYTICS"
    | "CLOUD_AND_DEVOPS"
    | "GENERATIVE_AI_AND_AGENTIC_AI"
    | "SOFTWARE_DEVELOPMENT";
  projects: SeedProject[];
};

const STUDENTS: SeedStudent[] = [
  {
    slug: "riya",
    email: "riya.sharma@example.com",
    name: "Riya Sharma",
    headline: "Data Scientist · 3 years · BFSI",
    about:
      "Data scientist focused on risk and customer analytics in banking. I like turning messy transaction data into models a team can actually act on.",
    courseCompleted: "DATA_SCIENCE",
    projects: [
      {
        slug: "churn-predictor",
        title: "Churn Predictor",
        description:
          "Predicts which telecom customers are likely to cancel their plan and shows the factors behind each prediction.",
        category: "ANALYTICS",
        toolsText: "Python, scikit-learn, Pandas, Streamlit",
        domain: "BFSI",
        liveUrl: "https://churn-predictor.streamlit.app",
      },
      {
        slug: "resume-screener",
        title: "Resume Screener",
        description:
          "Ranks resumes against a job description using text embeddings and highlights the skills each candidate is missing.",
        category: "GENERATIVE_AI",
        toolsText: "Python, Sentence Transformers, FastAPI",
        domain: "HUMAN_RESOURCES",
        liveUrl: "https://resume-screener-demo.vercel.app",
      },
    ],
  },
  {
    slug: "meera",
    email: "meera.nair@example.com",
    name: "Meera Nair",
    headline: "ML Engineer · 6 years · Healthcare Services",
    about:
      "Machine-learning engineer working on clinical text. I build tools that save clinicians time without getting in the way of their judgement.",
    courseCompleted: "GENERATIVE_AI_AND_AGENTIC_AI",
    projects: [
      {
        slug: "clinical-notes-summariser",
        title: "Clinical Notes Summariser",
        description:
          "Turns long doctor's notes into a structured summary of diagnoses, medication and follow-ups, using a fine-tuned language model.",
        category: "GENERATIVE_AI",
        toolsText: "Python, Hugging Face, LangChain, FastAPI",
        domain: "HEALTHCARE_SERVICES",
        liveUrl: "https://clinical-notes-summariser.example.app",
      },
    ],
  },
  {
    slug: "imran",
    email: "imran.sheikh@example.com",
    name: "Imran Sheikh",
    headline: "Analytics Lead · 8 years · Operations",
    about:
      "Operations analyst turned data engineer. I care about forecasts that hold up in the real world and dashboards people trust.",
    courseCompleted: "BUSINESS_ANALYTICS_AND_DATA_ANALYTICS",
    projects: [
      {
        slug: "warehouse-demand-planner",
        title: "Warehouse Demand Planner",
        description:
          "Forecasts stock needs for each warehouse and flags items at risk of running out in the next two weeks.",
        category: "ANALYTICS",
        toolsText: "Python, Prophet, Pandas, Plotly Dash",
        domain: "OPERATIONS",
        liveUrl: "https://warehouse-demand-planner.example.app",
      },
    ],
  },
];

// One student still in Draft (not yet public) so the review flow has material.
const DRAFT_STUDENT: SeedStudent = {
  slug: "aditya",
  email: "aditya.verma@example.com",
  name: "Aditya Verma",
  headline: "Data Scientist · 5 years · BFSI",
  about: "Building a fraud-detection project; profile not submitted yet.",
  courseCompleted: "DATA_SCIENCE",
  projects: [
    {
      slug: "fraud-alert-monitor",
      title: "Fraud Alert Monitor",
      description:
        "Scores card transactions in real time and explains why a payment was flagged, so an analyst can clear or block it quickly.",
      category: "ANALYTICS",
      toolsText: "Python, LightGBM, Kafka, Streamlit",
      domain: "BFSI",
      liveUrl: "https://fraud-alert-monitor.example.app",
    },
  ],
};

async function upsertUser(
  email: string,
  name: string,
  role: "STUDENT" | "ADMIN" | "SUPER_ADMIN",
  passwordHash: string,
) {
  const e = email.toLowerCase();
  return prisma.user.upsert({
    where: { email: e },
    update: { name, role, status: "ACTIVE", passwordHash },
    create: { email: e, name, role, status: "ACTIVE", passwordHash },
  });
}

async function seedStudent(
  s: SeedStudent,
  passwordHash: string,
  adminId: string,
  published: boolean,
) {
  const user = await upsertUser(s.email, s.name, "STUDENT", passwordHash);

  const profileData = {
    headline: s.headline,
    about: s.about,
    courseCompleted: s.courseCompleted,
    state: (published ? "PUBLISHED" : "DRAFT") as "PUBLISHED" | "DRAFT",
  };
  const profile = await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: profileData,
    create: { id: `seed-prof-${s.slug}`, userId: user.id, ...profileData },
  });

  if (published) {
    const snapshot = {
      headline: s.headline,
      about: s.about,
      courseCompleted: s.courseCompleted,
    };
    const pv = await prisma.profileVersion.upsert({
      where: { id: `seed-pv-${s.slug}` },
      update: { snapshot, reviewState: "APPROVED", reviewedById: adminId },
      create: {
        id: `seed-pv-${s.slug}`,
        profileId: profile.id,
        snapshot,
        reviewState: "APPROVED",
        reviewedById: adminId,
      },
    });
    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: { approvedVersionId: pv.id },
    });
  }

  for (const p of s.projects) {
    const base = {
      title: p.title,
      description: p.description,
      category: p.category,
      toolsText: p.toolsText,
      domain: p.domain,
      liveUrl: p.liveUrl,
      state: (published ? "PUBLISHED" : "DRAFT") as "PUBLISHED" | "DRAFT",
      linkOk: published ? true : null,
      linkLastCheckedAt: published ? new Date() : null,
      linkLastWorkedAt: published ? new Date() : null,
    };
    const project = await prisma.project.upsert({
      where: { id: `seed-pr-${p.slug}` },
      update: base,
      create: { id: `seed-pr-${p.slug}`, profileId: profile.id, ...base },
    });

    if (published) {
      const snapshot = {
        title: p.title,
        description: p.description,
        category: p.category,
        toolsText: p.toolsText,
        domain: p.domain,
        liveUrl: p.liveUrl,
      };
      const pjv = await prisma.projectVersion.upsert({
        where: { id: `seed-pjv-${p.slug}` },
        update: { snapshot, reviewState: "APPROVED", reviewedById: adminId },
        create: {
          id: `seed-pjv-${p.slug}`,
          projectId: project.id,
          snapshot,
          reviewState: "APPROVED",
          reviewedById: adminId,
        },
      });
      await prisma.project.update({
        where: { id: project.id },
        data: { approvedVersionId: pjv.id },
      });
    }
  }
}

async function main() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.FIXED_PASSWORD_TEST_MODE !== "true"
  ) {
    throw new Error(
      "Refusing to run the fixed-password seed in production. Set FIXED_PASSWORD_TEST_MODE=true only in the test phase.",
    );
  }

  const passwordHash = await hashPassword(TEST_PASSWORD);

  const superAdmin = await upsertUser(
    SUPER_ADMIN_EMAIL,
    "Spandan",
    "SUPER_ADMIN",
    passwordHash,
  );
  const admin = await upsertUser(
    "karan.mehta@example.com",
    "Karan Mehta",
    "ADMIN",
    passwordHash,
  );

  for (const s of STUDENTS) {
    await seedStudent(s, passwordHash, admin.id, true);
  }
  await seedStudent(DRAFT_STUDENT, passwordHash, admin.id, false);

  const projectCount = STUDENTS.reduce((n, s) => n + s.projects.length, 0);

  /* eslint-disable no-console */
  console.log("\nSeed complete (TEST accounts — fixed passwords, not for production):");
  console.log("  password for every account:", TEST_PASSWORD);
  console.log("  super admin:", superAdmin.email);
  console.log("  admin:      ", admin.email);
  console.log(
    "  students:   ",
    STUDENTS.map((s) => s.email).join(", "),
    `(+1 draft: ${DRAFT_STUDENT.email})`,
  );
  console.log(
    `  published:   ${STUDENTS.length} profiles, ${projectCount} projects; 1 draft profile/project.\n`,
  );
  /* eslint-enable no-console */
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
