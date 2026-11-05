import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { setupTestApp } from './helpers.js';

let ctx;
before(async () => { ctx = await setupTestApp(); });
after(async () => { await ctx.cleanup(); });

describe('catalogue', () => {
  it('lists the six store categories', async () => {
    const res = await request(ctx.app).get('/api/categories').expect(200);
    assert.deepEqual(res.body.map((c) => c.id), ['t-shirts', 'sweaters-hoodies', 'caps', 'bangers', 'bibles', 'key-holders']);
  });

  it('filters products by category', async () => {
    const res = await request(ctx.app).get('/api/products?category=caps').expect(200);
    assert.ok(res.body.length > 0);
    assert.ok(res.body.every((p) => p.category === 'caps'));
  });

  it('searches products by keyword', async () => {
    const res = await request(ctx.app).get('/api/products?q=hoodie').expect(200);
    assert.ok(res.body.length > 0);
    assert.ok(res.body.every((p) => /hoodie/i.test(`${p.name} ${p.description} ${p.category}`)));
    assert.ok(!res.body.some((p) => p.category === 't-shirts'));
    const none = await request(ctx.app).get('/api/products?q=zzznotaproduct').expect(200);
    assert.equal(none.body.length, 0);
  });

  it('hides inactive products', async () => {
    await ctx.db().update('products', 'outreach-team-tee', { active: false });
    const res = await request(ctx.app).get('/api/products').expect(200);
    assert.ok(!res.body.some((p) => p.id === 'outreach-team-tee'));
    await request(ctx.app).get('/api/products/outreach-team-tee').expect(404);
    await ctx.db().update('products', 'outreach-team-tee', { active: true });
  });

  it('returns upcoming events, rolling weekly services forward', async () => {
    await ctx.db().update('events', 'sunday-worship', { startDate: '2020-01-05T15:00:00.000Z', endDate: '2020-01-05T17:00:00.000Z' });
    const res = await request(ctx.app).get('/api/events').expect(200);
    const sunday = res.body.find((e) => e.id === 'sunday-worship');
    assert.ok(sunday, 'recurring service should still be listed');
    assert.ok(new Date(sunday.endDate) > new Date());
    assert.equal(new Date(sunday.startDate).getUTCDay(), 0);
  });
});

describe('server-side cart pricing', () => {
  it('uses trusted prices and ignores client-supplied prices', async () => {
    const res = await request(ctx.app).post('/api/cart/quote').send({
      items: [{ productId: 'love-never-fails-tee', quantity: 2, size: 'M', color: 'Burgundy', price: 1 }],
      shippingOption: 'standard',
    }).expect(200);
    assert.equal(res.body.lines[0].unitPrice, 2500);
    assert.equal(res.body.subtotal, 5000);
    assert.equal(res.body.shipping, 695);
    assert.equal(res.body.total, 5695);
  });

  it('applies free standard shipping over the threshold', async () => {
    const res = await request(ctx.app).post('/api/cart/quote').send({
      items: [{ productId: 'heritage-hoodie', quantity: 2, size: 'L', color: 'Burgundy' }],
      shippingOption: 'standard',
    }).expect(200);
    assert.equal(res.body.subtotal, 9600);
    assert.equal(res.body.shipping, 0);
  });

  it('merges duplicate lines', async () => {
    const res = await request(ctx.app).post('/api/cart/quote').send({
      items: [
        { productId: 'pocket-bible', quantity: 1, color: 'Tan' },
        { productId: 'pocket-bible', quantity: 2, color: 'Tan' },
      ],
      shippingOption: 'pickup',
    }).expect(200);
    assert.equal(res.body.lines.length, 1);
    assert.equal(res.body.lines[0].quantity, 3);
    assert.equal(res.body.shipping, 0);
  });

  it('rejects invalid sizes and colors', async () => {
    await request(ctx.app).post('/api/cart/quote').send({
      items: [{ productId: 'love-never-fails-tee', quantity: 1, size: 'XXXL', color: 'Burgundy' }],
    }).expect(400);
    await request(ctx.app).post('/api/cart/quote').send({
      items: [{ productId: 'love-never-fails-tee', quantity: 1, size: 'M', color: 'Purple' }],
    }).expect(400);
  });

  it('rejects quantities above available stock', async () => {
    await ctx.db().update('products', 'blessed-dad-cap', { inventory: 2 });
    const res = await request(ctx.app).post('/api/cart/quote').send({
      items: [{ productId: 'blessed-dad-cap', quantity: 3, color: 'Tan' }],
    }).expect(400);
    assert.match(res.body.error, /Only 2/);
  });

  it('rejects unknown products, empty carts and bad quantities', async () => {
    await request(ctx.app).post('/api/cart/quote').send({ items: [{ productId: 'nope', quantity: 1 }] }).expect(400);
    await request(ctx.app).post('/api/cart/quote').send({ items: [] }).expect(400);
    await request(ctx.app).post('/api/cart/quote').send({ items: [{ productId: 'pocket-bible', quantity: 0, color: 'Tan' }] }).expect(400);
    await request(ctx.app).post('/api/cart/quote').send({ items: [{ productId: 'pocket-bible', quantity: 999, color: 'Tan' }] }).expect(400);
  });
});
