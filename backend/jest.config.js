module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  coverageDirectory: '<rootDir>/tests/coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  collectCoverageFrom: [
    'src/controllers/*.js',
    'src/middleware/*.js',
    'src/utils/*.js',
    '!src/utils/auditoria.js'
  ]
};
