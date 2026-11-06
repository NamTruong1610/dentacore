/*
  Warnings:

  - You are about to drop the column `deleteAt` on the `Address` table. All the data in the column will be lost.
  - You are about to drop the column `deleteAt` on the `Email` table. All the data in the column will be lost.
  - You are about to drop the column `deleteAt` on the `InviteToken` table. All the data in the column will be lost.
  - You are about to drop the column `deleteAt` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `deleteAt` on the `Phone` table. All the data in the column will be lost.
  - You are about to drop the column `deleteAt` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `deleteAt` on the `RolePermission` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "deleteAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Email" DROP COLUMN "deleteAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "InviteToken" DROP COLUMN "deleteAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "deleteAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Phone" DROP COLUMN "deleteAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Role" DROP COLUMN "deleteAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RolePermission" DROP COLUMN "deleteAt",
ADD COLUMN     "deletedAt" TIMESTAMP(3);
