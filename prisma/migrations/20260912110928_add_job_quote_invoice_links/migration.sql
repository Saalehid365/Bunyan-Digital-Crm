-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "quoteId" TEXT;

-- CreateIndex
CREATE INDEX "Job_quoteId_idx" ON "Job"("quoteId");

-- CreateIndex
CREATE INDEX "Job_invoiceId_idx" ON "Job"("invoiceId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
