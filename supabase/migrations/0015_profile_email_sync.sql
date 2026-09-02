-- Garde l'adresse du profil applicatif alignée sur Supabase Auth.

create or replace function sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is distinct from old.email then
    update profiles
    set email = new.email
    where id = new.id;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function sync_profile_email();

