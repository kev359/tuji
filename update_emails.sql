-- Helper function to update emails safely
create or replace function update_email_safely(old_email text, new_email text)
returns void as $$
begin
    -- Update auth.users
    update auth.users 
    set email = new_email, 
        updated_at = now()
    where email = old_email;

    -- Update public.profiles
    update public.profiles 
    set email = new_email 
    where email = old_email;
end;
$$ language plpgsql;

-- 1. Victor Wandera
select update_email_safely('victor.wandera@tujiimarishe.com', 'victor@tuj.com');

-- 2. Regina Gachara
select update_email_safely('regina.gachara@tujiimarishe.com', 'regina@tuj.com');

-- 3. Theopyster Wajeshi
select update_email_safely('theopyster.wajeshi@tujiimarishe.com', 'theopyster@tuj.com');

-- 4. Peter Mureithi
select update_email_safely('peter.mureithi@tujiimarishe.com', 'peter@tuj.com');

-- 5. Paul Peace
select update_email_safely('paul.peace@tujiimarishe.com', 'paul@tuj.com');

-- 6. Kelvin Kinyua
select update_email_safely('kelvin.kinyua@tujiimarishe.com', 'kelvin@tuj.com');

-- 7. Sailus Kiboma
select update_email_safely('sailus.kiboma@tujiimarishe.com', 'sailus@tuj.com');

-- 8. Lorna Mukeni
select update_email_safely('lorna.mukeni@tujiimarishe.com', 'lorna@tuj.com');

-- 9. Beatrice Muchonku
select update_email_safely('beatrice.muchonku@tujiimarishe.com', 'beatrice@tuj.com');

-- 10. Cecilia Nyagothie
select update_email_safely('cecilia.nyagothie@tujiimarishe.com', 'cecilia@tuj.com');

-- 11. Francis Amkoa
select update_email_safely('francis.amkoa@tujiimarishe.com', 'francis@tuj.com');

-- 12. Brian Musundi
select update_email_safely('brian.musundi@tujiimarishe.com', 'brian@tuj.com');

-- 13. Branham Ombula
select update_email_safely('branham.ombula@tujiimarishe.com', 'branham@tuj.com');
