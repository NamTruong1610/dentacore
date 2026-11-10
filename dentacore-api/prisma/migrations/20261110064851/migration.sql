/*
  Warnings:

  - You are about to drop the column `secret` on the `MfaCredentials` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employeeId]` on the table `MfaCredentials` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employeeId` to the `MfaCredentials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `encryptedSecret` to the `MfaCredentials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MfaCredentials` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MfaCredentials" DROP COLUMN "secret",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "employeeId" TEXT NOT NULL,
ADD COLUMN     "encryptedSecret" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MfaCredentials_employeeId_key" ON "MfaCredentials"("employeeId");

-- AddForeignKey
ALTER TABLE "MfaCredentials" ADD CONSTRAINT "MfaCredentials_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
