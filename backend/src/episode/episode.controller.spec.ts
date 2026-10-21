import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { EpisodeController } from './episode.controller.js';
import type { EpisodeService } from './episode.service.js';

describe('EpisodeController', () => {
  let controller: EpisodeController;

  beforeEach(() => {
    controller = new EpisodeController({} as EpisodeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects every episode endpoint with the JWT guard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, EpisodeController) as
      | unknown[]
      | undefined;

    expect(guards).toContain(JwtAuthGuard);
  });
});
