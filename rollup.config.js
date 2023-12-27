// rollup.config.js
import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";
import pkg from "./package.json";
import sourcemaps from 'rollup-plugin-sourcemaps';

const extensions = [".js", ".jsx", ".ts", ".tsx"];

export default {
  input: "index.ts", 
  output: [
    {
      file: "lib/cjs/index.js",
      format: "cjs", // CommonJS format for Node.js
      sourcemap: true,
    },
    {
      file: "lib/index.js",
      format: "esm", // ES module format for modern browsers
      sourcemap: true,
    },
  ],
  watch: {
    include: '*',
  },
  plugins: [
    json(),
    typescript(), // Compile TypeScript
    resolve({ preferBuiltins: true, extensions }), // Resolve module paths
    commonjs(), // Convert CommonJS modules to ES6
    sourcemaps(),
    babel({ extensions, include: ["*"], babelHelpers: "bundled" }), // Transpile to ES5 and include polyfills
  ],
  external: Object.keys(pkg.dependencies || {}), // Don't bundle dependencies
};