DELETE FROM stray_cats
WHERE sighting_count = 0
   OR id NOT IN (
     SELECT DISTINCT stray_cat_id
     FROM captures
     WHERE stray_cat_id IS NOT NULL
   );