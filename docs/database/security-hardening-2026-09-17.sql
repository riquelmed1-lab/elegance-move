-- Elegance Move — hardening de segurança aplicado ao Supabase em 2026-09-17.
-- Arquivo de documentação/reprodução. Não é uma migration gerenciada pela CLI.
-- Projeto Supabase: Elegance Move.

begin;

create or replace function private.admin_confirm_user(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and active = true and role = 'admin'
  ) then
    raise exception 'forbidden';
  end if;

  update auth.users
     set email_confirmed_at = coalesce(email_confirmed_at, now()),
         updated_at = now()
   where id = target_user_id;

  if found then
    insert into public.audit_logs(actor_id,action,entity,entity_id,payload)
    values ((select auth.uid()),'user.confirm','profile',target_user_id::text,'{}'::jsonb);
    return true;
  end if;
  return false;
end;
$$;

create or replace function private.admin_reset_user_password(target_user_id uuid, new_password text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and active = true and role = 'admin'
  ) then
    raise exception 'forbidden';
  end if;

  if new_password is null or length(new_password) < 8 then
    raise exception 'password_too_short';
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         recovery_token = '',
         updated_at = now()
   where id = target_user_id;

  if found then
    insert into public.audit_logs(actor_id,action,entity,entity_id,payload)
    values ((select auth.uid()),'user.password_reset','profile',target_user_id::text,'{}'::jsonb);
    return true;
  end if;
  return false;
end;
$$;

revoke all on function private.admin_confirm_user(uuid) from public, anon;
revoke all on function private.admin_reset_user_password(uuid,text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.admin_confirm_user(uuid) to authenticated;
grant execute on function private.admin_reset_user_password(uuid,text) to authenticated;

create or replace function public.admin_confirm_user(target_user_id uuid)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.admin_confirm_user(target_user_id);
$$;

create or replace function public.admin_reset_user_password(target_user_id uuid, new_password text)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.admin_reset_user_password(target_user_id,new_password);
$$;

revoke execute on function public.admin_confirm_user(uuid) from public, anon;
revoke execute on function public.admin_reset_user_password(uuid,text) from public, anon;
grant execute on function public.admin_confirm_user(uuid) to authenticated;
grant execute on function public.admin_reset_user_password(uuid,text) to authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

create or replace function private.audit_app_state_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.revision is distinct from old.revision then
    insert into public.audit_logs(actor_id,action,entity,entity_id,payload)
    values (
      (select auth.uid()),
      'state.update',
      'app_state',
      new.id::text,
      jsonb_build_object('revision_before',old.revision,'revision_after',new.revision)
    );
  end if;
  return new;
end;
$$;

revoke all on function private.audit_app_state_update() from public, anon, authenticated;

drop trigger if exists audit_app_state_update on public.app_state;
create trigger audit_app_state_update
after update on public.app_state
for each row execute function private.audit_app_state_update();

commit;
