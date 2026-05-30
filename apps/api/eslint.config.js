import base from "@repo/config/eslint";

export default [
  ...base,
  {
    // NestJS leans on decorators + DI; relax a couple of rules that fight that.
    rules: {
      "@typescript-eslint/no-extraneous-class": "off",
      "@typescript-eslint/interface-name-prefix": "off",
    },
  },
];
