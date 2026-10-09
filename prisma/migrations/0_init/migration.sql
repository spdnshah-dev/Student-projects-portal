-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "ItemState" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'CHANGES_NEEDED', 'CHANGES_IN_REVIEW', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "ReviewState" AS ENUM ('PENDING', 'APPROVED', 'SENT_BACK');

-- CreateEnum
CREATE TYPE "ReviewTargetType" AS ENUM ('PROFILE', 'PROJECT');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('APPROVE', 'SEND_BACK', 'TAKE_DOWN', 'RESTORE');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('ANALYTICS', 'SOFTWARE_DEVELOPMENT', 'CLOUD_AND_DEVOPS', 'GENERATIVE_AI', 'AGENTIC_AI');

-- CreateEnum
CREATE TYPE "CourseCompleted" AS ENUM ('DATA_SCIENCE', 'BUSINESS_ANALYTICS_AND_DATA_ANALYTICS', 'CLOUD_AND_DEVOPS', 'GENERATIVE_AI_AND_AGENTIC_AI', 'SOFTWARE_DEVELOPMENT');

-- CreateEnum
CREATE TYPE "Domain" AS ENUM ('BFSI', 'ADMINISTRATIVE', 'ARTS_AND_DESIGN', 'BUSINESS_DEVELOPMENT', 'COMMUNITY_AND_SOCIAL_SERVICES', 'CONSULTING', 'EDUCATION', 'ENGINEERING', 'ENTREPRENEURSHIP', 'HEALTHCARE_SERVICES', 'HUMAN_RESOURCES', 'INFORMATION_TECHNOLOGY', 'LEGAL', 'MARKETING', 'MEDIA_AND_COMMUNICATION', 'OPERATIONS', 'PRODUCT_MANAGEMENT', 'PROGRAM_AND_PROJECT_MANAGEMENT', 'PURCHASING', 'QUALITY_ASSURANCE', 'RESEARCH', 'SALES', 'CUSTOMER_SUCCESS_AND_SUPPORT');

-- CreateEnum
CREATE TYPE "VisitorType" AS ENUM ('UNKNOWN', 'RECRUITER', 'LEARNER');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "EmbeddingSourceType" AS ENUM ('PROFILE', 'PROJECT', 'CERTIFICATE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "password_hash" TEXT,
    "name" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "headline" TEXT,
    "about" TEXT,
    "course_completed" "CourseCompleted",
    "state" "ItemState" NOT NULL DEFAULT 'DRAFT',
    "approved_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "tools_text" TEXT NOT NULL,
    "domain" "Domain" NOT NULL,
    "live_url" TEXT NOT NULL,
    "state" "ItemState" NOT NULL DEFAULT 'DRAFT',
    "link_ok" BOOLEAN,
    "link_last_checked_at" TIMESTAMP(3),
    "link_last_worked_at" TIMESTAMP(3),
    "approved_version_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_versions" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "review_state" "ReviewState" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_versions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "review_state" "ReviewState" NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "target_type" "ReviewTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "detail" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_checks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ok" BOOLEAN NOT NULL,
    "http_status" INTEGER,
    "error" TEXT,
    "response_ms" INTEGER,

    CONSTRAINT "link_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "visitor_type" "VisitorType" NOT NULL DEFAULT 'UNKNOWN',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "message_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" TEXT NOT NULL,
    "source_type" "EmbeddingSourceType" NOT NULL,
    "source_id" TEXT NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "embedding" vector(768),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_approved_version_id_key" ON "student_profiles"("approved_version_id");

-- CreateIndex
CREATE INDEX "student_profiles_state_idx" ON "student_profiles"("state");

-- CreateIndex
CREATE UNIQUE INDEX "projects_approved_version_id_key" ON "projects"("approved_version_id");

-- CreateIndex
CREATE INDEX "projects_profile_id_idx" ON "projects"("profile_id");

-- CreateIndex
CREATE INDEX "projects_state_idx" ON "projects"("state");

-- CreateIndex
CREATE INDEX "projects_category_idx" ON "projects"("category");

-- CreateIndex
CREATE INDEX "projects_domain_idx" ON "projects"("domain");

-- CreateIndex
CREATE INDEX "profile_versions_profile_id_idx" ON "profile_versions"("profile_id");

-- CreateIndex
CREATE INDEX "profile_versions_review_state_idx" ON "profile_versions"("review_state");

-- CreateIndex
CREATE INDEX "project_versions_project_id_idx" ON "project_versions"("project_id");

-- CreateIndex
CREATE INDEX "project_versions_review_state_idx" ON "project_versions"("review_state");

-- CreateIndex
CREATE INDEX "certificates_profile_id_idx" ON "certificates"("profile_id");

-- CreateIndex
CREATE INDEX "reviews_target_type_target_id_idx" ON "reviews"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "reviews_admin_id_idx" ON "reviews"("admin_id");

-- CreateIndex
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "link_checks_project_id_checked_at_idx" ON "link_checks"("project_id", "checked_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_sessions_session_token_key" ON "ai_sessions"("session_token");

-- CreateIndex
CREATE INDEX "ai_messages_session_id_idx" ON "ai_messages"("session_id");

-- CreateIndex
CREATE INDEX "embeddings_source_type_source_id_idx" ON "embeddings"("source_type", "source_id");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_approved_version_id_fkey" FOREIGN KEY ("approved_version_id") REFERENCES "profile_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_approved_version_id_fkey" FOREIGN KEY ("approved_version_id") REFERENCES "project_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_versions" ADD CONSTRAINT "profile_versions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_versions" ADD CONSTRAINT "profile_versions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_versions" ADD CONSTRAINT "project_versions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_versions" ADD CONSTRAINT "project_versions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_checks" ADD CONSTRAINT "link_checks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "ai_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

