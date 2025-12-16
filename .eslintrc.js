module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended", "airbnb-base"],
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "no-console": "off",
    "no-underscore-dangle": ["error", { allow: ["_id"] }],
    "no-unused-vars": ["error", { argsIgnorePattern: "next" }],
    "max-classes-per-file": "off",
    "func-names": "off",
  },
};
