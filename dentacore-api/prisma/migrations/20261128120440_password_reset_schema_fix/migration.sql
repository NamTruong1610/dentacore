/*
  Warnings:

  - You are about to drop the column `issuerNationalId` on the `PasswordResetToken` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_employeeId_fkey";

-- AlterTable
ALTER TABLE "PasswordResetToken" DROP COLUMN "issuerNationalId";

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
