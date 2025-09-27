# Ernährungsanamnese & Analyse (Vite + React + TypeScript + Tailwind)

Eine lauffähige Web‑App zum Ausfüllen eines kombinierten Fragebogens (inkl. **MNA‑SF** Punkte‑Eingabe, **TFEQ‑R18** Likert 1–4, **3‑Tage‑Ernährungsprotokoll**) und zur Erstellung einer **Auswertung mit ausführlichen, personalisierten Empfehlungen**. Patientendaten (Vorname, Alter, Größe, Gewicht, Beruf) werden **qualitativ** berücksichtigt (Kontext-Hinweise, BMI).

> **Hinweis:** Der Original‑Wortlaut lizenzierter Fragebögen ist **nicht** enthalten. Trage Punkte (MNA‑SF) bzw. Likert‑Antworten (TFEQ‑R18) ein. Inhalte dienen der Information und ersetzen keine medizinische Beratung.

## Installation

```bash
npm install
npm run dev
```

Öffne die lokale URL, fülle den Fragebogen aus, erstelle die **Auswertung**, exportiere Daten als JSON oder den Report als **Markdown** (kopieren) bzw. **PDF** (Druck).

## Deployment (GitHub Pages)

Empfohlen: Netlify/Vercel. Für GitHub Pages:

```bash
npm run build
# den Ordner dist/ als Pages veröffentlichen (Branch/Folder).
```

## Struktur

- `src/App.tsx` – Fragebogen, Scoring, Auswertung & Empfehlungen
- `src/main.tsx` – Bootstrap
- `src/styles.css` – Tailwind Utilities & UI-Styles
- `index.html` – App‑Container
- Tailwind/PostCSS/Vite/TS Konfigurationen

## Datenschutz

Alle Daten bleiben lokal (localStorage). Kein Tracking. Export nur manuell durch Nutzer.


## GitHub Pages Deployment (automatisch)

1. Dieses Projekt in ein neues GitHub‑Repo pushen (Branch: `main`).
2. Unter **Settings → Pages** den **Source** auf **GitHub Actions** stellen.
3. Die mitgelieferte Action `.github/workflows/pages.yml` baut & veröffentlicht die Seite aus `dist/`.
4. Die App ist dann unter `https://<user>.github.io/<repo>/` erreichbar.

## E-Mail-Versand aktivieren

Öffne `src/config.ts` und wähle einen Provider:

### Option A: EmailJS (empfohlen für statische Seiten)
1. Konto anlegen, Service & Template erstellen.
2. In `src/config.ts`: `EMAIL_PROVIDER = 'emailjs'` setzen und `service_id`, `template_id`, `public_key`, `to_email` eintragen.
3. In der App **„Auswertung erstellen“** klicken und dann **„Ergebnis per E-Mail senden“**.

### Option B: Formspree
1. Formular erstellen → Endpoint kopieren.
2. In `src/config.ts`: `EMAIL_PROVIDER = 'formspree'` und `endpoint` + `to_email` eintragen.

> **Sicherheit:** Auf statischen Seiten sind Keys/IDs clientseitig sichtbar. Für sensible Workflows besser einen Server/Serverless (z. B. Vercel/Netlify Functions) verwenden. Ich kann dir das gerne als Alternative umsetzen.
