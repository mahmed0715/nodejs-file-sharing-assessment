/**
 * Integration test for Google provider (mock mode)
 * Uses Express endpoints through Supertest with MOCK_GCS=true
 */

const request = require('supertest');
const fs = require('fs');
const path = require('path');

process.env.PROVIDER = 'google';
process.env.MOCK_GCS = 'true';
process.env.CONFIG = path.resolve(__dirname, 'mock-gcs-config.json');

// Create a mock config file
const mockConfig = {
  projectId: 'mock',
  bucketName: 'mock-bucket',
  credentials: { client_email: 'mock@mock.com', private_key: 'MOCK' }
};
fs.writeFileSync(process.env.CONFIG, JSON.stringify(mockConfig, null, 2));

const app = require('../../app');

describe('GoogleStorage API (MOCK mode)', () => {
  const testFile = path.join(__dirname, 'mock_upload.txt');
  let publicKey, privateKey;

  beforeAll(() => fs.writeFileSync(testFile, 'mock integration data'));
  afterAll(() => {
    fs.unlinkSync(testFile);
    fs.unlinkSync(process.env.CONFIG);
  });

  it('POST /files uploads and returns keys', async () => {
    const res = await request(app).post('/files').attach('file', testFile);
    expect(res.statusCode).toBe(200);
    expect(res.body.publicKey).toBeDefined();
    expect(res.body.privateKey).toBeDefined();
    publicKey = res.body.publicKey;
    privateKey = res.body.privateKey;
  });

  it('GET /files/:publicKey downloads the file', async () => {
    const res = await request(app).get(`/files/${publicKey}`);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('mock integration data');
  });

  it('DELETE /files/:privateKey removes the file', async () => {
    const res = await request(app).delete(`/files/${privateKey}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /files/:publicKey returns 404 after delete', async () => {
    const res = await request(app).get(`/files/${publicKey}`);
    expect(res.statusCode).toBe(404);
  });
});
