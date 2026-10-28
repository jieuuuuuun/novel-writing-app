import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CharacterController } from './character.controller.js';
import type { CharacterService } from './character.service.js';

describe('CharacterController', () => {
  let controller: CharacterController;

  beforeEach(() => {
    controller = new CharacterController({} as CharacterService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects every character endpoint with the JWT guard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      CharacterController,
    ) as unknown[] | undefined;

    expect(guards).toContain(JwtAuthGuard);
  });
});
