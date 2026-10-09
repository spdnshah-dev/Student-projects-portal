-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "consent_at" TIMESTAMP(3),
ADD COLUMN     "domain" "Domain",
ADD COLUMN     "linkedin_url" TEXT,
ADD COLUMN     "photo_key" TEXT,
ADD COLUMN     "years_experience" INTEGER;

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "issuer" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "file_key" DROP NOT NULL,
ALTER COLUMN "file_name" DROP NOT NULL;

