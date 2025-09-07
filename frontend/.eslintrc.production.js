module.exports = {
  extends: ['./eslint.config.mjs'],
  rules: {
    // Production-specific overrides
    'no-console': 'off', // Allow console in scripts and development debugging
    '@typescript-eslint/no-unused-vars': 'off', // Don't fail build on unused vars (they can be cleaned later)
    '@typescript-eslint/no-explicit-any': 'off', // Don't fail on any types for rapid development
    'import/no-anonymous-default-export': 'off',
    'react/no-unescaped-entities': 'off',
    'react-hooks/exhaustive-deps': 'warn',
  },
  // Override ignores for production build
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'dist/',
    'build/',
    '**/__tests__/**',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    'src/scripts/**', // Allow analysis scripts to have console logs
  ]
}
