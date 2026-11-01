-- AlterTable
ALTER TABLE "registrations" ADD COLUMN     "confirmationError" VARCHAR(500),
ADD COLUMN     "confirmationSentAt" TIMESTAMP(3);
