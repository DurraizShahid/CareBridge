-- Additive and reversible: DROP COLUMN "tourConfig" undoes it.
ALTER TABLE "Facility" ADD COLUMN "tourConfig" JSONB;
