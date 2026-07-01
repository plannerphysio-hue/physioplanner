import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Migrated clinical/UI copy (pt/en) uses plain quotes and apostrophes
      // in JSX text throughout — cosmetic lint rule, not a real defect.
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
