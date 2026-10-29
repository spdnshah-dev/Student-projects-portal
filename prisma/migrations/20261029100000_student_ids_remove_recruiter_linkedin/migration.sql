-- 1. Remove the RECRUITER login type. It existed only to unlock student
--    LinkedIn URLs, which are removed below, so any remaining recruiter
--    accounts have nothing left to do and are deleted (their rows cascade).
DELETE FROM "users" WHERE "role" = 'RECRUITER';

CREATE TYPE "Role_new" AS ENUM ('STUDENT', 'ADMIN', 'SUPER_ADMIN');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";

-- 2. Students no longer provide or share a LinkedIn URL.
ALTER TABLE "student_profiles" DROP COLUMN "linkedin_url";

-- 3. The student's course is now set by the admin at add time (7 options) and
--    lives on the user together with the batch start date and the generated
--    Student ID.
CREATE TYPE "Course" AS ENUM (
  'DATA_SCIENCE',
  'BUSINESS_ANALYTICS_AND_DATA_ANALYTICS',
  'GEN_AI_AND_AGENTIC_AI',
  'SOFTWARE_ENGINEERING',
  'FORWARD_DEPLOYED_ENGINEERING',
  'CLOUD_AND_DEVOPS',
  'APPLIED_AI_PRACTITIONER'
);

ALTER TABLE "users"
  ADD COLUMN "student_id" TEXT,
  ADD COLUMN "course" "Course",
  ADD COLUMN "batch_start_date" DATE;

CREATE UNIQUE INDEX "users_student_id_key" ON "users"("student_id");

CREATE TABLE "student_id_sequences" (
  "course" "Course" NOT NULL,
  "batch_start_date" DATE NOT NULL,
  "last_counter" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "student_id_sequences_pkey" PRIMARY KEY ("course", "batch_start_date")
);

-- 4. Carry existing students over. Their course comes from the old
--    "course completed" choice on the profile (mapped onto the new list) and,
--    lacking a recorded batch, the batch start date is the day the account was
--    added. Students without a course keep NULLs and show as "Student" in
--    public until an admin sets them up; new students always get an ID.
UPDATE "users" u
SET "course" = CASE p."course_completed"::text
      WHEN 'DATA_SCIENCE' THEN 'DATA_SCIENCE'::"Course"
      WHEN 'BUSINESS_ANALYTICS_AND_DATA_ANALYTICS' THEN 'BUSINESS_ANALYTICS_AND_DATA_ANALYTICS'::"Course"
      WHEN 'CLOUD_AND_DEVOPS' THEN 'CLOUD_AND_DEVOPS'::"Course"
      WHEN 'GENERATIVE_AI_AND_AGENTIC_AI' THEN 'GEN_AI_AND_AGENTIC_AI'::"Course"
      WHEN 'SOFTWARE_DEVELOPMENT' THEN 'SOFTWARE_ENGINEERING'::"Course"
      ELSE NULL
    END,
    "batch_start_date" = (u."created_at" AT TIME ZONE 'UTC')::date
FROM "student_profiles" p
WHERE p."user_id" = u."id"
  AND u."role" = 'STUDENT'
  AND p."course_completed" IS NOT NULL;

WITH numbered AS (
  SELECT "id",
         "course",
         "batch_start_date",
         ROW_NUMBER() OVER (PARTITION BY "course", "batch_start_date" ORDER BY "created_at", "id") AS n
  FROM "users"
  WHERE "role" = 'STUDENT' AND "course" IS NOT NULL AND "batch_start_date" IS NOT NULL
)
UPDATE "users" u
SET "student_id" =
      CASE numbered."course"
        WHEN 'DATA_SCIENCE' THEN 'DS'
        WHEN 'BUSINESS_ANALYTICS_AND_DATA_ANALYTICS' THEN 'BADA'
        WHEN 'GEN_AI_AND_AGENTIC_AI' THEN 'GAAI'
        WHEN 'SOFTWARE_ENGINEERING' THEN 'SDE'
        WHEN 'FORWARD_DEPLOYED_ENGINEERING' THEN 'FDE'
        WHEN 'CLOUD_AND_DEVOPS' THEN 'CD'
        WHEN 'APPLIED_AI_PRACTITIONER' THEN 'AAP'
      END
      || '-' || to_char(numbered."batch_start_date", 'DDMMYYYY')
      || '-' || lpad(numbered.n::text, 3, '0')
FROM numbered
WHERE numbered."id" = u."id";

INSERT INTO "student_id_sequences" ("course", "batch_start_date", "last_counter")
SELECT "course", "batch_start_date", COUNT(*)
FROM "users"
WHERE "role" = 'STUDENT' AND "student_id" IS NOT NULL
GROUP BY "course", "batch_start_date";

-- 5. The old per-profile "course completed" column and enum go away.
ALTER TABLE "student_profiles" DROP COLUMN "course_completed";
DROP TYPE "CourseCompleted";
