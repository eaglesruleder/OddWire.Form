# Task Brief — Form Delivery Endpoint

**ID:** FORM-API-001
**Status:** Ready
**Suggested agent:** Either
**Branch:** `agent/a4k-api-form-delivery-docs`
**Base:** `main`
**Depends on:** None

---

## Objective

Add the first useful OddWire.Form server API: expose server-hosted form packages to the Settings → Form Manager catalogue, with package bytes delivered through a reusable file endpoint and installed through the existing client package pipeline.

Use this as a concrete proof for the broader A4K API/Repo architecture without requiring the generic framework to be fully extracted first.

## Context

OddWire.Form is currently client-first: forms, instances, lookup data, templates and installed form packages live in browser-local stores. The ASP.NET Core server is still a thin SPA host.

The client already has a complete form-package path:
- `FormList` discovers bundled JSON/ZIP packages
- `loadFormPackage(url)` parses a ZIP into `{ form, template, images, instances }`
- `installFormPackage()` persists the package into the existing form/instance/template/image stores
- Settings → Form Manager already renders Install / Update / Refresh actions by form/version

The missing piece is a server catalogue + file delivery path so additional forms can be added server-side without rebuilding the client bundle.

## Read First

- `docs/a4k-api-repo-architecture.md`
- `README.md`
- `OddWire.Form.Server/Program.cs`
- `OddWire.Form.Server/Controllers/`
- `oddwire.form.client/src/settings/SettingsPage.tsx`
- `oddwire.form.client/src/settings/FormManager/FormList.tsx`
- `oddwire.form.client/src/settings/FormManager/formPackages.ts`
- `oddwire.form.client/src/_context/installFormPackage.ts`
- `oddwire.form.client/src/_context/FormContext.tsx`

## Current State

- **Confirmed:** ASP.NET Core currently hosts the SPA and scaffold endpoints; there are no form/instance/lookup server APIs.
- **Confirmed:** Settings already contains a Form Manager catalogue.
- **Confirmed:** bundled form ZIPs already use an installable package format containing `form.json` plus optional PDF template, images and instances.
- **Confirmed:** `loadFormPackage(url)` can install from a fetchable package URL with no new package parser required.
- **Confirmed:** installed form version comparison already drives Install / Update / Refresh actions.
- **Assumed:** initial server form packages can be filesystem-backed rather than EF-backed.
- **Assumed:** server-hosted downloadable forms are public/readable for the first slice; protected file capability support may be implemented generically if cheap, but full account/auth infrastructure is not required.
- **Open question:** exact server package directory and deployment-copy convention should be chosen from existing ASP.NET project conventions during implementation.

## Required Changes

### Server — form catalogue
- Add a server-owned form package location for deployable `.zip` packages.
- Discover valid packages without a hard-coded catalogue where practical.
- Read each package's `form.json` metadata needed by the client catalogue, at minimum:
  - `formId`
  - `label`
  - `version`
  - `dateModified` if present
- Expose a form catalogue endpoint returning lightweight delivery DTOs rather than package bytes.

Conceptual response:

```text
GET /api/forms
→ [
    {
        formId,
        label,
        version,
        dateModified,
        package: FileDto
    }
  ]
```

### Server — reusable file delivery
- Add a reusable file endpoint that resolves a file by GUID-backed identity and returns the package bytes with filename/MIME metadata.
- Keep file transport concerns separate from Form API concerns.
- A `FileDto` should carry enough metadata for the caller to retrieve and validate the package.

Conceptual shape:

```text
FileDto
    Id
    Name
    Mime
    Length
    Checksum
    Token?     // when protected capability access is enabled
```

- GUID is the file identity / PK-style identifier.
- Checksum is explicitly an integrity/change fingerprint, not authentication by itself.
- Cheap checksum behaviour may use MD5 for ordinary immutable-ish files if retained intentionally and clearly named as non-security integrity metadata.
- If protected-file capability is implemented, prefer a stateless derived capability such as:

```text
HMAC(serverSecret, fileGuid + currentChecksum)
```

rather than storing a random token per file.

- Replacing file bytes should invalidate stale checksum-derived capabilities/references by design.

### Client — remote catalogue source
- Extend Form Manager so available forms are the merge of:
  - existing bundled forms
  - forms returned by `GET /api/forms`
- Do not eagerly download every remote ZIP simply to populate the list.
- Fetch the selected package only when the user chooses Install / Update / Refresh.
- Feed the fetched package through the existing `loadFormPackage` / `installFormPackage` path rather than adding a second installer.
- Preserve the current version comparison and action labels.

### Client — catalogue ownership seam
- Extract the smallest useful catalogue-loading seam if needed so `FormList` does not accumulate build-time discovery + remote fetching + rendering + installation in one method/component.
- Keep this narrow; do not introduce a broad frontend service architecture solely for this task.

## Boundaries

### In scope
- server-hosted form package discovery
- lightweight form catalogue API
- reusable file-reference/file-download endpoint
- checksum metadata
- optional stateless file capability if implementation remains small and self-contained
- Form Manager remote catalogue integration
- install/update/refresh of remote packages through the existing installer

