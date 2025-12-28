# Replace Y/N “Individual dice?” with 3 dice options (1/2/3)

This document describes a UI + logic change for the TRS-80 Model 100 BASIC port of **Stocks & Bonds (3M, 1972 rules)**.

## Goal

Instead of asking:

- `Individual dice? (Y/N)`

…prompt the user to choose **one of three dice schemes** that map directly to the rulebook’s “standard” and “optional” dice variants.

This reduces ambiguity (players don’t have to remember what “Y” means) and makes the rules explicit at game start.

---

## The three options

### Option 1: Standard (default rules)
- **Every year (including Year 1):** roll **one** dice total (2d6) and apply the corresponding table to **all** securities.
- If the game has a Close year, treat Close like a normal “posting” year for prices (unless your design suppresses dividends/trading for Close).

**Summary:** single-roll-for-all, always.

### Option 2: Hybrid optional
- **Year 1 only:** roll **individually per security**.
- **Years 2–10:** roll **one** dice total for **all** securities.

**Summary:** Year 1 per-security, then single-roll-for-all.

### Option 3: Full individual optional (with 2/12 override)
- **Every year:** roll **individually per security**.
- **Override rule:** if **any** security’s roll is a **2** or **12**, then that result becomes the roll for **all** securities for that year (i.e., overwrite the per-security rolls for that year).

**Summary:** per-security always, but a 2/12 “locks” the year to that value for all.

---

## New startup UI

### Recommended screen text (40-column safe)

```
Dice mode:
1 Std (1 roll all yrs)
2 Y1 ind, then 1 roll
3 Ind every yr (2/12=all)
Choose (1-3):
```

### Input handling
- Use `INKEY$` loop (consistent with the rest of your UI).
- Accept `1`, `2`, `3` only.
- Optionally allow `ESC` to cancel back to Players prompt.

---

## Data model (2-char vars + sigil)

Introduce one controlling variable for dice scheme:

- `DM%` = dice mode (1/2/3)

Recommended mapping:
- `DM%=1` → Option 1 (standard)
- `DM%=2` → Option 2 (hybrid)
- `DM%=3` → Option 3 (full individual + override)

Avoid repurposing `MD%` if you want to keep old code readable. If you must reuse `MD%`, document the new meaning clearly.

---

## Behavior mapping (how to compute rolls)

### Common helpers (conceptual)
- `DI%` = the single “global” roll for the year (2–12) when in single-roll mode
- `DI%(S%)` = per-security roll (2–12) for `S% = 2..10` when in individual mode
- `OV%` = override roll value (0 or 2 or 12) for option 3
- `SS%` = “single-stock apply” flag used by your table reader (optional, only if your table code supports per-stock updates)

### Determine which roll method to use each year
At the start of each year’s price posting logic, compute:

- `IR%` (initial-year flag): `IR% = (YR%=1)`  
  (only needed if you want Year 1 to be special for option 2)

Then choose:

#### DM%=1 (standard)
- Always compute `DI% = 2d6`
- Apply the year’s table to all securities using `DI%`

#### DM%=2 (hybrid)
- If `YR%=1`:
  - compute per-security rolls `DI%(S%) = 2d6` for S%=2..10
  - apply per-security table results
- Else:
  - compute `DI% = 2d6`
  - apply to all

#### DM%=3 (full individual + override)
- Always compute per-security rolls `DI%(S%) = 2d6` for S%=2..10
- Scan for `2` or `12`:
  - if any `DI%(S%)=2`, set `OV%=2` immediately
  - else if any `DI%(S%)=12`, set `OV%=12`
- If `OV%>0`, overwrite: `DI%(S%)=OV%` for all S%=2..10
- Apply per-security table results (or apply-to-all using `OV%` if your code prefers)

---

## What to display on the “Year prices” screen

To keep the UI honest:

- If the year used a **single global roll** (DM%=1, or DM%=2 with YR%>1):
  - show `D: <DI%>`
- If the year used **individual rolls**:
  - show `D: IND`
- If the year used **individual rolls but override triggered** (DM%=3 and OV%>0):
  - show `D: <OV%>` (since effectively the year is a single-roll year)

This matches what a player needs to know without dumping 9 roll numbers.

---

## Impacted code areas (search targets)

Update the startup prompt section:

- Find: `Individual dice? (Y/N)`
- Replace with: `Dice mode: 1/2/3`

Update the price posting routine to select roll behavior by `DM%`.

Search for:
- `MD%` checks
- any `IR%` logic
- per-security roll loops `FOR S%=2 TO 10: DI%(S%)=...`

…and gate them with `DM%` logic above.

---

## Minimal regression checklist

Run these quick tests:

### Option 1
- Year 1 shows `D:<n>` not `IND`.
- Only one roll affects all stocks.

### Option 2
- Year 1 shows `IND`.
- Year 2 shows `D:<n>`.

### Option 3
- Most years show `IND`.
- If any 2 or 12 appears, display shows `D:2` or `D:12` (not IND), and all securities behave like that roll.

### All options
- Situation card effects are applied before split checks and before the final year display.
- Splits round up on odd prices.

---

## Notes for Codex

- Keep variable names to **2 characters + sigil** (e.g., `DM%`, `OV%`, `DI%`, `SS%`, `IR%`).
- Use `INKEY$` loops for responsiveness and to avoid `INPUT` line-edit overhead.
- Avoid nested single-line `IF ... THEN IF ... ELSE ...` chains; they’re brittle on M100 BASIC. Prefer explicit branches.
