import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateEpisodeDto {
    @ApiPropertyOptional()
    title?: string;
    @ApiPropertyOptional()
    content?: string;
    @ApiPropertyOptional()
    sortOrder?:number;
}
