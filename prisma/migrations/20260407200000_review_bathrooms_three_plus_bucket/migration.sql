-- Collapse bathroom counts to 1, 1.5, 2, 2.5, 4 (4 = "3+" in UI).
-- Maps prior values 3, 3.5, 5 (old 4+), and anything above 2.5 into the 3+ bucket.
UPDATE "Review"
SET "bathrooms" = (
  CASE
    WHEN "bathrooms" IS NULL THEN NULL
    WHEN "bathrooms" < 1.25 THEN 1
    WHEN "bathrooms" < 1.75 THEN 1.5
    WHEN "bathrooms" < 2.25 THEN 2
    WHEN "bathrooms" < 2.75 THEN 2.5
    ELSE 4
  END
)::double precision
WHERE "bathrooms" IS NOT NULL;
