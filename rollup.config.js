export default [
  {
    input: "./Wxml2Canvas/index.js",
    output: {
      file: "./dist.js",
      format: "es",
    },
    watch: {
      exclude: ["node_modules/**"],
    },
  },
];
