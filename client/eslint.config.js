import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-plugin-prettier";

export default [
  {
    ignores: [
      "vite-env.d.ts",
      "node_modules/",
      "dist/",
      "*.config.js",
      "*.config.cjs",
      "*.config.ts",
      "postcss.config.js",
      "tailwind.config.js",
      "vite.config.ts",
      ".eslintrc.cjs",
      "eslint.config.js",
      "package.json",
      "package-lock.json",
      "tsconfig.json",
      "tsconfig.node.json",
      "*.md",
      "*.json",
      "*.lock",
      "*.sh",
      "*.png",
      "*.jpg",
      "*.jpeg",
      "*.svg",
      "*.env*",
      "*.html",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      prettier,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/camelcase": "off",
      camelcase: "off",
      "prettier/prettier": "error",
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        node: {
          paths: ["src"],
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json",
      },
      globals: {
        window: "readonly",
        document: "readonly",
      },
    },
  },
];
