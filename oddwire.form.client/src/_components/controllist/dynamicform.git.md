# Brief — Dynamic Form

**Scope:** Feature
**Domain:** oddform
**Status:** Active

---

## What it is

A form page that loads a JSON form definition through a context accessor, renders its control tree by dispatching each control on `type`, holds each edited value in local page state, and reports every change by `param`.

---

## Core Loop

```
getForm(id) → render form.controls via ControlList → ControlItem dispatches by type → user edits → onChange(value, param) → FormPage patches values[param] → re-render
```

Inputs: **form definition** (JSON control tree, loaded via `FormContext.getForm`)
Output: **live values map** — `Record<param, value>` held in `FormPage` state; lost on refresh.

Config-driven render; instance overlay and real context folder-scan/navigation still unbuilt (Stages 3–4).

---

## Driving Values

| Value | What drives it | What it does |
|---|---|---|
| `type` | Definition config | Selects the renderer in `ControlItem`; unknown → fallback |
| `param` | Definition config | Key a change is written under in the values map |
| `value` | Definition default + user edits | Current control value |
| `hidden` | Definition config | Skips rendering when true (gated in `ControlItem`) |
| `valueType` | Text control config | On-screen keyboard hint (text/int/decimal/email/phone) |
| `controls` | Radio/Dropdown config | Static option list |

---

## User Loop

| Input | Action | Reward | Risk |
|---|---|---|---|
| Control props | Fill / toggle / select a control | Value reflected live in the readout bubble | Memory-only — edits lost on refresh; duplicate params share one value |

---

## Class Responsibility

| Class | Owns |
|---|---|
| `FormContext` | `getForm(id)` accessor — durable load pathway (stub returns `testform.json`) |
| `FormPage` | Loads the definition, local values state, root onChange |
| `ControlList` | Iterates a control scope, resolves each live value — no type knowledge |
| `ControlItem` | Dispatches one control by `type`; fallback on unknown |
| `StripLayout` | Headered tablet-portrait page shell |
| (controls) | Leaf rendering + onChange — see `controls.git.md` |
