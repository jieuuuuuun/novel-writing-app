import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { shouldSetupSwagger } from './swagger.util.js';

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

describe('Swagger setup', () => {
  const mainSource = readFileSync(
    resolve(process.cwd(), 'src/main.ts'),
    'utf8',
  );

  it('enables Swagger outside production', () => {
    expect(shouldSetupSwagger('development')).toBe(true);
    expect(shouldSetupSwagger('test')).toBe(true);
    expect(shouldSetupSwagger(undefined)).toBe(true);
  });

  it('disables Swagger in production', () => {
    expect(shouldSetupSwagger('production')).toBe(false);
  });

  it('only registers the Swagger UI when shouldSetupSwagger is true', () => {
    expect(mainSource).toMatch(/if\s*\(\s*shouldSetupSwagger\(\)\s*\)/);
    expect(mainSource).toMatch(/SwaggerModule\.setup\(\s*['"]api['"]/);
  });
});
