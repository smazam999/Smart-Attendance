# Smart Attendance

Face attendance for factory workers, powered by Supabase + face-api.js.

## Deploy to GitHub Pages

1. Push `index.html`, `config.js`, `vault.js`, `.nojekyll` to a public repo.
2. Settings → Pages → Source: `Deploy from a branch` → `main` / `/(root)`.
3. Your app is live at `https://USERNAME.github.io/REPO/`.

## One-time setup

1. Run the SQL in `supabase/sql.sql` in your Supabase project.
2. Add your GitHub Pages URL to **Google Cloud Console → Credentials → OAuth → Authorised JavaScript origins**.
3. Create an admin account in Supabase → Authentication → Users.
4. Insert that email into `approved_users` with `role='admin'`.
5. Sign in as admin → set a vault passphrase (the biometrics encryption key).
6. Approve worker Gmails in the **Gmails** tab.

## Security model

- Admin auth: **Supabase Auth** (server-side, no secrets in code)
- Worker auth: **Google Sign-In JWT** + server-side allowlist
- Biometric encryption: **AES-GCM 256** key derived via **PBKDF2-200k**, stored as a non-extractable `CryptoKey` in **IndexedDB**
- Liveness: randomised challenge (blink / open mouth / turn head)