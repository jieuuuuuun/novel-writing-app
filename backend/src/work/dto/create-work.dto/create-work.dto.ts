import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateWorkDto {
  @ApiProperty()
  title: string;
  @ApiPropertyOptional()
  subtitle?: string;
  @ApiProperty()
  userId: number;
}
