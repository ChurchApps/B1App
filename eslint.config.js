import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import unusedImports from "eslint-plugin-unused-imports";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  { ignores: ["node_modules/", "dist/", "build/", ".next/", "coverage/", "*.config.js"] },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "unused-imports": unusedImports,
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin
    },
    rules: {
      "prefer-const": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { args: "all", argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "unused-imports/no-unused-imports": "error",
      "no-trailing-spaces": "error",
      "eol-last": ["error", "always"],
      quotes: ["error", "double", { avoidEscape: true, allowTemplateLiterals: true }],
      semi: ["error", "always"],
      "comma-dangle": ["error", "never"],
      indent: ["warn", 2, { SwitchCase: 1 }],
      "comma-spacing": ["error", { before: false, after: true }],
      "key-spacing": ["error", { beforeColon: false, afterColon: true, mode: "strict" }],
      "keyword-spacing": ["error", { before: true, after: true }],
      "space-infix-ops": "error",
      "no-multi-spaces": ["error", { ignoreEOLComments: true }],
      "block-spacing": ["error", "always"],
      "brace-style": ["error", "1tbs", { allowSingleLine: true }],
      curly: ["error", "multi-line"],
      "nonblock-statement-body-position": ["error", "beside"],
      "object-curly-spacing": ["error", "always"],
      "object-curly-newline": ["error", { ObjectExpression: { multiline: true }, ObjectPattern: { multiline: true }, ImportDeclaration: { multiline: true }, ExportDeclaration: { multiline: true } }],
      "object-property-newline": ["error", { allowAllPropertiesOnSameLine: true }],
      "array-bracket-spacing": ["error", "never"],
      "array-bracket-newline": ["error", { multiline: true, minItems: 8 }],
      "array-element-newline": ["error", { ArrayExpression: "consistent", ArrayPattern: { minItems: 8 } }],
      "function-paren-newline": ["error", "consistent"],
      "function-call-argument-newline": ["error", "consistent"],
      "max-len": ["warn", { code: 250, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true, ignoreUrls: true, ignoreRegExpLiterals: true }],
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "off"
    }
  }
];
