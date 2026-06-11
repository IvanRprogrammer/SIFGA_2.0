const mockExecute = jest.fn();
const mockPool = {
  execute: mockExecute,
  query: jest.fn(),
  getConnection: jest.fn()
};

const pool = mockPool;
module.exports = pool;
module.exports.mockExecute = mockExecute;
