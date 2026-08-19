# A4K API / Repo Architecture

## Purpose

Capture the intended reusable backend shape for OddWire services: a persistence-focused generic repository under an HTTP/application-focused generic controller, with DTO mapping and permission policy kept at the API boundary.

This is an architecture lowdown, not an implementation contract. The generic base should be allowed to emerge from real endpoints rather than being fully invented before use.

---

## Core Shape

```text
React / caller
    ↕ DTO
A4KController<TKey, TEntity, TDto>
    ├─ HTTP contract
    ├─ PermissionState access checks
    ├─ DTO ↔ Entity mapping
    ├─ filter DTO translation
    ├─ nested-resource orchestration
    └─ operation hooks / transaction boundary
            ↓
A4KRepo<TKey, TEntity>
    ├─ Get(key)
    ├─ Where(Expression<Func<TEntity, bool>>)
    ├─ Add(entity)
    ├─ Update(entity)
    └─ Delete(key)
            ↓
EF Core / persistence
```

The layers intentionally overlap in CRUD verbs while owning different concerns.

---

## A4KRepo

### Responsibility

A persistence primitive over one entity type.

### Owns
- entity retrieval by key
- server-side expression querying
- add/update/delete persistence operations
- EF-aware data access and persistence mechanics

### Does not own
- HTTP response semantics
- DTOs
- endpoint filters
- authentication or authorisation
- nested DTO graph interpretation
- parent/child API orchestration

### Intended surface

```csharp
A4KRepo<TKey, TEntity>
{
    Get(TKey key)
    Where(Expression<Func<TEntity, bool>> filter)
    Add(TEntity entity)
    Update(TEntity entity)
    Delete(TKey key)
}
```

Concrete repos should only grow extra methods when the entity has real persistence/domain query needs beyond generic CRUD.

---

## A4KController

### Responsibility

Own the reusable application/REST algorithm around an entity and its transport DTO.

### Intended generic shape

```csharp
A4KController<TKey, TEntity, TDto>
{
    abstract PermissionState Access(TEntity entity)
    abstract PermissionState Access(TDto dto)

    Get(TKey key)
    Where(FilterDto filter)
    Post(TDto dto)
    Put(TKey key, TDto dto)
    Delete(TKey key)
}
```

`PermissionState` carries operation rights as one result, e.g. `{ Read, Write, Delete }`, so callers can use `Access(entity).Read` / `.Write` / `.Delete` rather than defining one access method per verb.

### Standard Get flow

```text
repo.Get(key)
→ if missing: NotFound
→ Access(entity).Read
→ if denied: NotAuthorised / Forbid
→ map entity → dto
→ return dto
```

### Standard Update flow

```text
repo.Get(key)
→ if missing: NotFound
→ Access(entity/dto).Write
→ pre-update hook
→ map/apply dto → entity
→ repo.Update(entity)
→ post-update hook
→ map response
```

The generic method owns the algorithm. Concrete controllers override policy or exceptional steps, not the whole CRUD method.

---

## DTO Mapping

Entity and DTO stay separate even where their initial shapes are similar.

```text
Entity
    persistence shape
    navigation/persistence concerns

DTO
    public API contract
    endpoint-appropriate nested data
    transport-only fields / file references / filters
```

The controller consumes a mapper for `TEntity ↔ TDto` rather than exposing EF entities directly.

This keeps database shape from silently becoming the public REST schema.

---

## Query Boundary

Repository querying and API querying intentionally differ.

```text
Repo:
Where(entity => entity.FactionId == id)

API:
Where(PeepFilterDto filter)
```

The API translates a serialisable filter contract into repository expressions. Expression trees remain server-side implementation detail and are never the HTTP contract.

---

## Nested Data / Operation Hooks

Repositories should not interpret arbitrary nested DTO graphs.

The controller/application layer may coordinate child repositories when a DTO operation represents a larger aggregate action.

Example shape:

```csharp
protected virtual PreUpdate(TEntity entity, TDto dto) { }
protected virtual PostUpdate(TEntity entity, TDto dto) { }
```

Concrete controller example:

```text
Update parent
→ child DTOs require sync
→ controller hook calls GetRepo<ChildT>() / child service
→ generic parent update flow remains intact
```

Use separate lifecycle hooks where ordering matters rather than replacing the whole `Post` / `Put` method.

Likely hook family:
- `PreCreate(dto)` / `PostCreate(entity, dto)`
- `PreUpdate(entity, dto)` / `PostUpdate(entity, dto)`
- `PreDelete(entity)` / `PostDelete(entity)`

Exact signatures remain implementation-time decisions.

---

## Transaction Ownership

When one API operation mutates multiple repositories, the application/controller operation should own the transaction or unit-of-work boundary.

```text
Begin operation
→ parent repo mutation
→ child repo mutation(s)
→ commit together
```

Individual repositories should not independently commit a multi-repository application operation and leave partial state if a later child step fails.

---

## File Access Primitive

A reusable `FileDto` / file endpoint is expected to sit alongside the generic API architecture.

Conceptual transport:

```text
FileDto
    Guid Id              // persistent identity / PK
    string Name
    string Mime
    long Length
    string Checksum
    string? Token        // protected-file capability when required
```

### Identity and integrity
- GUID remains the file primary key.
- A cheap checksum such as MD5 may be used explicitly as a non-security fingerprint/integrity value for ordinary immutable-ish files.
- Files are expected to change infrequently; replacing bytes intentionally invalidates stale file references/tokens.

### Protected-file capability

Protected file access may derive a token from the current file state rather than store a random token per file.

Preferred modern form:

```text
Token = HMAC(serverSecret, fileGuid + currentChecksum)
```

This preserves the original desired behaviour:
- no random token column is required
- token changes when the file changes
- a stale parent DTO naturally loses access to the replaced file
- re-fetching the token-providing parent DTO obtains the current capability
- knowing the file bytes/checksum alone is insufficient without the server secret

The parent API controls disclosure of the capability. The file endpoint validates the presented capability and serves bytes; it does not need to reproduce the parent object's full permission graph.

### Stale-reference behaviour

```text
Caller gets parent DTO + FileDto token A
→ file replaced
→ current checksum/token becomes B
→ request with token A fails
→ caller re-fetches parent DTO / refreshes page
→ receives token B
```

That invalidation is intentional for infrequently changing files.

---

## Design Rules

- Generic repos own persistence; generic controllers own REST/application concerns.
- Duplicated CRUD verbs across repo/API are acceptable because their contracts differ.
- Repos do not know permissions or transport DTOs.
- Controllers do not expose EF query expressions over HTTP.
- Entity and DTO remain distinct contracts.
- Nested data is coordinated at the application/API layer, not silently absorbed by the repo.
- Concrete controllers override narrow hooks/policy before replacing generic operation algorithms.
- Multi-repository mutations share one operation-level transaction.
- File identity, checksum, and access capability remain conceptually distinct even when capability derivation uses the checksum.
- Build the reusable bases from real endpoint pressure; avoid speculative framework surface that no concrete endpoint needs yet.

---

## Recommended First Proof

Use the Form Delivery + File endpoint as the first concrete vertical slice.

It exercises:
- controller DTO delivery
- reusable file references
- file capability/checksum semantics
- React → ASP transport
- nested/related resource handling

After that works, extract the genuinely repeated controller/repository mechanics into `A4KController` / `A4KRepo` rather than forcing the endpoint through an unproven abstraction first.
