import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RelationController } from './relation.controller.js';
import type { RelationService } from './relation.service.js';

describe('RelationController', () => {
  let controller: RelationController;

  beforeEach(() => {
    controller = new RelationController({} as RelationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects every relation endpoint with the JWT guard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      RelationController,
    ) as unknown[] | undefined;

    expect(guards).toContain(JwtAuthGuard);
  });
});
