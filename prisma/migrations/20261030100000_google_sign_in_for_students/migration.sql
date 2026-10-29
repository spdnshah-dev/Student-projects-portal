-- Students sign in with Google; admins and the super admin keep email + password.
CREATE TYPE "AuthProvider" AS ENUM ('PASSWORD', 'GOOGLE');

ALTER TABLE "users"
  ADD COLUMN "auth_provider" "AuthProvider" NOT NULL DEFAULT 'PASSWORD',
  ADD COLUMN "google_sub" TEXT,
  ADD COLUMN "google_linked_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_google_sub_key" ON "users"("google_sub");

-- Existing students move to Google sign-in and lose their passwords: the
-- password column is no longer used for the student role.
UPDATE "users"
SET "auth_provider" = 'GOOGLE', "password_hash" = NULL
WHERE "role" = 'STUDENT';
