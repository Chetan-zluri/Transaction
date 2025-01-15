module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    branches: 80,
  },
    preset: 'ts-jest',
    verbose:true,
    silent:false,
    testEnvironment: 'node',
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  };
  