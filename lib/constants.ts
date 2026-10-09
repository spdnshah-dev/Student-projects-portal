import type {
  Category,
  CourseCompleted,
  Domain,
  ItemState,
  Role,
} from "@prisma/client";

/**
 * Display labels for the fixed dropdown lists. The DB stores stable enum
 * identifiers; these map each to the exact wording shown in the UI (and used
 * in the design boards). Tools and frameworks is free text, so it has no list.
 */

export const CATEGORY_LABELS: Record<Category, string> = {
  ANALYTICS: "Analytics",
  SOFTWARE_DEVELOPMENT: "Software Development",
  CLOUD_AND_DEVOPS: "Cloud and DevOps",
  GENERATIVE_AI: "Generative AI",
  AGENTIC_AI: "Agentic AI",
};

export const COURSE_COMPLETED_LABELS: Record<CourseCompleted, string> = {
  DATA_SCIENCE: "Data Science",
  BUSINESS_ANALYTICS_AND_DATA_ANALYTICS:
    "Business Analytics and Data Analytics",
  CLOUD_AND_DEVOPS: "Cloud and DevOps",
  GENERATIVE_AI_AND_AGENTIC_AI: "Generative AI and Agentic AI",
  SOFTWARE_DEVELOPMENT: "Software Development",
};

export const DOMAIN_LABELS: Record<Domain, string> = {
  BFSI: "BFSI",
  ADMINISTRATIVE: "Administrative",
  ARTS_AND_DESIGN: "Arts and Design",
  BUSINESS_DEVELOPMENT: "Business Development",
  COMMUNITY_AND_SOCIAL_SERVICES: "Community and Social Services",
  CONSULTING: "Consulting",
  EDUCATION: "Education",
  ENGINEERING: "Engineering",
  ENTREPRENEURSHIP: "Entrepreneurship",
  HEALTHCARE_SERVICES: "Healthcare Services",
  HUMAN_RESOURCES: "Human Resources",
  INFORMATION_TECHNOLOGY: "Information Technology",
  LEGAL: "Legal",
  MARKETING: "Marketing",
  MEDIA_AND_COMMUNICATION: "Media and Communication",
  OPERATIONS: "Operations",
  PRODUCT_MANAGEMENT: "Product Management",
  PROGRAM_AND_PROJECT_MANAGEMENT: "Program and Project Management",
  PURCHASING: "Purchasing",
  QUALITY_ASSURANCE: "Quality Assurance",
  RESEARCH: "Research",
  SALES: "Sales",
  CUSTOMER_SUCCESS_AND_SUPPORT: "Customer Success and Support",
};

// Ordered option lists for building <select>s, preserving the spec's order.
export const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABELS) as Category[];
export const COURSE_COMPLETED_OPTIONS = Object.keys(
  COURSE_COMPLETED_LABELS,
) as CourseCompleted[];
export const DOMAIN_OPTIONS = Object.keys(DOMAIN_LABELS) as Domain[];

/**
 * State-machine labels. A profile's PUBLISHED state is shown as "Live".
 */
export const PROJECT_STATE_LABELS: Record<ItemState, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  PUBLISHED: "Published",
  CHANGES_NEEDED: "Changes needed",
  CHANGES_IN_REVIEW: "Changes in review",
  UNPUBLISHED: "Unpublished",
};

export const PROFILE_STATE_LABELS: Record<ItemState, string> = {
  ...PROJECT_STATE_LABELS,
  PUBLISHED: "Live",
};

// States the public is allowed to see. The public only ever sees the last
// approved version, and only when the item is PUBLISHED.
export const PUBLIC_STATE: ItemState = "PUBLISHED";

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Student",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

// The single super admin, per the spec.
export const SUPER_ADMIN_EMAIL = "spandan@learnbay.co";

// The one outbound link the assistant is allowed to point visitors to.
export const LEARNBAY_HOME_URL =
  process.env.NEXT_PUBLIC_LEARNBAY_HOME_URL ?? "https://www.learnbay.co";
