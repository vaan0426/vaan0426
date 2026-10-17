const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const base = new URL(process.env.SITE_URL || 'http://localhost:4173/');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function request(route, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.request(new URL(route, base), { method, headers, agent: false }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), ms: Date.now() - start }));
      res.on('error', reject);
    });
    req.setTimeout(5000, () => req.destroy(new Error('Incomplete or blocked HTTP response: ' + route)));
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const routes = ['', 'booking.html', 'events.html', 'packages.html', 'cart.html', 'account.html', 'page.html', 'login.html', 'admin/index.html'];
  for (const route of routes) assert.equal((await request(route)).status, 200, route || 'home');
  const image = 'platform/images/ts-tree-logo.png';
  const expected = hash(fs.readFileSync(path.join(__dirname, '..', image)));
  // Browsers open idle preconnections. One must not block other assets.
  const idle = net.connect({ host: base.hostname, port: Number(base.port || 80) });
  idle.on('error', () => {});
  let results;
  try {
    await new Promise((resolve, reject) => { idle.once('connect', resolve); idle.once('error', reject); });
    results = await Promise.all(Array.from({ length: 6 }, () => request(image)));
    for (const result of results) {
      assert.equal(result.status, 200);
      assert.equal(result.body.length, Number(result.headers['content-length']), 'Every advertised byte arrives');
      assert.equal(hash(result.body), expected, 'Concurrent image responses are identical to the source');
    }
    assert.ok(Math.max(...results.map(r => r.ms)) < 2500, 'Idle clients must not block requests');
  } finally { idle.destroy(); }
  const etag = results[0].headers.etag;
  assert.ok(etag, 'Revalidation requires an ETag');
  const cached = await request(image, 'GET', { 'If-None-Match': etag });
  assert.equal(cached.status, 304);
  assert.equal(cached.body.length, 0, 'An unchanged image is reused without downloading it');
  const head = await request(image, 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body.length, 0);
  assert.equal(Number(head.headers['content-length']), results[0].body.length);
  assert.equal((await request('platform/images/missing-audit.png')).status, 404);
  assert.equal((await request('', 'POST')).status, 405);
  assert.equal((await request('AGENTS.md')).status, 404);
  console.log(JSON.stringify({ pages: routes.length, concurrentImages: results.length, slowestMs: Math.max(...results.map(r => r.ms)), bytesVerifiedPerImage: results[0].body.length, cachedStatus: cached.status, passed: true }));
})().catch(error => { console.error(error); process.exitCode = 1; });
