import { jest } from '@jest/globals';

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

// Mock the pool so that connect() returns our mockClient
const mockPool = {
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue(mockClient),
  end: jest.fn(),
};

jest.unstable_mockModule('../src/db.js', () => ({
  dbPool: mockPool,
}));

// Import after the mock is registered
const userService = await import('../src/services/userServices.js');

describe('userService', () => {
  afterEach(() => jest.clearAllMocks());

  test('getUserByEmail returns user when found', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });
    const result = await userService.getUserByEmail('test@example.com');
    expect(result).toEqual(mockUser);
  });

  test('getUserByEmail returns null when not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const result = await userService.getUserByEmail('none@example.com');
    expect(result).toBeNull();
  });

  // test('createUser handles conflict and returns 409', async () => {
  //   mockClient.query
  //     .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // conflict found
  //     .mockResolvedValueOnce({ rows: [] });         // rollback or dummy query

  //   const result = await userService.createUser({
  //     email: 'conflict@example.com',
  //     username: 'dup',
  //     phoneNumber: '123',
  //     passwordHash: 'hash',
  //     role: 'gardener',
  //   });

  //   expect(result.status).toBe(409);
  // });


  test('deleteUser returns 200 when row updated', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 1 });
    const result = await userService.deleteUser('uuid-123');
    expect(result.status).toBe(200);
  });

  test('deleteUser returns 404 when no user', async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 0 });
    const result = await userService.deleteUser('uuid-999');
    expect(result.status).toBe(404);
  });
});
