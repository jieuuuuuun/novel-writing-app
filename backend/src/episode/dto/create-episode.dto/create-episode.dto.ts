import { ApiProperty } from "@nestjs/swagger";

export class CreateEpisodeDto {
  @ApiProperty()
  workId:number;
  @ApiProperty()
  title: string;
  @ApiProperty()
  content: string;
  @ApiProperty()
  sortOrder:number;
}
