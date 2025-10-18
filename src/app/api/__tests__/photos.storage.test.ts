/** @jest-environment node */
import { POST as postUploadUrl } from '@/app/api/photos/upload-url/route';
import { POST as storageCallback } from '@/app/api/photos/storage-callback/route';

// Mock DB service createPhoto
jest.mock('@/services/photos', () => ({
  __esModule: true,
  createPhoto: async ({ eventId, url }: any) => ({ id: 'p1', eventId, url }),
}));

describe('Photos storage flow', () => {
  beforeAll(() => {
    process.env.NEON_STORAGE_SECRET = 'test-secret';
    process.env.NEON_STORAGE_BUCKET = 'b';
    process.env.NEON_STORAGE_PUBLIC_BASE_URL = 'https://cdn.example.com';
  });

  it('generates signed upload then handles callback', async () => {
    const uploadReq = new Request('http://localhost/api/photos/upload-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-neon-auth-role': 'vendor' },
      body: JSON.stringify({
        eventId: '11111111-1111-1111-1111-111111111111',
        filename: 'pic.png',
        contentType: 'image/png',
        bytes: 2048,
      }),
    });
    const uploadRes = await postUploadUrl(uploadReq as any);
    expect(uploadRes.status).toBe(201);
    const { data: signed } = await uploadRes.json();
    expect(signed.token).toBeTruthy();

    const callbackReq = new Request('http://localhost/api/photos/storage-callback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: signed.token, key: signed.key, size: 2048, contentType: 'image/png' }),
    });
    const callbackRes = await storageCallback(callbackReq as any);
    expect(callbackRes.status).toBe(201);
    const json = await callbackRes.json();
    expect(json.data.eventId).toBe('11111111-1111-1111-1111-111111111111');
    expect(json.data.url).toBe(`https://cdn.example.com/b/${signed.key}`);
  });
});
