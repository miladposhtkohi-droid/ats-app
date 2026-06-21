#!/usr/bin/env bash
# ====================================================================
# Deploy-skript för Admin Edge Functions
# ====================================================================
# Kräver Supabase CLI. Installera om du saknar det:
#   macOS/brew:  brew install supabase/tap/supabase
#   Windows/scoop: scoop bucket add supabase https://github.com/supabase/scoop-bucket && scoop install supabase
#   npm (alla plattformar): npm install -g supabase
#
# Användning:
#   1. Stå i projektroten (ats-app/)
#   2. ./deploy-edge-functions.sh        (första gången: skicka meddin project-ref)
#      ./deploy-edge-functions.sh abc123xyz   (där abc123xyz är din project-ref)
# ====================================================================

set -e

PROJECT_REF="${1:-}"

echo "============================================"
echo "  Supabase Edge Functions – Admin CRUD"
echo "============================================"
echo ""

# Steg 1: Logga in (hoppas över om redan inloggad)
echo "[1/4] Kontrollerar Supabase-inloggning..."
if ! supabase projects list >/dev/null 2>&1; then
  echo "   Inte inloggad – startar supabase login..."
  supabase login
fi
echo "   OK – inloggad."
echo ""

# Steg 2: Länka projektet (om project-ref anges)
if [ -n "$PROJECT_REF" ]; then
  echo "[2/4] Länkar projekt $PROJECT_REF..."
  supabase link --project-ref "$PROJECT_REF"
else
  echo "[2/4] Hoppar över link (ange project-ref som argument om ej länkat)."
  echo "   Om du inte redan länkat: kör './deploy-edge-functions.sh <din-project-ref>'"
fi
echo ""

# Steg 3: Deploya alla fyra funktioner
FUNCTIONS="create-user update-user-role delete-user list-users"
for FN in $FUNCTIONS; do
  echo "[3/4] Deployar: $FN..."
  supabase functions deploy "$FN"
  echo "   OK – $FN deployad."
  echo ""
done

# Steg 4: Klart
echo "[4/4] Alla funktioner deployade!"
echo ""
echo "============================================"
echo "  Klar!  ✅"
echo "============================================"
echo ""
echo "Dina Edge Functions körs nu på:"
echo "  https://<din-project-ref>.supabase.co/functions/v1/create-user"
echo "  https://<din-project-ref>.supabase.co/functions/v1/update-user-role"
echo "  https://<din-project-ref>.supabase.co/functions/v1/delete-user"
echo "  https://<din-project-ref>.supabase.co/functions/v1/list-users"
echo ""
echo "Starta appen med:  npm run dev"
echo ""