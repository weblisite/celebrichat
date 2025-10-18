/** @jest-environment node */
import { generateSignedUploadURL, verifyToken, getPublicUrlForKey } from '@/lib/storage';

describe('Neon Storage signed upload', () => {
  beforeAll(() => {
    process.env.NEON_STORAGE_SECRET = 'test-secret';
    process.env.NEON_STORAGE_BUCKET = 'b';
    process.env.NEON_STORAGE_PUBLIC_BASE_URL = 'https://cdn.example.com';
  });

  it('generates a token with expected payload', () => {
    const signed = generateSignedUploadURL({
      eventId: '11111111-1111-1111-1111-111111111111',
      filename: 'My Photo.JPG',
      contentType: 'image/jpeg',
      contentLength: 1024,
      userId: 'u1',
    });
    expect(signed.token).toBeTruthy();
    const payload: any = verifyToken(signed.token);
    expect(payload.eid).toBe('11111111-1111-1111-1111-111111111111');
    expect(payload.ct).toBe('image/jpeg');
    expect(payload.key).toMatch(/^events\/11111111-1111-1111-1111-111111111111\//);
    const url = getPublicUrlForKey(payload.key);
    expect(url).toBe(`https://cdn.example.com/b/${payload.key}`);
  });

  it('rejects unsupported type and oversize files', () => {
    expect(() =>
      generateSignedUploadURL({
        eventId: 'e1',
        filename: 'a.gif',
        contentType: 'image/gif',
        contentLength: 10,
        userId: 'u1',
      }),
    ).toThrow('Unsupported content type');

    expect(() =>
      generateSignedUploadURL({
        eventId: 'e1',
        filename: 'a.jpg',
        contentType: 'image/jpeg',
        contentLength: 10 * 1024 * 1024 + 1,
        userId: 'u1',
      }),
    ).toThrow('File too large');
  });
});
