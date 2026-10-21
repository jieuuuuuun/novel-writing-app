import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { WorkController } from './work.controller.js';
import type { WorkService } from './work.service.js';

describe('WorkController', () => {
  let controller: WorkController;

  beforeEach(() => {
    controller = new WorkController({} as WorkService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects every work endpoint with the JWT guard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, WorkController) as
      | unknown[]
      | undefined;

    expect(guards).toContain(JwtAuthGuard);
  });
});
