-- Function to UPSERT user with specific password
create or replace function ensure_user_account(
    target_email text, 
    target_name text, 
    target_role text,
    target_position text
)
returns void as $$
declare
    user_id uuid;
begin
    -- 1. Check if user exists
    select id into user_id from auth.users where email = target_email;

    if user_id is null then
        -- CREATE NEW USER with password '12345678'
        user_id := gen_random_uuid();
        
        insert into auth.users (
            id, instance_id, aud, role, email, encrypted_password, 
            email_confirmed_at, raw_user_meta_data, created_at, updated_at
        )
        values (
            user_id, 
            '00000000-0000-0000-0000-000000000000', 
            'authenticated', 
            'authenticated', 
            target_email, 
            crypt('12345678', gen_salt('bf')), -- Password: 12345678
            now(), 
            json_build_object('full_name', target_name), 
            now(), 
            now()
        );
        
        -- Create Profile
        insert into public.profiles (id, full_name, role, email, position)
        values (user_id, target_name, target_role::user_role, target_email, target_position);
        
    else
        -- UPDATE EXISTING USER PASSWORD to '12345678'
        update auth.users
        set encrypted_password = crypt('12345678', gen_salt('bf')),
            updated_at = now()
        where id = user_id;
        
        -- Ensure profile matches
        update public.profiles
        set full_name = target_name,
            position = target_position,
            role = target_role::user_role
        where id = user_id;
    end if;
end;
$$ language plpgsql;

-- VICTOR WANDERA (Chairman)
select ensure_user_account('victor@tuj.com', 'Victor Wandera', 'treasurer', 'Chairman');

-- REGINA GACHARA (Vice Chair)
select ensure_user_account('regina@tuj.com', 'Regina Gachara', 'member', 'Vice Chairperson');

-- THEOPYSTER WAKESHO (Treasurer)
select ensure_user_account('theopyster@tuj.com', 'Theopyster Wakesho', 'treasurer', 'Treasurer');

-- PETER MUREITHI (Secretary)
select ensure_user_account('peter@tuj.com', 'Peter Mureithi', 'member', 'Secretary');

-- PAUL PEACE
select ensure_user_account('paul@tuj.com', 'Paul Peace', 'member', 'Organising Secretary');

-- SAILUS KIBOMA
select ensure_user_account('sailus@tuj.com', 'Sailus Kiboma', 'member', 'Member');

-- LORNA MUKENI
select ensure_user_account('lorna@tuj.com', 'Lorna Mukeni', 'member', 'Member');

-- BEATRICE MUCHONKU
select ensure_user_account('beatrice@tuj.com', 'Beatrice Muchonku', 'member', 'Member');

-- CECILIA NYAGOTHIE
select ensure_user_account('cecilia@tuj.com', 'Cecilia Nyagothie', 'member', 'Member');

-- FRANCIS AMKOA
select ensure_user_account('francis@tuj.com', 'Francis Amkoa', 'member', 'Member');

-- BRIAN MUSUNDI
select ensure_user_account('brian@tuj.com', 'Brian Musundi', 'member', 'Member');

-- BRANHAM OMBULA
select ensure_user_account('branham@tuj.com', 'Branham Ombula', 'member', 'Member');

-- Note: Kelvin Kinyua (kelvin@tuj.com) is SKIPPED as requested.
