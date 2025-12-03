import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// 1️⃣ Mock all dependencies first
jest.unstable_mockModule('../src/services/userServices.js', () => ({
  getUserById: jest.fn(),
  createUser: jest.fn(),
}));
// jest.unstable_mockModule('../src/middlewares/requireAuth.js', () => ({
//   default: (req, res, next) => next(),
// }));
jest.unstable_mockModule('../src/middlewares/verifyInternal.js', () => ({
  default: (req, res, next) => next(),
}));
jest.unstable_mockModule('../src/middlewares/validateRequest.js', () => ({
  validate: () => (req, res, next) => {
    req.validated = req.body;
    next();
  },
}));

// 2️⃣ Import after mocks are in place
const userService = await import('../src/services/userServices.js');
const router = (await import('../src/routes/userRoutes.js')).default;

// 3️⃣ Set up app
const app = express();
app.use(express.json());
app.use('/users', router);


describe('User Controller API', () => {
  afterEach(() => jest.clearAllMocks());

  test('GET /users?email= returns 400 if missing query', async () => {
    const res = await request(app).get('/users');
    expect(res.status).toBe(400);
  });

  test('GET /users/:id returns user when found', async () => {
    userService.getUserById.mockResolvedValue({ id: '1', email: 'a@b.com' });
    const res = await request(app).get('/users/1');
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('a@b.com');
  });

  test('GET /users/:id returns 404 when not found', async () => {
    userService.getUserById.mockResolvedValue(null);
    const res = await request(app).get('/users/999');
    expect(res.status).toBe(404);
  });

  test('POST /users creates new user (internal call)', async () => {
    userService.createUser.mockResolvedValue({ status: 201, body: { id: 'u1' } });
    const res = await request(app).post('/users').send({
      email: 'x@y.com',
      username: 'userx',
      phoneNumber: '12345',
      passwordHash: 'hash',
      role: 'gardener',
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('u1');
  });
});
