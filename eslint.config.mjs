import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // dsh-pet 0.4.0 原样拷贝，不按本站规则改。
    "public/dafeiyu/helper/vendor/**",
    "public/dsh-pet-7340/**",
  ]),
]);

export default eslintConfig;
