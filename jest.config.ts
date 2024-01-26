import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["js", "ts"],
  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
  testPathIgnorePatterns: ["node_modules"],
  transform: {
    "^.+\\.ts$": "ts-jest",
    "^.+\\.js$": ["babel-jest", { configFile: "./.babelrc.jest.json" }],
  },
  transformIgnorePatterns: ["/node_modules/(?!@middy/core)"],
  moduleDirectories: ["node_modules", "src"],
  modulePaths: ["node_modules"],
  moduleNameMapper: {
    "^@middy/core$": "<rootDir>/node_modules/@middy/core",
  },
  verbose: true,
  silent: false,
};

export default config;
