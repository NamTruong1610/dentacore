/*
  Warnings:

  - You are about to drop the column `employeeId` on the `Role` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_employeeId_fkey";

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "employeeId";
