import { IsString, IsUrl, IsOptional, IsBoolean } from 'class-validator';

export class CreateRepositoryDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  branch?: string;

  @IsString()
  @IsOptional()
  folder?: string;
}

export class UpdateRepositoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUrl()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  branch?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
