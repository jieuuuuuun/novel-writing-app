import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('HTTP JSON body limit', () => {
  const mainSource = readFileSync(
    resolve(process.cwd(), 'src/main.ts'),
    'utf8',
  );

  it('keeps a 1mb JSON body limit instead of the Express 100kb default', () => {
    expect(mainSource).toMatch(/JSON_BODY_LIMIT\s*=\s*['"]1mb['"]/);
    expect(mainSource).toMatch(/bodyParser:\s*false/);
    expect(mainSource).toMatch(
      /useBodyParser\(\s*['"]json['"]\s*,\s*\{\s*limit:\s*JSON_BODY_LIMIT\s*\}\s*\)/,
    );
  });

  it('does not stack a second express.json parser on the default 100kb parser', () => {
    expect(mainSource).not.toMatch(/app\.use\(\s*json\(/);
    expect(mainSource).not.toMatch(/express\.json\(/);
  });
});
