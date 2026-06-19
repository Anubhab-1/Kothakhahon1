-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "compareAtPrice" DOUBLE PRECISION,
ADD COLUMN     "galleryImages" TEXT[],
ADD COLUMN     "publisher" TEXT,
ADD COLUMN     "soldCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tableOfContents" TEXT,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Book_soldCount_idx" ON "Book"("soldCount");

-- CreateIndex
CREATE INDEX "Book_viewCount_idx" ON "Book"("viewCount");