### Out of scope
- server persistence for user form instances
- cross-device sync
- publishing/admin UI for uploading packages
- EF modelling of package contents
- unpacking images/templates/instances into relational tables
- full generic `A4KController<TKey,TEntity,TDto>` / `A4KRepo<TKey,TEntity>` extraction unless repetition from this slice clearly justifies a minimal piece
- user accounts / full authentication system
- collaborative live file updates

### Preserve
- browser-local installed forms remain the runtime source used by the client after installation
- existing bundled forms continue to appear and install exactly as before
- existing package format remains valid
- `installFormPackage()` remains the canonical package persistence path
- invalid/bad remote packages must not blank or break the entire Form Manager catalogue

## Investigation Required

- Determine the clean ASP.NET static/content location for deployable form packages and how they are copied to output/publish.
- Determine whether package metadata should be cached at startup or scanned per request; prefer the simplest implementation that avoids repeatedly parsing ZIPs unnecessarily.
- Verify a stable GUID/file identity strategy across server restarts. Do not use a newly generated GUID on every catalogue request if clients need the reference to remain valid.
- Verify how Vite's existing `/api` proxy reaches the ASP.NET host in development.
- Decide whether remote package loading is best expressed as a package URL passed to `loadFormPackage()` or as fetched bytes/blobs with a small overload; preserve one package parser.
- If capability tokens are implemented, keep them out of logs/query strings where practical and validate comparison safely.

## Likely Touchpoints

- `OddWire.Form.Server/Controllers/` — Form and File endpoints
- `OddWire.Form.Server/Program.cs` — DI/config/static package registration if required
- `OddWire.Form.Server/` package/content directory — hosted form ZIPs
- `oddwire.form.client/src/settings/FormManager/FormList.tsx` — merge/render remote catalogue
- `oddwire.form.client/src/settings/FormManager/formPackages.ts` — package loading boundary if a blob/response overload is useful
- `oddwire.form.client/src/_context/installFormPackage.ts` — expected to be reused, not redesigned

## Runtime / Data Flow

1. Server starts and discovers available form packages.
2. Package metadata is read from each valid ZIP's `form.json` and associated with a stable `FileDto`.
3. Settings → Form Manager requests `GET /api/forms`.
4. Client merges remote catalogue entries with existing bundled packages by `formId`.
5. Existing installed-version logic decides Install / Update / Refresh.
6. User selects an action for a remote form.
7. Client requests the referenced package from the File endpoint.
8. File endpoint resolves GUID, validates capability if required, and returns ZIP bytes with MIME/filename metadata.
9. Client validates checksum where implemented.
10. Existing package loader parses the ZIP.
11. Existing `installFormPackage()` writes form/template/images/instances to browser-local stores.
12. Form Manager refreshes to reflect the installed version.

### Stale file reference behaviour

If a package is replaced after a catalogue DTO was fetched:

```text
old FileDto/checksum/token
→ file request fails or checksum no longer matches
→ client re-fetches /api/forms (or user refreshes)
→ receives current FileDto
→ retry/install current package
```

This is acceptable and intentional because deployable package files are expected to change infrequently.

## Acceptance Criteria

- [ ] `GET /api/forms` returns metadata for valid server-hosted form packages without returning all ZIP bytes.
- [ ] each remote form entry includes a usable file reference with stable identity and MIME/filename metadata.
- [ ] the file endpoint returns the referenced ZIP bytes for an allowed/current reference.
- [ ] checksum metadata changes when package bytes change.
- [ ] if protected capability access is included, a stale/incorrect token cannot retrieve the protected file and replacement bytes invalidate the old token.
- [ ] Settings → Form Manager shows both bundled and server-provided forms.
- [ ] remote forms preserve existing Install / Update / Refresh semantics.
- [ ] selecting a remote form downloads only that package and installs it through the existing package installer.
- [ ] a malformed/unavailable remote package produces a local failure/toast and does not blank the rest of the catalogue.
- [ ] existing bundled-form installation still works.
- [ ] client build succeeds.
- [ ] server build succeeds.
- [ ] relevant standing docs are reconciled if the server/client ownership model materially changes.

## Validation

- Server build: Not run
- Client build: Not run
- Manual `GET /api/forms`: Not run
- Manual remote install from Settings: Not run
- Remote update/refresh version path: Not run
- Malformed package isolation: Not run
- Checksum/file replacement behaviour: Not run

## Handoff

**Implementation summary:** Not started; planning/documentation only.

**Changed areas:** None yet beyond planning docs.

**Docs:** Architecture lowdown and this endpoint task are recorded under `/docs/` on the planning branch.

**Blockers / risks:** No blocking design question. Stable file identity and server package output location must be resolved from repository/runtime evidence during implementation.

**Next action:** Implement the concrete Form catalogue + File delivery vertical slice, validate it end-to-end, then assess which repeated mechanics genuinely warrant extraction into A4K generic base classes.

## Follow-up Tasks

- Extract proven `A4KController<TKey,TEntity,TDto>` / `A4KRepo<TKey,TEntity>` primitives after one or more concrete endpoints establish the real common surface.
- Add server-side form publishing/admin workflow if remote form delivery proves useful.
- Consider protected/user-scoped file capabilities only when a real sensitive resource requires them.
