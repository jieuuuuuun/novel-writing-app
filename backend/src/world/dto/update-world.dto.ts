import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorldCustomFieldDto {
  @ApiPropertyOptional()
  id?: number;

  @ApiProperty()
  label: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  sortOrder: number;
}

export class UpdateWorldDto {
  @ApiPropertyOptional()
  era?: string;

  @ApiPropertyOptional()
  places?: string;

  @ApiPropertyOptional()
  atmosphere?: string;

  @ApiProperty({ type: [UpdateWorldCustomFieldDto] })
  customFields: UpdateWorldCustomFieldDto[];
}
