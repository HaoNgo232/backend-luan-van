/*
  Warnings:

  - You are about to drop the column `from` on the `ReportEntry` table. All the data in the column will be lost.
  - You are about to drop the column `to` on the `ReportEntry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ReportEntry" DROP COLUMN "from",
DROP COLUMN "to",
ADD COLUMN     "fromAt" TIMESTAMP(3),
ADD COLUMN     "toAt" TIMESTAMP(3);
