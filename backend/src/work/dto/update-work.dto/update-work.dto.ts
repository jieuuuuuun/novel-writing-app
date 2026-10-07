import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateWorkDto {
  @ApiPropertyOptional()
  title?:string;
  @ApiPropertyOptional()
  subtitle?:string;
}
