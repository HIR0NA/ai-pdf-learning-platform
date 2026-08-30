import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { consumeRateLimit } from '../src/lib/rate-limit.ts';
import {
  exceedsUploadRequestLimit,
  getClientAddress,
  isSafeStoredDocumentFilename,
  MAX_UPLOAD_REQUEST_SIZE,
  resolveStoredDocumentPaths,
} from '../src/lib/security.ts';

const validFilename = '5ede3d2e-389a-4ffa-a57b-47dfd86f1858.pdf';

test('stored PDF filename accepts generated UUID names only', () => {
  assert.equal(isSafeStoredDocumentFilename(validFilename), true);
  for (const value of [
    '../package.json',
    '..%2Fpackage.json',
    '5ede3d2e-389a-4ffa-a57b-47dfd86f1858.pdf/../../package.json',
    '5ede3d2e-389a-4ffa-a57b-47dfd86f1858.exe',
    'package.json',
  ]) {
    assert.equal(isSafeStoredDocumentFilename(value), false, value);
  }
});

test('resolved document artifacts stay inside the upload root', () => {
  const root = path.resolve('test-uploads');
  const paths = resolveStoredDocumentPaths(validFilename, root);
  for (const artifact of [paths.pdfPath, paths.textPath, paths.indexPath]) {
    assert.equal(artifact.startsWith(`${root}${path.sep}`), true);
  }
  assert.throws(() => resolveStoredDocumentPaths('../package.json', root));
});

test('forwarded IP spoofing is ignored unless a trusted proxy is configured', () => {
  const first = new Headers({ 'x-forwarded-for': '198.51.100.10' });
  const spoofed = new Headers({ 'x-forwarded-for': '203.0.113.99' });
  assert.equal(getClientAddress(first, { trustProxy: false }), 'direct-client');
  assert.equal(getClientAddress(spoofed, { trustProxy: false }), 'direct-client');
  assert.equal(
    getClientAddress(new Headers({ 'x-forwarded-for': '198.51.100.10, 10.0.0.3' }), {
      trustProxy: true,
      trustedProxyHops: 1,
    }),
    '10.0.0.3',
  );
});

test('rate limiter blocks request 11 without trusting a spoofed IP', async () => {
  const originalRedisUrl = process.env.REDIS_URL;
  delete process.env.REDIS_URL;
  const key = `test-${crypto.randomUUID()}`;
  try {
    for (let request = 1; request <= 10; request += 1) {
      assert.equal((await consumeRateLimit(key, 10, 60)).allowed, true);
    }
    assert.equal((await consumeRateLimit(key, 10, 60)).allowed, false);
  } finally {
    if (originalRedisUrl) process.env.REDIS_URL = originalRedisUrl;
  }
});

test('oversized upload requests are classified for HTTP 413 handling', () => {
  assert.equal(
    exceedsUploadRequestLimit(new Headers({ 'content-length': String(MAX_UPLOAD_REQUEST_SIZE + 1) })),
    true,
  );
  assert.equal(
    exceedsUploadRequestLimit(new Headers({ 'content-length': String(MAX_UPLOAD_REQUEST_SIZE) })),
    false,
  );
});

test('regression: auth bypass and unsafe file retention code are absent', async () => {
  const authRoute = await readFile('src/app/api/auth/[...nextauth]/route.ts', 'utf8');
  const authConfig = await readFile('src/lib/auth.ts', 'utf8');
  const fileRoute = await readFile('src/app/api/files/[filename]/route.ts', 'utf8');
  assert.equal(authConfig.includes("credentials.email === 'admin'"), false);
  assert.equal(authConfig.includes("credentials.password === 'admin'"), false);
  assert.equal(authRoute.includes('export const authOptions'), false);
  assert.equal(fileRoute.includes("userId !== 'admin-123'"), false);
  assert.equal(fileRoute.includes('DO NOT delete physical files'), false);
  assert.equal(fileRoute.includes('resolveStoredDocumentPaths'), true);
  assert.equal(fileRoute.includes('fs.unlink(pdfPath)'), true);
});

test('Groq GPT-OSS 120B provider is wired through API, UI, and Docker configuration', async () => {
  const providerSource = await readFile('src/lib/ai-provider.ts', 'utf8');
  const dashboardSource = await readFile('src/app/dashboard/page.tsx', 'utf8');
  const composeSource = await readFile('docker-compose.yml', 'utf8');
  const envExample = await readFile('.env.example', 'utf8');

  assert.match(providerSource, /'groq'/);
  assert.match(providerSource, /openai\/gpt-oss-120b/);
  assert.match(providerSource, /https:\/\/api\.groq\.com\/openai\/v1/);
  assert.match(providerSource, /process\.env\.GROQ_API_KEY/);
  assert.match(providerSource, /function getGroqClient\(\)/);
  assert.match(providerSource, /client\.chat\.completions\.create/);
  assert.match(dashboardSource, /'groq'/);
  assert.match(composeSource, /GROQ_API_KEY/);
  assert.match(envExample, /GROQ_MODEL="openai\/gpt-oss-120b"/);
  assert.doesNotMatch(providerSource, /'openai'\s*\|/);
  assert.doesNotMatch(providerSource, /'grok'\s*\|/);
  assert.doesNotMatch(providerSource, /process\.env\.OPENAI_API_KEY/);
  assert.doesNotMatch(providerSource, /process\.env\.XAI_API_KEY/);
  assert.doesNotMatch(dashboardSource, /'openai'\s*\|/);
  assert.doesNotMatch(dashboardSource, /'grok'\s*\|/);
  assert.doesNotMatch(composeSource, /OPENAI_API_KEY|XAI_API_KEY/);
  assert.doesNotMatch(envExample, /OPENAI_API_KEY|XAI_API_KEY/);
});

test('RBAC is enforced by proxy, admin API, page, menu, and seeded roles', async () => {
  const proxySource = await readFile('src/proxy.ts', 'utf8');
  const adminApiSource = await readFile('src/app/api/admin/overview/route.ts', 'utf8');
  const adminPageSource = await readFile('src/app/admin/page.tsx', 'utf8');
  const navbarSource = await readFile('src/components/Navbar.tsx', 'utf8');
  const seedSource = await readFile('seed_admin.js', 'utf8');

  assert.match(proxySource, /pathname\.startsWith\('\/api\/admin'\)/);
  assert.match(proxySource, /status: 403/);
  assert.match(adminApiSource, /isAdmin\(session\.user\.role\)/);
  assert.match(adminApiSource, /status: 403/);
  assert.match(adminPageSource, /forbidden\(\)/);
  assert.match(navbarSource, /session\?\.user\.role === 'ADMIN'/);
  assert.match(navbarSource, /Admin Console/);
  assert.match(navbarSource, /Student Overview/);
  assert.match(seedSource, /prefix: 'ADMIN'/);
  assert.match(seedSource, /prefix: 'STUDENT'/);
  assert.doesNotMatch(seedSource, /Student@Study2026/);
});
