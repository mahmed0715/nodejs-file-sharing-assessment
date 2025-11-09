const fs = require('fs');
const path = require('path');
const LocalStorage = require('../../services/storage/localStorage');

const tmpRoot = path.resolve(__dirname, '..', '..', '..', 'test_data');

beforeAll(() => {
  if (!fs.existsSync(tmpRoot)) fs.mkdirSync(tmpRoot, { recursive: true });
});

afterAll(() => {
  // cleanup test_data
  try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (e) {}
});

test('LocalStorage save/get/remove', async () => {
  const storage = new LocalStorage(tmpRoot);
  const sampleFile = path.join(tmpRoot, 'sample.txt');
  fs.writeFileSync(sampleFile, 'xyz');

  const res = await storage.save({
    path: sampleFile,
    originalname: 'sample.txt',
    mimetype: 'text/plain',
    size: 3
  });

  expect(res.publicKey).toBeDefined();
  expect(res.privateKey).toBeDefined();

  const meta = await storage.get(res.publicKey);
  expect(meta).not.toBeNull();
  expect(meta.originalname).toBe('sample.txt');

  const removed = await storage.remove(res.privateKey);
  expect(removed).toBe(true);

  const meta2 = await storage.get(res.publicKey);
  expect(meta2).toBeNull();
});
