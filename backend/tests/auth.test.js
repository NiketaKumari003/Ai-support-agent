const request = require('supertest');
const express = require('express');

const authRouter = require('../routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth routes', () => {
  it('responds with 400 when required fields are missing on register', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

