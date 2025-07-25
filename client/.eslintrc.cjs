require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
    tsconfigRootDir: __dirname,
  },
  settings: {
    react: {
      version: "detect",
    },
    "import/resolver": {
      node: {
        paths: ["src"],
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  env: {
    browser: true,
    amd: true,
    node: true,
    es2021: true,
  },
  extends: [
    "plugin:jsx-a11y/recommended",
    "standard",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "prettier",
  ],
  plugins: ["react", "@typescript-eslint", "jsx-a11y", "prettier"],
  ignorePatterns: ["vite-env.d.ts", "node_modules/", "dist/"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/no-unescaped-entities": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/camelcase": "off",
    camelcase: "off",
    "prettier/prettier": "error",
  },
};
