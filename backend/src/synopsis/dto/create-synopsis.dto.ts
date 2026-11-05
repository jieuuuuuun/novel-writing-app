import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSynopsisDto {
  @ApiPropertyOptional()
  title?: string;
}
