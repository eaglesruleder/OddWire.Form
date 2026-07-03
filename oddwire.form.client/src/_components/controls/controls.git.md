# Brief — Form Controls

**Scope:** Subsystem
**Domain:** oddform
**Status:** Active

---

## What it is

A library of stateless leaf form controls that render a label+field row through a shared `ControlBase` and report edits through a common `onChange(value, param)` contract.

---

## Core Loop

```
Receive props → ControlBase lays out label + field → user edits field → onChange(value, param) → parent owns the value
```

Inputs: **CoreControlProps** (param, label, value, hidden, stacked, onChange) + per-control extras
Output: **onChange(value, param)** — controls are stateless; the parent holds the value.

---

## Driving Values

| Value | What drives it | What it does |
|---|---|---|
| `hidden` | props | ControlBase renders nothing when true |
| `stacked` | props | Label above (column) vs label-left row |
| `valueType` | ControlTextField | Derives the input's keyboard hint |
| `controls` | Radio/Dropdown | Static option list |
| `className` | ControlText | Opt-in block style (e.g. `bubble`) |

---

## Class Responsibility

| Class | Owns |
|---|---|
| `ControlBase` | Label+field row layout + hidden gate |
| `ControlText` | Static read-only text (label = separator, value = dump) |
| `ControlTextField` | Single-line input; raw string; keyboard hint |
| `ControlTextArea` | Multi-line input; always stacked |
| `ControlCheckbox` | Boolean; own row (label fills, box right) |
| `ControlRadio` | Static single-select radio group |
| `ControlDropdown` | Static single-select dropdown |
