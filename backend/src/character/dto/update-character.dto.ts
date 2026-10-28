import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCharacterDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  role?: string;

  @ApiPropertyOptional()
  age?: string;

  @ApiPropertyOptional()
  occupation?: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiPropertyOptional()
  goal?: string;

  @ApiPropertyOptional()
  trauma?: string;

  @ApiPropertyOptional()
  weakness?: string;

  @ApiPropertyOptional()
  lack?: string;

  @ApiPropertyOptional()
  quote?: string;
}
