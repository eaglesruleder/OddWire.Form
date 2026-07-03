# Brief — Dynamic Form

**Scope:** Feature
**Domain:** oddform
**Status:** Active

---

## What it is

A form page that renders a fixed set of typed controls into a centered tablet-portrait strip, holds each edited value in local page state, and reports every change by `param`.

---

## Core Loop

```
Render hard-coded controls → user edits a control → control emits onChange(value, param) → FormPage patches values[param] → re-render
```

Inputs: **control props** (param, label, value, type-specific config)
Output: **live values map** — `Record<param, value>` held in `FormPage` state; lost on refresh.

One render tree; no JSON renderer, instance overlay, or context yet (Stages 2–4 unbuilt).

---

## Driving Values

| Value | What drives it | What it does |
|---|---|---|
| `param` | Control config | Key a change is written under in the values map |
| `value` | Initial state + user edits | Current control value |
| `hidden` | Control config | Skips rendering when true |
| `stacked` | Control config | Label-above vs label-left layout |
| `valueType` | ControlTextField config | On-screen keyboard hint (text/int/decimal/email/phone) |
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
| `FormPage` | Hard-coded control tree, local values state, root onChange |
| `StripLayout` | Headered tablet-portrait page shell |
| (controls) | Leaf rendering + onChange — see `controls.git.md` |
