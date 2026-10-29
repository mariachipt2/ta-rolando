begin;
alter table public.site_special_theme drop constraint site_special_theme_theme_check;
alter table public.site_special_theme add constraint site_special_theme_theme_check check(theme in ('ice','halloween','christmas','newyear','muertos'));
notify pgrst,'reload schema';
commit;
