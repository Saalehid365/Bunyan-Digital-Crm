-- AlterTable: replace fixed primary/secondary/accent colour columns with a flexible
-- ordered list of up to 5 colours, backfilling existing data in the same order.
ALTER TABLE "ClientBrandKit" ADD COLUMN     "colors" JSONB;

UPDATE "ClientBrandKit"
SET "colors" = (
  SELECT jsonb_agg(c) FROM (
    SELECT "primaryColor" AS c WHERE "primaryColor" IS NOT NULL
    UNION ALL
    SELECT "secondaryColor" WHERE "secondaryColor" IS NOT NULL
    UNION ALL
    SELECT "accentColor" WHERE "accentColor" IS NOT NULL
  ) t
)
WHERE "primaryColor" IS NOT NULL OR "secondaryColor" IS NOT NULL OR "accentColor" IS NOT NULL;

ALTER TABLE "ClientBrandKit" DROP COLUMN "primaryColor";
ALTER TABLE "ClientBrandKit" DROP COLUMN "secondaryColor";
ALTER TABLE "ClientBrandKit" DROP COLUMN "accentColor";
