const request = require('supertest');
const { createApp } = require('../src/app');
const db = require('./db');

const app = createApp();

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.close());

const validUser = { name: 'Ada', email: 'ada@example.com', password: 'secret123' };

describe('Auth', () => {
  test('registers a user and returns a token without the password', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('ada@example.com');
    expect(res.body.user.password).toBeUndefined();
  });

  test('rejects duplicate email', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.status).toBe(409);
  });

  test('rejects invalid email and short password', async () => {
    const bad = await request(app).post('/api/auth/register').send({ ...validUser, email: 'nope' });
    expect(bad.status).toBe(400);
    const short = await request(app).post('/api/auth/register').send({ ...validUser, password: '123' });
    expect(short.status).toBe(400);
  });

  test('logs in with correct credentials and rejects wrong ones', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const ok = await request(app).post('/api/auth/login').send({ email: validUser.email, password: validUser.password });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();

    const bad = await request(app).post('/api/auth/login').send({ email: validUser.email, password: 'wrong' });
    expect(bad.status).toBe(401);
  });

  test('/me requires a valid token', async () => {
    const reg = await request(app).post('/api/auth/register').send(validUser);

    const noToken = await request(app).get('/api/auth/me');
    expect(noToken.status).toBe(401);

    const withToken = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${reg.body.token}`);
    expect(withToken.status).toBe(200);
    expect(withToken.body.email).toBe(validUser.email);
  });
});
