import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRelationDto {
  @ApiPropertyOptional()
  characterAId?: number;

  @ApiPropertyOptional()
  characterBId?: number;

  @ApiPropertyOptional()
  type?: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiPropertyOptional()
  aToBLabel?: string;

  @ApiPropertyOptional()
  aToBNote?: string;

  @ApiPropertyOptional()
  bToALabel?: string;

  @ApiPropertyOptional()
  bToANote?: string;
}
