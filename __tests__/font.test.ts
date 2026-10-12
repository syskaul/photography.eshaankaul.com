/**
 * @jest-environment node
 */
import { getPaperMono } from '@/app/font';

describe('Paper Mono OG font', () => {
  it('loads the bundled TrueType font', async () => {
    const { fontFamily, fonts } = await getPaperMono();

    expect(fontFamily).toBe('PaperMono');
    expect(fonts).toHaveLength(1);
    expect(fonts[0]).toMatchObject({
      name: fontFamily,
      weight: 400,
      style: 'normal',
    });
    expect(fonts[0].data.readUInt32BE(0)).toBe(0x00010000);
  });

});
