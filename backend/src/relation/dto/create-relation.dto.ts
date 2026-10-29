import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRelationDto {
  @ApiProperty()
  characterAId: number;

  @ApiProperty()
  characterBId: number;

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
