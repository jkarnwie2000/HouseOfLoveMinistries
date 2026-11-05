import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { ADMIN, setupTestApp } from './helpers.js';

let ctx;
let admin; // supertest agent that keeps cookies
before(async () => {
  ctx = await setupTestApp();
  admin = request.agent(ctx.app);
});
after(async () => { await ctx.cleanup(); });

// Smallest valid PNG (1x1)
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4b90000000049454e44ae426082', 'hex');

describe('authentication', () => {
  it('blocks admin routes without a session', async () => {
    await request(ctx.app).get('/api/admin/stats').expect(401);
    await request(ctx.app).get('/api/admin/donations').expect(401);
    await request(ctx.app).post('/api/admin/products').send({}).expect(401);
  });

  it('rejects wrong passwords and forged tokens', async () => {
    await request(ctx.app).post('/api/auth/login').send({ email: ADMIN.email, password: 'wrong-password' }).expect(401);
    await request(ctx.app).post('/api/auth/login').send({ email: 'nobody@example.org', password: 'whatever' }).expect(401);
    await request(ctx.app).get('/api/admin/stats').set('Cookie', 'holim_admin=forged.token.value').expect(401);
  });

  it('signs in with an httpOnly cookie', async () => {
    const res = await admin.post('/api/auth/login').send(ADMIN).expect(200);
    assert.equal(res.body.user.role, 'admin');
    const cookie = res.headers['set-cookie'].join(';');
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
    assert.equal(res.body.user.passwordHash, undefined);
    await admin.get('/api/auth/me').expect(200);
  });
});

describe('product management', () => {
  let productId;
  const base = {
    name: 'Placeholder Prayer Journal', description: 'An editable test product.', price: 1850, category: 'bibles',
    sizes: [], colors: [{ name: 'Burgundy', hex: '#6B1E2E' }], inventory: 12, active: true, featured: false,
  };

  it('creates, updates and deletes a product', async () => {
    const created = await admin.post('/api/admin/products').send(base).expect(201);
    productId = created.body.id;
    assert.equal(productId, 'placeholder-prayer-journal');

    const pub = await request(ctx.app).get(`/api/products/${productId}`).expect(200);
    assert.equal(pub.body.price, 1850);

    await admin.put(`/api/admin/products/${productId}`).send({ ...base, price: 2100, description: 'Updated.' }).expect(200);
    const after = await request(ctx.app).get(`/api/products/${productId}`).expect(200);
    assert.equal(after.body.price, 2100);
    assert.equal(after.body.description, 'Updated.');

    await admin.delete(`/api/admin/products/${productId}`).expect(204);
    await request(ctx.app).get(`/api/products/${productId}`).expect(404);
  });

  it('validates and sanitises product input', async () => {
    await admin.post('/api/admin/products').send({ ...base, price: -5 }).expect(400);
    await admin.post('/api/admin/products').send({ ...base, category: 'not-a-category' }).expect(400);
    await admin.post('/api/admin/products').send({ ...base, image: 'javascript:alert(1)' }).expect(400);
    const res = await admin.post('/api/admin/products').send({ ...base, name: '<script>x</script>Clean Name' }).expect(201);
    assert.equal(res.body.name, 'xClean Name');
  });

  it('uploads images and rejects non-images', async () => {
    const ok = await admin.post('/api/admin/uploads').attach('image', PNG, { filename: 'p.png', contentType: 'image/png' }).expect(201);
    assert.match(ok.body.url, /^\/uploads\/.+\.png$/);
    await request(ctx.app).get(ok.body.url).expect(200);
    await admin.post('/api/admin/uploads').attach('image', Buffer.from('<?php echo 1; ?>'), { filename: 'x.png', contentType: 'image/png' }).expect(400);
    await admin.post('/api/admin/uploads').attach('image', Buffer.from('hello'), { filename: 'x.txt', contentType: 'text/plain' }).expect(400);
  });

  it('manages categories and protects categories in use', async () => {
    const c = await admin.post('/api/admin/categories').send({ name: 'Gift Cards', description: 'Test' }).expect(201);
    await admin.put(`/api/admin/categories/${c.body.id}`).send({ name: 'Gift Cards & Vouchers' }).expect(200);
    await admin.delete('/api/admin/categories/caps').expect(409);
    await admin.delete(`/api/admin/categories/${c.body.id}`).expect(204);
  });
});

describe('events, orders and roles', () => {
  it('creates and lists events', async () => {
    const start = new Date(Date.now() + 7 * 864e5).toISOString();
    const res = await admin.post('/api/admin/events').send({
      title: 'Test Revival Night', description: 'Placeholder', startDate: start, location: 'Main Sanctuary', registrationRequired: true, capacity: 2,
    }).expect(201);
    const pub = await request(ctx.app).get('/api/events').expect(200);
    assert.ok(pub.body.some((e) => e.id === res.body.id));

    await request(ctx.app).post(`/api/events/${res.body.id}/register`).send({ name: 'Visitor One', email: 'v1@example.org', attendees: 2 }).expect(201);
    const full = await request(ctx.app).post(`/api/events/${res.body.id}/register`).send({ name: 'Visitor Two', email: 'v2@example.org' }).expect(400);
    assert.match(full.body.error, /not enough places/);
  });

  it('only fulfils paid orders and records history', async () => {
    const order = await ctx.db().create('orders', {
      orderNumber: 'HOL-TEST01', customerName: 'Test', customerEmail: 't@example.org', items: [], subtotal: 0, shippingCost: 0,
      total: 0, currency: 'usd', paymentStatus: 'pending', fulfillmentStatus: 'unfulfilled',
    });
    await admin.patch(`/api/admin/orders/${order.id}/fulfillment`).send({ fulfillmentStatus: 'shipped' }).expect(400);
    await ctx.db().update('orders', order.id, { paymentStatus: 'paid' });
    const res = await admin.patch(`/api/admin/orders/${order.id}/fulfillment`).send({ fulfillmentStatus: 'shipped', trackingNumber: '1Z999' }).expect(200);
    assert.equal(res.body.fulfillmentStatus, 'shipped');
    assert.equal(res.body.fulfillmentHistory.length, 1);
    await admin.patch(`/api/admin/orders/${order.id}/fulfillment`).send({ fulfillmentStatus: 'teleported' }).expect(400);
  });

  it('shows donation totals to admins but not editors', async () => {
    await ctx.db().create('donations', { reference: 'GIFT-T1', donorName: 'X', donorEmail: 'x@example.org', amount: 10000, currency: 'usd', frequency: 'one-time', paymentStatus: 'completed' });
    const res = await admin.get('/api/admin/donations').expect(200);
    assert.equal(res.body.totals.completedAmount, 10000);
    const stats = await admin.get('/api/admin/stats').expect(200);
    assert.equal(stats.body.donations.total, 10000);

    await admin.post('/api/admin/users').send({ name: 'Editor Person', email: 'editor@example.org', role: 'editor', password: 'EditorPass123' }).expect(201);
    const editor = request.agent(ctx.app);
    await editor.post('/api/auth/login').send({ email: 'editor@example.org', password: 'EditorPass123' }).expect(200);
    await editor.get('/api/admin/products').expect(200);
    await editor.get('/api/admin/donations').expect(403);
    await editor.get('/api/admin/users').expect(403);
    const editorStats = await editor.get('/api/admin/stats').expect(200);
    assert.equal(editorStats.body.donations, null);
  });

  it('signs out', async () => {
    await admin.post('/api/auth/logout').expect(200);
    await admin.get('/api/admin/stats').expect(401);
  });
});
