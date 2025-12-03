export default {
  testEnvironment: "node",
  transform: {}, // no Babel; pure Node ESM
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1", // allows ESM relative imports
  },
};
