-- Enforce facility capacity invariants at the database level.
-- capacity and currentOccupancy can never go negative, and occupancy can
-- never exceed capacity. Placement admission logic must reject transitions
-- that would violate this, so the constraint is a hard backstop.

ALTER TABLE "Facility"
  ADD CONSTRAINT "Facility_capacity_non_negative" CHECK ("capacity" >= 0),
  ADD CONSTRAINT "Facility_currentOccupancy_non_negative" CHECK ("currentOccupancy" >= 0),
  ADD CONSTRAINT "Facility_currentOccupancy_within_capacity" CHECK ("currentOccupancy" <= "capacity");
