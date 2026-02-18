/**
 * App state reducer
 * Single useReducer to handle all complex timeline, benefit, and financial state
 */

export const DEFAULT_STATE = {
  // Income mode: 'simple' or 'timeline'
  incomeMode: 'simple',

  // Simple mode fields
  annualSalary: 115000,
  annualBonus: 0,

  // Timeline mode fields
  timelineEvents: [
    { id: 1, effectiveDate: '2026-01-01', baseSalary: 115000, oneTimeBonus: 0 },
  ],
  timelineYear: 2026,

  // Tax settings
  filingStatus: 'single', // 'single' or 'mfj'
  stateCode: 'WA',
  stateOverrideRate: null, // null = use built-in, number = override
  useStateOverride: false,

  // Pre-tax deductions
  medicalPremium: 736, // annual
  hsaContribution: 3400, // annual
  hsaAccountType: 'individual', // 'individual' or 'family'

  // 401k / 403b
  retirementType: '401k', // '401k' or '403b'
  matchTemplateId: 'custom',
  customMatchTiers: [
    { matchRate: 0.5, upToPercent: 100, maxMatchDollars: 2400 },
  ],
  customFlatPercent: 0,
  employeeContribution: 24150, // annual dollar amount
  employeeCatchUp: false, // age 50+

  // After-tax investments
  rothIRA: 7000,
  hysa: 0,
  brokerage: 0,

  // FIRE settings
  annualExpenses: 50000,
  currentSavings: 0,
  withdrawalRate: 0.03,
  expectedReturn: 0.07,
  inflationRate: 0.03,
  projectionYears: 30,

  // Custom Tax Configuration
  customTaxConfig: {
    enabled: false,
    standardDeduction: { single: 15000, mfj: 30000 },
    ssWageBase: 176100,
    federalBrackets: {
      single: [
        { min: 0, max: 11925, rate: 0.10 },
        { min: 11925, max: 48475, rate: 0.12 },
        { min: 48475, max: 103350, rate: 0.22 },
        { min: 103350, max: 197300, rate: 0.24 },
        { min: 197300, max: 250525, rate: 0.32 },
        { min: 250525, max: 626350, rate: 0.35 },
        { min: 626350, max: Infinity, rate: 0.37 },
      ],
      mfj: [
        { min: 0, max: 23850, rate: 0.10 },
        { min: 23850, max: 96950, rate: 0.12 },
        { min: 96950, max: 206700, rate: 0.22 },
        { min: 206700, max: 394600, rate: 0.24 },
        { min: 394600, max: 501050, rate: 0.32 },
        { min: 501050, max: 751600, rate: 0.35 },
        { min: 751600, max: Infinity, rate: 0.37 },
      ],
    },
  },
};

export const ACTIONS = {
  SET_FIELD: 'SET_FIELD',
  SET_INCOME_MODE: 'SET_INCOME_MODE',
  ADD_TIMELINE_EVENT: 'ADD_TIMELINE_EVENT',
  UPDATE_TIMELINE_EVENT: 'UPDATE_TIMELINE_EVENT',
  REMOVE_TIMELINE_EVENT: 'REMOVE_TIMELINE_EVENT',
  SET_MATCH_TEMPLATE: 'SET_MATCH_TEMPLATE',
  ADD_CUSTOM_TIER: 'ADD_CUSTOM_TIER',
  UPDATE_CUSTOM_TIER: 'UPDATE_CUSTOM_TIER',
  REMOVE_CUSTOM_TIER: 'REMOVE_CUSTOM_TIER',
  UPDATE_TAX_CONFIG: 'UPDATE_TAX_CONFIG',
  LOAD_STATE: 'LOAD_STATE',
  RESET_STATE: 'RESET_STATE',
};

export function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_FIELD:
      return { ...state, [action.field]: action.value };


    case ACTIONS.SET_INCOME_MODE:
      return { ...state, incomeMode: action.value };

    case ACTIONS.ADD_TIMELINE_EVENT: {
      const maxId = state.timelineEvents.reduce((m, e) => Math.max(m, e.id), 0);
      return {
        ...state,
        timelineEvents: [
          ...state.timelineEvents,
          {
            id: maxId + 1,
            effectiveDate: action.effectiveDate || '2026-07-01',
            baseSalary: action.baseSalary || state.annualSalary,
            oneTimeBonus: action.oneTimeBonus || 0,
          },
        ],
      };
    }

    case ACTIONS.UPDATE_TIMELINE_EVENT:
      return {
        ...state,
        timelineEvents: state.timelineEvents.map((e) =>
          e.id === action.id ? { ...e, [action.field]: action.value } : e
        ),
      };

    case ACTIONS.REMOVE_TIMELINE_EVENT:
      if (state.timelineEvents.length <= 1) return state;
      return {
        ...state,
        timelineEvents: state.timelineEvents.filter((e) => e.id !== action.id),
      };

    case ACTIONS.SET_MATCH_TEMPLATE:
      return { ...state, matchTemplateId: action.value };

    case ACTIONS.ADD_CUSTOM_TIER: {
      return {
        ...state,
        customMatchTiers: [
          ...state.customMatchTiers,
          { matchRate: 0.5, upToPercent: 6 },
        ],
      };
    }

    case ACTIONS.UPDATE_CUSTOM_TIER:
      return {
        ...state,
        customMatchTiers: state.customMatchTiers.map((t, i) =>
          i === action.index ? { ...t, [action.field]: action.value } : t
        ),
      };

    case ACTIONS.REMOVE_CUSTOM_TIER:
      return {
        ...state,
        customMatchTiers: state.customMatchTiers.filter((_, i) => i !== action.index),
      };

    case ACTIONS.UPDATE_TAX_CONFIG:
      return {
        ...state,
        customTaxConfig: {
          ...state.customTaxConfig,
          [action.field]: action.value,
        },
      };

    case ACTIONS.LOAD_STATE:
      return { ...DEFAULT_STATE, ...action.state };

    case ACTIONS.RESET_STATE:
      return { ...DEFAULT_STATE };

    default:
      return state;
  }
}
