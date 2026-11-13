import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** 单测用。业务代码不写 .ts 后缀，Node 直接跑测试时补上。 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const file = path.join(root, specifier.slice(2));
    const withExt = /\.[a-z0-9]+$/i.test(file) ? file : `${file}.ts`;
    return nextResolve(pathToFileURL(withExt).href, context);
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[a-z0-9]+$/i.test(specifier)) {
    return nextResolve(`${specifier}.ts`, context);
  }
  return nextResolve(specifier, context);
}
