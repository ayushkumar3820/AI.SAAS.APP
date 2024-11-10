/*
  Warnings:

  - You are about to drop the `chats` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chats" DROP CONSTRAINT "chats_user_id_fkey";

-- DropForeignKey
ALTER TABLE "coin_spend" DROP CONSTRAINT "coin_spend_summary_id_fkey";

-- DropTable
DROP TABLE "chats";

-- CreateTable
CREATE TABLE "summary" (
    "id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "summary_created_at_url_idx" ON "summary"("created_at", "url");

-- AddForeignKey
ALTER TABLE "summary" ADD CONSTRAINT "summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_spend" ADD CONSTRAINT "coin_spend_summary_id_fkey" FOREIGN KEY ("summary_id") REFERENCES "summary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
