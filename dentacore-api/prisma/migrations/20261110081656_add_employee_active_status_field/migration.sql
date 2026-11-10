-- CreateEnum
CREATE TYPE "ActiveStatus" AS ENUM ('INACTIVE', 'ACTIVE');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "activeStatus" "ActiveStatus" NOT NULL DEFAULT 'INACTIVE';
