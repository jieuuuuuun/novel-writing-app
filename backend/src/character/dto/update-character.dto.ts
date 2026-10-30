import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCharacterProfileDto {
  @ApiPropertyOptional()
  height?: string;

  @ApiPropertyOptional()
  bodyType?: string;

  @ApiPropertyOptional()
  hair?: string;

  @ApiPropertyOptional()
  eyes?: string;

  @ApiPropertyOptional()
  skin?: string;

  @ApiPropertyOptional()
  fashion?: string;

  @ApiPropertyOptional()
  feature?: string;

  @ApiPropertyOptional()
  appearanceNote?: string;

  @ApiPropertyOptional()
  personality?: string;

  @ApiPropertyOptional()
  likes?: string;

  @ApiPropertyOptional()
  dislikes?: string;

  @ApiPropertyOptional()
  secret?: string;

  @ApiPropertyOptional()
  habits?: string;

  @ApiPropertyOptional()
  speechMannerism?: string;

  @ApiPropertyOptional()
  signature?: string;
}

export class UpdateCharacterCustomFieldDto {
  @ApiPropertyOptional()
  id?: number;

  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  sortOrder: number;
}

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

  @ApiPropertyOptional({ type: UpdateCharacterProfileDto })
  profile?: UpdateCharacterProfileDto;

  @ApiPropertyOptional({ type: [UpdateCharacterCustomFieldDto] })
  customFields?: UpdateCharacterCustomFieldDto[];
}
