# W-2 Many Problems

A privacy-focused, client-side personal finance planner for US tax residents.  
**Live Demo:** [https://dustinbs.github.io/W-2ManyProblems/](https://dustinbs.github.io/W-2ManyProblems/)

## Overview

This application acts as a dynamic alternative to static Excel/Google Sheets for financial planning. It specializes in handling **mid-year income changes** (weighted salary calculations) and complex tiered employer matching logic.

### Key Features
*   **Timeline Income Engine:** Calculates weighted gross income based on exact dates for raises/promotions.
*   **2026 Tax Estimation:** Built-in Federal (Single/MFJ), FICA (SS/Medicare), and State tax calculations for all 50 states.
*   **Retirement Planning:** Supports complex 401(k)/403(b) matching rules (e.g., "50% up to $2,400" or "100% on first 3%").
*   **FIRE Metrics:** Real-time calculation of Financial Independence numbers based on the 3% withdrawal rule.
*   **Privacy First:** No backend. All data is persisted in `localStorage` or exported as JSON.

---

## Technical Architecture

### Stack
*   **Frontend:** React 19 + Vite 6
*   **Styling:** Tailwind CSS 3
*   **State Management:** React `useReducer` (Redux-lite pattern)
*   **Deployment:** GitHub Actions -> GitHub Pages

### Project Structure
```
src/
├── components/         # UI Panels (Inputs, Charts, Results)
├── engine/             # Core Logic (The "Brain")
│   ├── taxEngine.js       # Federal/State/FICA logic
│   ├── incomeTimeline.js  # Date-weighted salary math
│   ├── retirementMatch.js # 401k/403b matching tiers
│   └── fireCalc.js        # Compound interest & FIRE math
├── state/              # App State
│   ├── reducer.js         # Single source of truth for app state
│   └── persistence.js     # localStorage & JSON export/import
└── utils/              # Formatting helpers
```

### Core Concepts

#### 1. The Timeline Engine (`src/engine/incomeTimeline.js`)
Unlike simple calculators that assume `Salary / 12`, this engine creates "segments" of income based on dates.
*   **Input:** Array of `{ effectiveDate, baseSalary }`.
*   **Process:** Calculates days active in the fiscal year for each salary segment.
*   **Output:** Weighted Annual Salary = $\sum (\text{DailyRate}_i \times \text{DaysActive}_i)$.

#### 2. The Tax Engine (`src/engine/taxEngine.js`)
*   **Stateless:** Pure functions taking taxable income and returning tax liability.
*   **Data:** Contains hardcoded 2026 bracket estimates and state tax logic.
*   **Extensiblity:** Can accept overrides via the `TaxConfigPanel` for future years without code changes.

#### 3. State Management (`src/state/reducer.js`)
The app uses a monolithic state object. Action dispatching updates the state, which triggers a re-calc of all engines in `App.jsx`.
*   **Why?** Ensures consistency. Changing a 401k contribution affects:
    1.  Taxable Income (Tax Engine)
    2.  Net Income (Results Panel)
    3.  Savings Rate (FIRE Engine)
    4.  Wealth Projection (Charts)

---

## Development & Maintenance

### Setup
```bash
npm install
npm run dev
```

### Updating Tax Rates
**Option A (User Interface):** Use the "Advanced Tax Configuration" panel in the app to manually edit brackets and limits. These persist in local storage.

**Option B (Codebase):**
1.  Navigate to `src/engine/taxEngine.js`.
2.  Update `FEDERAL_BRACKETS_2026`, `STANDARD_DEDUCTION_2026`, or `SS_WAGE_BASE_2026`.
3.  Commit and push. GitHub Actions will auto-deploy.

### Adding Features
1.  **State:** Add new field to `DEFAULT_STATE` in `src/state/reducer.js`.
2.  **UI:** Create a component in `src/components/`.
3.  **Engine:** Add calculation logic in `src/engine/`.
4.  **Integration:** Wire it up in `App.jsx` inside the `useMemo` hooks.
