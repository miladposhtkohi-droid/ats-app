# PROJECT_STRUCTURE.md

> Analys av ATS-appen (Applicant Tracking System) byggt med React + Vite + Supabase.
> Syfte: dokumentera nuläget inför design- och styling-arbetet (Steg 2).

---

## 1. Översikt & Teknikstack

| Lager        | Teknik                                         |
| ------------ | ---------------------------------------------- |
| Frontend     | React 19 + Vite 8                              |
| Styling      | Tailwind CSS 4 (via `@tailwindcss/vite`)       |
| Backend/BaaS | Supabase (Auth + Postgres-databas)             |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable`        |
| Routing      | **Inget router-bibliotek aktivt** – appen använder tillståndstyrd vyväxling (`useState`) i `App.jsx`. (`react-router-dom` finns installerat men används ej.) |

**Språk i UI:** Svenska.

---

## 2. Mappstruktur

```
ats-app/
├── index.html                  # HTML-ingång, laddar /src/main.jsx
├── package.json                # Beroenden & scripts (dev/build/lint/preview)
├── package-lock.json
├── vite.config.js              # Vite + React + Tailwind-plugin
├── tailwind.config.js          # Tailwind-config (tom theme.extend – ingen egen design än)
├── eslint.config.js
├── README.md                   # Standard Vite-template README (ej uppdaterad för projektet)
├── .env                        # Supabase-uppgifter (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
├── .gitignore
├── PROJECT_STRUCTURE.md        # <-- denna fil
│
├── public/
│   ├── favicon.svg
│   └── icons.svg
│
└── src/
    ├── main.jsx                # React-ingång, renderar <App/> i StrictMode
    ├── App.jsx                 # Huvudkomponent: auth-session, profil/roll, topbar, vy-väljare
    ├── App.css                 # Tom fil (ej använd)
    ├── index.css               # Endast `@import "tailwindcss";` (inga egna styles)
    ├── supabaseClient.js       # Skapar Supabase-klient från env-variabler
    │
    ├── assets/                 # (Tom mapp – inga tillgångar än)
    │
    └── pages/
        ├── Login.jsx           # Inloggningssida (email/lösenord)
        ├── Jobs.jsx            # Lista & skapa jobb; öppnar Candidates
        ├── Candidates.jsx      # Kandidater för ett valt jobb
        └── Kanban.jsx          # Kanban-tavla med drag-&-drop (alla kandidater)
```

---

## 3. Sidor / Vyer & Vad De Gör

Appen har **inga URL-rutter**. Vyerna styrs av tillstånd i `App.jsx`:

- `session` (inloggad?) → visar `<Login/>` eller huvudapp
- `view` (`'jobs' | 'kanban'`) → växlar mellan Jobb-vyn och Kanban-vyn
- `selectedJob` (inuti `Jobs.jsx`) → öppnar `<Candidates/>` för ett jobb

| Vy / Komponent   | Hur man når den                          | Funktion                                                                                                                              |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Login**        | Ej inloggad                              | Email/lösenord-inloggning via `supabase.auth.signInWithPassword`. Visar felmeddelande och loading-tillstånd.                          |
| **Jobs**         | Inloggad + "Jobb"-knappen i topbaren     | Lista alla jobb (sorterat nyaste först), skapa nytt jobb (titel + beskrivning). Klicka på ett jobb → öppnar **Candidates**.           |
| **Candidates**   | Via Jobs → klicka på ett jobb            | Lista kandidater för ett specifikt jobb, lägg till kandidat (namn, email, LinkedIn). Visar kandidatens status som en etikett.         |
| **Kanban**       | Inloggad + "Kanban"-knappen i topbaren   | Kanban-tavla med alla kandidater grupperade per status. Drag-&-drop mellan kolumner uppdaterar `status` i databasen. Filtrering på jobb och namn. |

### Statusflöde (Kanban)
Definierat i `Kanban.jsx`:

```
Nya (new) → Screening (screening) → Intervju (interview) → Erbjudande (offer)
                                                                  ↘
                              Avslag (rejected)  ← (vilken kolumn som helst)
