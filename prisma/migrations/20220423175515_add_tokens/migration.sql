-- AlterTable
ALTER TABLE "User" ADD COLUMN     "access_token" TEXT,
ADD COLUMN     "expiry_date" INTEGER,
ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "token_type" TEXT;
