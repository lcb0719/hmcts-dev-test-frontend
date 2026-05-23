module.exports = {
  roots: ['<rootDir>/src/test/routes'],
  testRegex: '(/src/test/.*|\\.(test|spec))\\.(ts|js)$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/main/HttpError.ts',
    'src/main/services/**/*.ts',
    'src/main/utils/**/*.ts',
    'src/main/routes/**/*.ts',
  ],
};
