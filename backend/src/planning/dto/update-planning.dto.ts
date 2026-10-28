import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePlanningCustomFieldDto {
  @ApiPropertyOptional()
  id?: number;

  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  sortOrder: number;
}

export class UpdatePlanningDto {
  @ApiPropertyOptional()
  genre?: string;

  @ApiPropertyOptional()
  subgenre?: string;

  @ApiPropertyOptional()
  targetAudience?: string;

  @ApiPropertyOptional()
  keywords?: string;

  @ApiPropertyOptional()
  logline?: string;

  @ApiPropertyOptional()
  introduction?: string;

  @ApiProperty({ type: [UpdatePlanningCustomFieldDto] })
  customFields: UpdatePlanningCustomFieldDto[];
}
