begin;
alter table public.discovery_marks drop constraint discovery_marks_source_url_check;
alter table public.discovery_marks add constraint discovery_marks_source_url_check check(
 length(source_url)<=2048 and (
 source_url ~ '^https://socialyte[.]com[.]br/eventos/' or
 source_url ~ '^https://www[.]pystta[.]com/evento/' or
 source_url ~ '^https://lhever[.]com/eventos/ipatinga-mg/.+' or
 source_url ~ '^https://lhever[.]com/c/[a-f0-9-]{36}$'
 ));
notify pgrst,'reload schema';
commit;
