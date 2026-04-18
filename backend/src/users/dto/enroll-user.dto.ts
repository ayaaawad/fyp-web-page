import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class EnrollUserDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{4,32}$/)
  userId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\d{4,12}$/)
  pin!: string;

  @IsOptional()
  @IsString()
  @IsIn(['customer'])
  role?: 'customer';

  @IsArray()
  @ArrayMinSize(128)
  @ArrayMaxSize(128)
  @IsNumber({}, { each: true })
  vector!: number[];

  @IsOptional()
  @IsString()
  machineId?: string;
}
