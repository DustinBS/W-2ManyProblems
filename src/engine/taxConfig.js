// Dynamic tax rates configuration
// Allows overriding the hardcoded 2026 constants

export const TAX_CONFIG = {
  // Override federal brackets
  federalBrackets: {
    single: null, // Array of { min, max, rate }
    mfj: null,
  },
  // Override standard deduction
  standardDeduction: {
    single: null,
    mfj: null,
  },
  // Override FICA limits
  ssWageBase: null,
};
