import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestApp } from './helpers.js';

let ctx;
before(async () => { ctx = await setupTestApp(); });
after(async () => { await ctx.cleanup(); });

describe('contact form', () => {
  it('validates required fields', async () => {
    const res = await request(ctx.app).post('/api/contact').send({ name: '', email: 'bad', subject: '', message: 'short' }).expect(400);
    const fields = res.body.details.map((d) => d.field);
    for (const f of ['name', 'email', 'subject', 'message']) assert.ok(fields.includes(f), `expected error for ${f}`);
  });

  it('stores sanitised messages', async () => {
    await request(ctx.app).post('/api/contact').send({
      name: 'Mary Visitor', email: 'Mary@Example.org', subject: 'Prayer request', message: 'Please pray for my family <b>this week</b>.',
    }).expect(201);
    const [msg] = await ctx.db().list('messages');
    assert.equal(msg.email, 'mary@example.org');
    assert.equal(msg.message, 'Please pray for my family this week.');
  });

  it('silently drops honeypot submissions', async () => {
    const before = (await ctx.db().list('messages')).length;
    await request(ctx.app).post('/api/contact').send({
      name: 'Bot', email: 'bot@example.org', subject: 'Spam', message: 'Buy things now please', website: 'http://spam',
    }).expect(201);
    assert.equal((await ctx.db().list('messages')).length, before);
  });
});

describe('newsletter', () => {
  it('subscribes once per email', async () => {
    await request(ctx.app).post('/api/newsletter').send({ email: 'news@example.org' }).expect(201);
    await request(ctx.app).post('/api/newsletter').send({ email: 'NEWS@example.org' }).expect(201);
    assert.equal((await ctx.db().list('subscribers')).length, 1);
    await request(ctx.app).post('/api/newsletter').send({ email: 'nope' }).expect(400);
  });
});

describe('api hygiene', () => {
  it('returns JSON 404s for unknown API routes and rejects malformed JSON', async () => {
    await request(ctx.app).get('/api/does-not-exist').expect(404);
    await request(ctx.app).post('/api/contact').set('Content-Type', 'application/json').send('{bad json').expect(400);
  });

  it('exposes public config without secrets', async () => {
    const res = await request(ctx.app).get('/api/config').expect(200);
    assert.deepEqual(res.body.donation.presets, [10, 25, 50, 100, 250, 500]);
    assert.ok(!JSON.stringify(res.body).includes('sk_test'));
  });

  it('sets security headers', async () => {
    const res = await request(ctx.app).get('/api/health').expect(200);
    assert.ok(res.headers['content-security-policy']);
    assert.equal(res.headers['x-powered-by'], undefined);
  });
});
