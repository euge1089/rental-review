-- Snap all bathroom counts to discrete submit values: 1, 1.5, 2, 2.5, 3, 3.5, 5 (5 = 4+ in UI).
UPDATE "Review"
SET "bathrooms" = (
  CASE
    WHEN "bathrooms" IS NULL THEN NULL
    WHEN "bathrooms" < 1.25 THEN 1
    WHEN "bathrooms" < 1.75 THEN 1.5
    WHEN "bathrooms" < 2.25 THEN 2
    WHEN "bathrooms" < 2.75 THEN 2.5
    WHEN "bathrooms" < 3.25 THEN 3
    WHEN "bathrooms" < 3.75 THEN 3.5
    ELSE 5
  END
)::double precision
WHERE "bathrooms" IS NOT NULL;
