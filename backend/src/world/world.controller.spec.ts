import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { WorldController } from './world.controller.js';
import type { WorldService } from './world.service.js';

describe('WorldController', () => {
  let controller: WorldController;

  beforeEach(() => {
    controller = new WorldController({} as WorldService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects every world endpoint with the JWT guard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      WorldController,
    ) as unknown[] | undefined;

    expect(guards).toContain(JwtAuthGuard);
  });
});
