import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import sonarjs from "eslint-plugin-sonarjs";
import security from "eslint-plugin-security";
import playwright from "eslint-plugin-playwright";
import vitest from "eslint-plugin-vitest";
import unicorn from "eslint-plugin-unicorn";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  sonarjs.configs.recommended,
  security.configs.recommended,
  // Playwright only for e2e tests
  {
    files: ["tests/e2e/**"],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      "playwright/no-conditional-in-test": "off",
      "playwright/no-wait-for-navigation": "off",
      "playwright/no-skipped-test": "off",
      "playwright/no-networkidle": "off",
      "playwright/prefer-web-first-assertions": "off",
      "playwright/no-conditional-expect": "off",
    }
  },
  // Vitest only for unit tests
  {
    files: ["tests/**", "**/*.test.ts", "**/*.spec.ts"],
    ignores: ["tests/e2e/**"], // Exclude e2e from vitest
    ...vitest.configs.recommended,
    rules: {
      ...vitest.configs.recommended.rules,
      "sonarjs/no-hardcoded-passwords": "off",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off",
      "security/detect-non-literal-regexp": "off",
      "playwright/no-conditional-in-test": "off",
      "playwright/no-wait-for-navigation": "off",
      "playwright/no-skipped-test": "off",
      "playwright/no-networkidle": "off",
      "sonarjs/no-os-command-from-path": "off",
    }
  },
  unicorn.configs['flat/recommended'],
  {
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports,
    },
    rules: {
      ...importPlugin.flatConfigs.recommended.rules,
      "no-unused-vars": "off", // or "@typescript-eslint/no-unused-vars": "off",
      "sonarjs/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          "vars": "all",
          "varsIgnorePattern": "^_",
          "args": "after-used",
          "argsIgnorePattern": "^_",
        },
      ],
      // Unicorn overrides
      "unicorn/prevent-abbreviations": "off",
      "unicorn/filename-case": "off",
      "unicorn/no-null": "off", // React uses null often
      "unicorn/prefer-top-level-await": "off", // Not always supported
      "unicorn/no-array-reduce": "off",
      "unicorn/no-array-callback-reference": "off",
      "unicorn/prefer-module": "off",
      "unicorn/prefer-dom-node-text-content": "off",
      "unicorn/no-await-expression-member": "off",
      "unicorn/prefer-single-call": "off",
      "unicorn/no-immediate-mutation": "off",
      "unicorn/no-array-sort": "off",
      "sonarjs/no-nested-template-literals": "off",
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/concise-regex": "off",
      "security/detect-object-injection": "off",
      "security/detect-non-literal-regexp": "off",
      "security/detect-non-literal-fs-filename": "off",
      "unicorn/prefer-dom-node-text-content": "off",
      "sonarjs/pseudo-random": "off",
      "sonarjs/no-nested-conditional": "off",
      "unicorn/no-nested-ternary": "off",
      "unicorn/no-array-reverse": "off",
      "playwright/no-wait-for-selector": "off",
      "sonarjs/no-hardcoded-passwords": "off",
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
      'import/core-modules': ['contentlayer/generated'],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".contentlayer/**",
  ]),
]);

export default eslintConfig;
