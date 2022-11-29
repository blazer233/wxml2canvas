import { terser } from "rollup-plugin-terser";
import cleanup from "rollup-plugin-cleanup";
export default [
  {
    input: "./Wxml2Canvas/index.js",
    plugins: [terser(), cleanup()],
    output: {
      file: "./dist.js",
      format: "es",
      compact: true,
    },
    watch: {
      exclude: ["node_modules/**"],
    },
  },
];
