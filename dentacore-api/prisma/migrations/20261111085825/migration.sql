/*
  Warnings:

  - Made the column `employeeNumber` on table `Employee` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "employeeNumber" SET NOT NULL;
