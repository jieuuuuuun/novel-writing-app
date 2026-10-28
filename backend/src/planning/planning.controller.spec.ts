import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PlanningController } from './planning.controller.js';
import type { PlanningService } from './planning.service.js';

describe('PlanningController', () => {
  let controller: PlanningController;

  beforeEach(() => {
    controller = new PlanningController({} as PlanningService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects every planning endpoint with the JWT guard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PlanningController,
    ) as unknown[] | undefined;

    expect(guards).toContain(JwtAuthGuard);
  });
});
