/*
  Warnings:

  - You are about to drop the column `bankingInfoDescription` on the `invoices` table. All the data in the column will be lost.
  - Added the required column `bankInfoId` to the `invoices` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "bankingInfoDescription",
ADD COLUMN     "bankInfoId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "bankInfos" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bankName" TEXT,
    "agency" TEXT,
    "account" TEXT,
    "pixKey" TEXT,

    CONSTRAINT "bankInfos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bankInfos_agency_key" ON "bankInfos"("agency");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bankInfoId_fkey" FOREIGN KEY ("bankInfoId") REFERENCES "bankInfos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
