/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    moduleNameMapper: {
        "\\.(css|sass|scss)$": "identity-obj-proxy" // Empêche Jest de planter à cause des imports CSS
    },
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    }
};
