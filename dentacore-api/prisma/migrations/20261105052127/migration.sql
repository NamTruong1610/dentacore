/*
  Warnings:

  - You are about to drop the column `activeEmail` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Employee` table. All the data in the column will be lost.
  - Added the required column `primaryEmail` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('INVITED', 'UNINVITED');

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "activeEmail",
DROP COLUMN "status",
ADD COLUMN     "inviteStatus" "InviteStatus" NOT NULL DEFAULT 'UNINVITED',
ADD COLUMN     "primaryEmail" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Status";