```

---

## 4. Återanvändbara Komponenter

**Notera:** Projektet har **ingen separat `components/`-mapp**. Allt ligger direkt i sidfilerna. Följande "komponenter" är definierade inuti sidfilerna men **används bara lokalt** (ej återanvända):

| Komponent          | Definierad i     | Används i       | Beskrivning                                                              |
| ------------------ | ---------------- | --------------- | ------------------------------------------------------------------------ |
| `App`              | `App.jsx`        | `main.jsx`      | Rot-komponent: hanterar session, profil, topbar och vy-väljare.          |
| `CandidateCard`    | `Kanban.jsx`     | `Kanban.jsx`    | Dragbar kort för en kandidat (namn, jobb, LinkedIn-länk).                |
| `KanbanColumn`     | `Kanban.jsx`     | `Kanban.jsx`    | Droppbar kolumn med rubrik + antal + lista av `CandidateCard`.           |

Det finns **inga delade UI-komponenter** (t.ex. Button, Input, Card, Badge) och **inget shadcn/ui** i projektet idag.

---

## 5. Databasschema (Supabase / Postgres)

> Härlett från frågorna i koden (det finns ingen SQL/migrationsfil i repot).

### `profiles`
Användarprofiler, en rad per autentiserad användare.

| Kolumn   | Typ         | Beskrivning                                                       |
| -------- | ----------- | ----------------------------------------------------------------- |
| `id`     | uuid (PK)   | Svarar mot `auth.users.id` (samma id som inloggad användare).     |
| `role`   | text        | Roll: troligtvis `'admin'` eller `'customer'`.                    |
| _övriga_ | _?_         | Eventuellt namn etc. (används ej explicit i frontend idag).       |

### `jobs`
Jobbannonser/rekryteringstilldelningar.

| Kolumn        | Typ          | Beskrivning                                                  |
| ------------- | ------------ | ----------------------------------------------------------- |
| `id`          | uuid (PK)    | Primärnyckel.                                               |
| `title`       | text         | Jobbtitel (obligatorisk).                                   |
| `description` | text         | Beskrivning (valfri).                                       |
| `customer_id` | uuid (FK)    | Ägare – sätts till `session.user.id` vid skapande.          |
| `created_at`  | timestamptz  | Skapad-tid (sorteras fallande i listan).                    |

### `candidates`
Kandidater kopplade till ett jobb.

| Kolumn         | Typ          | Beskrivning                                                                 |
| -------------- | ------------ | -------------------------------------------------------------------------- |
| `id`           | uuid (PK)    | Primärnyckel.                                                              |
| `job_id`       | uuid (FK)    | Refererar till `jobs.id`.                                                   |
| `name`         | text         | Kandidatens namn (obligatorisk).                                           |
| `email`        | text         | Kandidatens email (valfri).                                                |
| `linkedin_url` | text/url     | LinkedIn-länk (valfri).                                                     |
| `status`       | text         | En av: `new`, `screening`, `interview`, `offer`, `rejected` (default `new`).|
| `created_at`   | timestamptz  | Skapad-tid (sorteras fallande).                                            |

### Relationer

```
auth.users (Supabase Auth)
    │ 1
    │
    ▼ 1
profiles.id  ◄──────────────────────┐  (profile/roll för den inloggade)
                                    │
                                    │ skapar/äger
                                    ▼
jobs.customer_id  ──── 1 ────►  jobs
                                    │ 1
                                    │
                                    ▼ N
candidates.job_id  ────────►  candidates  (status: new/screening/interview/offer/rejected)
```

> **Viktigt:** Frontend gör **inga join-frågor** som inkluderar `profiles`, så roll/ägande-skydd sker förmodligen via **Row Level Security (RLS)** i Supabase. Detta är inte synligt i kodbasen och bör bekräftas i Supabase-dashboarden.

---

## 6. Autentiserings- & Rollflöde

### Autentisering
1. `App.jsx` anropar `supabase.auth.getSession()` vid uppstart.
2. Prenumererar på `supabase.auth.onAuthStateChange` för att reagera på in-/utloggning.
3. Finns ingen session → `<Login/>` visas.
4. Vid lyckad inloggning hämtas profilen från `profiles` via användarens id.
5. "Logga ut"-knappen anropar `supabase.auth.signOut()`.

### Roller (admin vs. kund/customer)
- Rollen hämtas från `profiles.role` och **visas** i topbaren: `Inloggad som: email (roll)`.
- **Frontend har i nuläget ingen rollbaserad vy- eller funktionsstyrning**:
  - Både admin och kund ser samma två vyer (Jobb, Kanban).
  - `Jobs.jsx` sätter alltid `customer_id` till den inloggade användaren vid jobb-skapande (även om den inloggade är admin).
  - Ingen admin-specifik dashboard, användarhantering eller rapportvy finns.
- Alltså: **rollen lagras och visas, men styr inte UX än.** Eventuell åtkomstkontroll sker (troligen) via RLS på databasnivå.

### Nuläge – rollflödet i steg
```
Användare öppnar app
        │
        ▼
