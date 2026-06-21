# Edge Functions – Admin CRUD

Dessa fyra Edge Functions hanterar användarkonton säkert på servern med
`SUPABASE_SERVICE_ROLE_KEY`. Frontenden anropar dem via
`supabase.functions.invoke("namn", { body })` – service_role-nyckeln läcker
aldrig till webbläsaren.

## Funktioner

| Funktion          | Input                              | Syfte                                            |
| ----------------- | ---------------------------------- | ------------------------------------------------ |
| `create-user`     | `{ email, password, role }`        | Skapar auth-user + profile-rad                   |
| `update-user-role`| `{ userId, role }`                 | Uppdaterar `profiles.role` + `user_metadata.role`|
| `delete-user`     | `{ userId }`                       | Tar bort från `auth.users` + `profiles`          |
| `list-users`      | `{}`                               | Returnerar `[{ id, email, role }]`               |

Alla funktioner verifierar att anroparen är inloggad **och** har
`profiles.role = 'admin'` (se `_shared/auth.ts`). Ej-admin får 403.

## Distribuera

Kräver Supabase CLI. Stå i projektroten (`ats-app/`).

```bash
# 1) Logga in (om du inte redan gjort det)
supabase login

# 2) Länka till ditt projekt (välj det i listan)
supabase link --project-ref <ditt-project-ref>

# 3) Deploya alla fyra funktioner
supabase functions deploy create-user
supabase functions deploy update-user-role
supabase functions deploy delete-user
supabase functions deploy list-users
```

`SUPABASE_URL` och `SUPABASE_SERVICE_ROLE_KEY` injiceras automatiskt av
Supabase-runtime – du behöver inte sätta dem manuellt för produktionsdeploy.

## RLS-krav

`profiles` måste ha RLS-policyer som låter **admin** läsa/skriva alla rader.
Exempel (SQL i Supabase SQL Editor):

```sql
-- Tillåt inloggade att läsa sin egen profil
create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Tillåt admin att läsa alla profiler
create policy "admin read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Tillåt admin att ändra alla profiler
create policy "admin update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
```

> Notera: skapande/radering av `profiles`-rader sker via Edge Functions med
> service_role, som **kringgår RLS**. Policyerna ovan behövs ändå för att den
> vanliga klienten (anon) ska kunna läsa sin egen profil i `App.jsx`.

## Felsökning: "Failed to send a request to the Edge Function"

Detta är det överlägset vanligaste felet. Det betyder **inte** att koden är fel,
utan nästan alltid att funktionen **inte är deployad**. Vad som händer:

1. Frontend anropar `https://<project>.supabase.co/functions/v1/list-users`
2. Funktionen finns inte → gatewayen svarar 404/502 **utan CORS-headers**
3. Webbläsaren blockerar svaret (CORS) → `FunctionsFetchError`
4. Användaren ser: *"Failed to send a request to the Edge Function"*

### Lösning

1. **Installera Supabase CLI** (om du saknar det):
   ```bash
   npm install -g supabase
   ```
2. **Deploya funktionerna** (snabbast via skriptet i projektroten):
   ```bash
   ./deploy-edge-functions.sh <din-project-ref>
   ```
   eller manuellt:
   ```bash
   supabase login
   supabase link --project-ref <din-project-ref>
   supabase functions deploy create-user
   supabase functions deploy update-user-role
   supabase functions deploy delete-user
   supabase functions deploy list-users
   ```
3. **Verifiera** i Supabase Dashboard → Edge Functions: du ska se fyra
   funktioner med status "Active".
4. Starta om `npm run dev` och ladda om Admin-sidan.

### Andra möjliga orsaker (mindre vanliga)
- **`verify_jwt = true` + ogiltig session:** logga ut och in igen så JWT är färsk.
- **`SUPABASE_SERVICE_ROLE_KEY` saknas i den deployade miljön:** sätts normalt
  automatiskt av Supabase; kolla Dashboard → Project Settings → Edge Functions.
- **Stavfel i funktionsnamn:** `invoke("list-users")` måste matcha mappnamnet
  (`functions/list-users/`).

## Testa lokalt (valfritt)

```bash
supabase functions serve create-user --env-file .env.local
```

Anropa sedan via t.ex. `curl` med en giltig JWT från en admin-användare i
`Authorization: Bearer <jwt>`-headern.