const request = require('supertest');
const { createApp } = require('../src/app');
const db = require('./db');

const app = createApp();

beforeAll(() => db.connect());
afterEach(() => db.clear());
afterAll(() => db.close());

// Register a user and return { token, user, auth } where `auth` is a helper
// that attaches the bearer header to a supertest request.
const makeUser = async (email) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: email.split('@')[0], email, password: 'secret123' });
  const token = res.body.token;
  return { token, user: res.body.user, header: `Bearer ${token}` };
};

describe('Board role enforcement', () => {
  test('the empty-middleware regression: task routes load and respond', async () => {
    // If boardRole.js were empty again, requiring the tasks route would throw at
    // import time and every task request would 500/crash. A clean 401 proves the
    // middleware chain is wired.
    const res = await request(app).get('/api/tasks/board/000000000000000000000000');
    expect(res.status).toBe(401); // no token → auth middleware, not a crash
  });

  test('owner is admin; viewer can read but not write; member can write; admin can delete', async () => {
    const owner = await makeUser('owner@example.com');
    const viewer = await makeUser('viewer@example.com');
    const member = await makeUser('member@example.com');
    const outsider = await makeUser('outsider@example.com');

    // Owner creates a board (becomes admin).
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', owner.header)
      .send({ title: 'Sprint' });
    expect(boardRes.status).toBe(201);
    const boardId = boardRes.body._id;

    // Invite viewer and member with their roles.
    await request(app).post(`/api/boards/${boardId}/invite`).set('Authorization', owner.header)
      .send({ email: 'viewer@example.com', role: 'viewer' }).expect(200);
    await request(app).post(`/api/boards/${boardId}/invite`).set('Authorization', owner.header)
      .send({ email: 'member@example.com', role: 'member' }).expect(200);

    // A viewer may read tasks...
    const viewerRead = await request(app).get(`/api/tasks/board/${boardId}`).set('Authorization', viewer.header);
    expect(viewerRead.status).toBe(200);
    expect(viewerRead.body.tasks).toEqual([]);

    // ...but may not create them.
    const viewerWrite = await request(app).post(`/api/tasks/board/${boardId}`)
      .set('Authorization', viewer.header).send({ title: 'Nope' });
    expect(viewerWrite.status).toBe(403);

    // A member may create a task.
    const memberWrite = await request(app).post(`/api/tasks/board/${boardId}`)
      .set('Authorization', member.header).send({ title: 'Do the thing' });
    expect(memberWrite.status).toBe(201);
    const taskId = memberWrite.body._id;

    // A member may not delete (admin only).
    const memberDelete = await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', member.header);
    expect(memberDelete.status).toBe(403);

    // The admin/owner may delete.
    const adminDelete = await request(app).delete(`/api/tasks/${taskId}`).set('Authorization', owner.header);
    expect(adminDelete.status).toBe(200);

    // A non-member is denied entirely.
    const outsiderRead = await request(app).get(`/api/tasks/board/${boardId}`).set('Authorization', outsider.header);
    expect(outsiderRead.status).toBe(403);
  });

  test('completedAt clears when a task leaves the done column', async () => {
    const owner = await makeUser('owner2@example.com');
    const boardRes = await request(app).post('/api/boards').set('Authorization', owner.header).send({ title: 'B' });
    const boardId = boardRes.body._id;

    const created = await request(app).post(`/api/tasks/board/${boardId}`)
      .set('Authorization', owner.header).send({ title: 'T', columnId: 'todo' });
    const taskId = created.body._id;

    const done = await request(app).patch(`/api/tasks/${taskId}/move`)
      .set('Authorization', owner.header).send({ columnId: 'done', order: 0 });
    expect(done.body.completedAt).toBeTruthy();

    const reopened = await request(app).patch(`/api/tasks/${taskId}/move`)
      .set('Authorization', owner.header).send({ columnId: 'todo', order: 0 });
    expect(reopened.body.completedAt).toBeFalsy();
  });
});