[getSession] ── ingen session ──► Login (email/lösenord)
        │                                  │
        │ session finns                    │ signInWithPassword
        ▼                                  │
[hämta profiles.role] ◄────────────────────┘
        │
        ▼
Huvudvy: topbar (email + roll) + nav(Jobb/Kanban)
        │
        ├── view='jobs'   ─► Jobs ──► (klicka jobb) ─► Candidates
        └── view='kanban' ─► Kanban (drag-&-drop status)
```

---

## 7. Nuläge: Vad Fungerar vs. Vad Saknar Styling

### ✅ Funktionalitet som fungerar fullt ut
- **Autentisering:** inloggning, sessionshantering, utloggning, reaktiv auth-state.
- **Profil/roll:** hämtning och visning av inloggad användares roll.
- **Jobb:** lista, skapa (med kund-id).
- **Kandidater:** lista per jobb, lägga till (namn/email/LinkedIn), visa status-etikett.
- **Kanban:** hämta alla kandidater (med jobbtitel via join), dra-och-släpp för att ändra status, filtrering på jobb/namn.
- **Databasintegration:** alla CRUD-operationer mot Supabase är på plats.

### ⚠️ Delar som finns men är ofullständiga funktionellt
- **Rollstyrning:** rollen visas men styr inga vyer eller rättigheter i frontend.
- **Admin-funktioner:** ingen admin-dashboard/användarhantering finns.
- **Kandidatdetaljer:** ingen detaljvy/redigering/ta-bort för kandidater (endast status via Kanban).
- **Jobb-hantering:** ingen redigera/ta-bort/arkivera för jobb.

### 🎨 Styling-nuläge (viktigt inför Steg 2)
- **Tailwind CSS 4 är installerat och aktivt**, men `tailwind.config.js` har **tom `theme.extend`** – ingen egen designtoken/palett/typsnitt definierade.
- `index.css` innehåller **bara** `@import "tailwindcss";` – inga globala styles, typsnitt eller designvariabler.
- **`App.css` är tom och oanvänd.**
- **shadcn/ui finns EJ** i projektet.
- **Styling är inkonsekvent och minimal:**
  - `Login.jsx` använder **inline-styles** (ej Tailwind alls).
  - `App.jsx`, `Jobs.jsx`, `Candidates.jsx`, `Kanban.jsx` använder Tailwind-standardklasser (blå default-knappar, grå ramar, vit bakgrund) – funktionella men utan egen identitet.
- **Inget typsnitt** är laddat (system-standard).
- **Status-färgerna i Kanban är inte differentierade** – alla kolumner ser likadana ut (endast `bg-gray-100`/`bg-blue-50` vid drag-over).
- **Ej responsivt optimerad:** topbar och Kanban-kolumner fungerar på bred skärm men layouten är inte anpassad för mobil/surfplatta medvetet.
- **Inga återanvändbara UI-komponenter** (Button, Card, Badge, Input, Layout) finns – all markup dupliceras.

### Sammanfattning
> Allt **fungerar**, men inget är **designat**. Appen är en fungerande prototyp utan visuell identitet. Steg 2 bör börja med att etablera en designgrund (färgpalett, typografi, spacing-kala, komponentbibliotek i `src/components/`) och sedan applicera den konsekvent på Login, App/topbar, Jobs, Candidates och Kanban – med särskild omsorg om statusfärgerna i Kanban och responsiv layout.

---

## 8. Noter inför Steg 2 (Design)

Rekommenderad struktur för styling-arbetet:
1. **Designtokens** i `tailwind.config.js` (egna färger för varumärke + status-färger) och CSS-variabler i `index.css`.
2. **Typsnitt** (t.ex. via Google Fonts eller `@fontsource`) med tydlig hierarki.
3. **`src/components/ui/`** med återanvändbara primitiva komponenter: `Button`, `Input`, `Textarea`, `Card`, `Badge`, `Avatar`, `Layout`/`Sidebar`/`Topbar`.
4. **Statusfärgssystem** för Kanban (5 tydliga, kontrasterande färgkategorier).
5. **Responsiva layouts:** mobil-first, funktionell topbar → botten-nav/fällmeny på mobil, scrollbara Kanban-kolumner på smala skärmar.
6. **Applicera** genom att skriva om klasserna i `Login.jsx`, `App.jsx`, `Jobs.jsx`, `Candidates.jsx`, `Kanban.jsx`.