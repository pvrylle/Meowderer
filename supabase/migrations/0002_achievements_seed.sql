-- Seed achievement catalog (Phase 2.4)
-- Safe to re-run: uses ON CONFLICT DO NOTHING.

insert into public.achievements (id, title, description, icon) values
  ('first_catch', 'First Catch', 'Add your first cat to the CatDex.', '🐱'),
  ('five_cats', 'Getting Started', 'Collect 5 cats.', '🐾'),
  ('ten_cats', 'Cat Collector', 'Collect 10 cats.', '📚'),
  ('three_cities', 'City Explorer', 'Catch cats in 3 different cities.', '🏙️'),
  ('three_countries', 'Globetrotter', 'Catch cats in 3 different countries.', '🌍'),
  ('rare_find', 'Rare Find', 'Catch a rare or epic cat.', '✨'),
  ('coat_variety', 'Pattern Hunter', 'Collect 5 different coat types.', '🎨')
on conflict (id) do nothing;
