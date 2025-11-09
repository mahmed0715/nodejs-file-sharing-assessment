/**
 * GoogleStorage Provider Unit Tests (Mock Mode)
 * Verifies save, get, and remove behavior in MOCK_GCS=true environment
 */

const fs = require('fs');
const path = require('path');

// Ensure MOCK mode is on before loading class
process.env.MOCK_GCS = 'true';
process.env.CONFIG = path.resolve(__dirname, 'mock-gcs.json');

// Prepare mock config
const mockConfig = {
  projectId: 'mock',
  bucketName: 'mock-bucket',
  credentials: { client_email: 'mock@mock.com', private_key: 'MOCK' }
};
fs.writeFileSync(process.env.CONFIG, JSON.stringify(mockConfig, null, 2));

const GoogleStorage = require('../../services/storage/googleStorage');

describe('GoogleStorage (MOCK mode)', () => {
  const provider = new GoogleStorage(process.env.CONFIG);
  const tmpFile = path.join(__dirname, 'test_upload.txt');
  let keys = {};

  beforeAll(() => {
    fs.writeFileSync(tmpFile, 'hello mock storage');
  });

  afterAll(() => {
    fs.unlinkSync(process.env.CONFIG);
  });

  test('save() returns keys and stores file locally', async () => {
    const result = await provider.save({
      path: tmpFile,
      originalname: 'test_upload.txt',
      mimetype: 'text/plain',
    });

    expect(result.publicKey).toBeDefined();
    expect(result.privateKey).toBeDefined();

    keys = result;
    // ensure mock map contains the file
    const stored = provider.files.get(keys.publicKey);
    expect(stored).toBeDefined();
  });

  test('get() retrieves the saved file and returns path', async () => {
    const meta = await provider.get(keys.publicKey);
    expect(meta).not.toBeNull();
    expect(fs.existsSync(meta.path)).toBe(true);
    const content = fs.readFileSync(meta.path, 'utf8');
    expect(content.includes('hello')).toBe(true);
  });

  test('remove() deletes the file successfully', async () => {
    const result = await provider.remove(keys.privateKey);
    expect(result).toBe(true);

    // should not exist anymore
    const meta = await provider.get(keys.publicKey);
    expect(meta).toBeNull();
  });
});
