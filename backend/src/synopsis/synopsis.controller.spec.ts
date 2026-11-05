import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SynopsisController } from './synopsis.controller.js';
import type { SynopsisService } from './synopsis.service.js';

describe('SynopsisController', () => {
  let controller: SynopsisController;

  beforeEach(() => {
    controller = new SynopsisController({} as SynopsisService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects every synopsis endpoint with the JWT guard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      SynopsisController,
    ) as unknown[] | undefined;

    expect(guards).toContain(JwtAuthGuard);
  });

  it('registers GET /current before GET /:synopsisId', () => {
    const currentPath = Reflect.getMetadata(
      PATH_METADATA,
      SynopsisController.prototype.findCurrent,
    );
    const currentMethod = Reflect.getMetadata(
      METHOD_METADATA,
      SynopsisController.prototype.findCurrent,
    );
    const detailPath = Reflect.getMetadata(
      PATH_METADATA,
      SynopsisController.prototype.findOne,
    );

    expect(currentPath).toBe('current');
    expect(currentMethod).toBe(RequestMethod.GET);
    expect(detailPath).toBe(':synopsisId');
  });
});
