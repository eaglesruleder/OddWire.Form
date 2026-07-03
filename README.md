# OddWire.Form

ASP.NET Core-hosted React/TypeScript client that renders configurable forms. Client-first; the server is template scaffold.

---

## What this is

OddWire.Form is a dynamic form runtime. A form is a set of typed controls — text, numeric-ish text, multi-line, checkbox, radio, dropdown — rendered into a centered tablet-portrait strip, with edits held in page state and reported by `param`. Stage 1 (hard-coded controls in `FormPage`) is in place; the JSON control renderer, instance overlay, local context/navigation, and MVP+ layout/DB-manager features are not built yet.

---

## Domains & docs

- **Dynamic Form** — [Brief](oddwire.form.client/src/form/dynamicform.git.md) · [Doc](oddwire.form.client/src/form/dynamicform.gpt.md) — Active, ~0.1k LOC<br>`FormPage` renders hard controls, holds values in state, emits by `param`.
  - **Form Controls** — [Brief](oddwire.form.client/src/_components/controls/controls.git.md) · [Doc](oddwire.form.client/src/_components/controls/controls.gpt.md) — Active, ~0.2k LOC<br>Stateless label+field controls over a shared `ControlBase`.
- **Server host** — Support, scaffold<br>ASP.NET Core SPA host; template `WeatherForecast` only, no form endpoints.

Keyword CSS lives in `oddwire.form.client/public/style/` (`theme`, `layout`, `text`, `alignment`, `controls`).

---

## Build / Usage

```
cd oddwire.form.client
npm install
npm run dev     # Vite dev server (HTTPS)
npm run build   # tsc -b then vite build
```

Dev runs HTTPS with the ASP.NET dev cert — run `dotnet dev-certs https --trust` once if the browser blocks it.
