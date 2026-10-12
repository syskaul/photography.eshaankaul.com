import { awsS3Delete } from '@/platforms/storage/aws-s3';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  DeleteObjectCommand: jest.fn().mockImplementation(input => ({ input })),
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));
jest.mock('@vercel/oidc-aws-credentials-provider', () => ({
  awsCredentialsProvider: jest.fn(),
}));
jest.mock('@/platforms/storage', () => ({
  generateStorageId: jest.fn(),
}));

describe('S3 upload cleanup', () => {
  beforeEach(() => mockSend.mockReset());

  it('propagates deletion failures instead of reporting success', async () => {
    const failure = new Error('S3 deletion rejected');
    mockSend.mockRejectedValue(failure);
    await expect(awsS3Delete('upload-original.jpeg')).rejects.toBe(failure);
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      input: expect.objectContaining({ Key: 'upload-original.jpeg' }),
    }));
  });

  it('waits for deletion to finish before resolving', async () => {
    let resolveDeletion: ((value: object) => void) | undefined;
    mockSend.mockReturnValue(new Promise(resolve => {
      resolveDeletion = resolve;
    }));
    let finished = false;
    const deletion = awsS3Delete('upload-original.jpeg').then(() => {
      finished = true;
    });
    await Promise.resolve();
    expect(finished).toBe(false);
    resolveDeletion?.({});
    await deletion;
    expect(finished).toBe(true);
  });
});
