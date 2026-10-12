-- CreateTable
CREATE TABLE "admin_assignments" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_assignments_admin_id_student_id_key" ON "admin_assignments"("admin_id", "student_id");

-- CreateIndex
CREATE INDEX "admin_assignments_admin_id_idx" ON "admin_assignments"("admin_id");

-- CreateIndex
CREATE INDEX "admin_assignments_student_id_idx" ON "admin_assignments"("student_id");

-- AddForeignKey
ALTER TABLE "admin_assignments" ADD CONSTRAINT "admin_assignments_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_assignments" ADD CONSTRAINT "admin_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
