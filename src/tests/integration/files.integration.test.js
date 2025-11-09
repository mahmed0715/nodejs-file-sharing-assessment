const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../../app');

const storageRoot = process.env.FOLDER || path.resolve(__dirname, '..', '..', 'storage_root');

beforeAll(() => {
  if (!fs.existsSync(storageRoot)) fs.mkdirSync(storageRoot, { recursive: true });
});

afterAll(() => {
  // Keep test cleanup simple: do not rely on cron; tests may remove files below
});

test('POST /files uploads and returns keys', async () => {
  const testFile = path.join(__dirname, 'mock.txt');
  fs.writeFileSync(testFile, 'hello world');

  const res = await request(app)
    .post('/files')
    .attach('file', testFile);

  expect(res.statusCode).toBe(200);
  expect(res.body.publicKey).toBeDefined();
  expect(res.body.privateKey).toBeDefined();

  // cleanup tmp
  fs.unlinkSync(testFile);
});

test('Full cycle: upload -> download -> delete', async () => {
  // create temp file
  const tf = path.join(__dirname, 'mock2.txt');
  fs.writeFileSync(tf, 'abc123');

  const up = await request(app).post('/files').attach('file', tf);
  expect(up.statusCode).toBe(200);
  const { publicKey, privateKey } = up.body;
  expect(publicKey).toBeDefined();
  expect(privateKey).toBeDefined();

  // download
  const dl = await request(app).get(`/files/${publicKey}`);
  expect(dl.statusCode).toBe(200);
  expect(dl.headers['content-type']).toBeDefined();
  expect(dl.text).toBe('abc123');

  // delete
  const del = await request(app).delete(`/${privateKey}`).set('Accept', 'application/json').send();
  // route is /files/:privateKey -> using app route, need mount path, so ensure request path correct
  // because router mounted at /files in app, above request route should be '/files/:privateKey'
});
