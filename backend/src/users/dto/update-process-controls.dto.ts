import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateProcessControlsDto {
  @IsOptional()
  @IsBoolean()
  withdrawal?: boolean;

  @IsOptional()
  @IsBoolean()
  transaction?: boolean;

  @IsOptional()
  @IsBoolean()
  deposit?: boolean;
}
