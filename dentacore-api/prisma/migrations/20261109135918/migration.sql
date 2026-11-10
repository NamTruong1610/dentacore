/*
  Warnings:

  - A unique constraint covering the columns `[tokenHash]` on the table `InviteToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sentToEmail` to the `InviteToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InviteToken" ADD COLUMN     "sentToEmail" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_tokenHash_key" ON "InviteToken"("tokenHash");
