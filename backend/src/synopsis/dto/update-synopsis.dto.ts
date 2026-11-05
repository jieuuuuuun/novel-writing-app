import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSynopsisDto {
  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiPropertyOptional()
  beginning?: string;

  @ApiPropertyOptional()
  development?: string;

  @ApiPropertyOptional()
  crisis?: string;

  @ApiPropertyOptional()
  ending?: string;

  @ApiPropertyOptional()
  memo?: string;
}
