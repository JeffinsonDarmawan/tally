-- =============================================================================
-- Tally — seed demo members  (DEV / TESTING ONLY — not for production)
-- =============================================================================
-- Adds four demo members (Emma, Leo, Mia, Sam) to your group so you can try
-- splitting, settling up, and reminders without four real magic-link sign-ins.
--
-- HOW TO USE
--   1. Create your group in the app first (the app's onboarding screen).
--   2. Supabase -> SQL Editor -> New query -> paste this whole file -> Run.
--   3. Refresh the app. The four appear in Settings -> Members and in the
--      "Who paid" / "Who's involved" steps, and as friends on the dashboard.
--
-- Re-runnable (idempotent). Remove them with the CLEANUP block at the bottom.
--
-- These are demo-only accounts: you won't sign in as them, but they behave like
-- real members for balances, settlements, and the activity feed. Reminders/
-- notifications addressed to them simply sit unread.
-- =============================================================================

do $$
declare
  v_group uuid;
  v_id    uuid;
  v_name  text;
  v_email text;
begin
  -- v1 has a single group; grab it.
  select id into v_group from public.groups order by created_at limit 1;
  if v_group is null then
    raise exception 'No group yet — create your group in the app first, then run this.';
  end if;

  foreach v_name in array array['Emma', 'Leo', 'Mia', 'Sam'] loop
    v_email := lower(v_name) || '@demo.tally';

    -- Create the auth user once (the handle_new_user trigger makes the profile).
    select id into v_id from auth.users where email = v_email;
    if v_id is null then
      v_id := gen_random_uuid();
      insert into auth.users
        (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      values
        ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
         v_email, crypt('demo-only', gen_salt('bf')), now(),
         '{"provider":"email","providers":["email"]}',
         json_build_object('display_name', v_name), now(), now());
    end if;

    -- Make sure the profile exists with the right name, then add to the group.
    insert into public.profiles (id, display_name)
      values (v_id, v_name)
      on conflict (id) do update set display_name = excluded.display_name;

    insert into public.group_members (group_id, user_id)
      values (v_group, v_id)
      on conflict do nothing;
  end loop;
end $$;

-- Who's in the group now:
select p.display_name
from public.group_members gm
join public.profiles p on p.id = gm.user_id
where gm.group_id = (select id from public.groups order by created_at limit 1)
order by p.display_name;

-- =============================================================================
-- CLEANUP — remove the demo members (cascades to their profiles + memberships):
--
--   delete from auth.users where email like '%@demo.tally';
--
-- =============================================================================
