import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('WorkWorldSetting schema', () => {
  const schema = readFileSync(
    resolve(process.cwd(), 'prisma/schema.prisma'),
    'utf8',
  );

  it('adds a 1:0..1 reverse relation on Work', () => {
    expect(schema).toMatch(/worldSetting\s+WorkWorldSetting\?/);
  });

  it('cascades Work delete to WorkWorldSetting and custom fields', () => {
    expect(schema).toMatch(
      /work\s+Work\s+@relation\(\s*fields:\s*\[workId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\s*\)/,
    );
    expect(schema).toMatch(
      /setting\s+WorkWorldSetting\s+@relation\(\s*fields:\s*\[settingId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\s*\)/,
    );
  });

  it('does not introduce advanced world models', () => {
    expect(schema).not.toMatch(/model WorldCategory/);
    expect(schema).not.toMatch(/model WorldItem/);
    expect(schema).not.toMatch(/model WorldMap/);
    expect(schema).not.toMatch(/model WorldOrganization/);
    expect(schema).not.toMatch(/model WorldCountry/);
    expect(schema).not.toMatch(/model WorldTimeline/);
  });
});
