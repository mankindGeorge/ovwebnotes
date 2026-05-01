import { IsString, IsOptional } from 'class-validator';

export class MoveFileDto {
  @IsString()
  sourcePath: string;

  @IsString()
  targetFolder: string;

  @IsString()
  @IsOptional()
  repositoryId?: string;
}
