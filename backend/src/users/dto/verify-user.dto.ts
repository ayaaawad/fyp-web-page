import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsString,
  Matches,
} from 'class-validator';

export class VerifyUserDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{4,32}$/)
  userId!: string;

  @IsArray()
  @ArrayMinSize(128)
  @ArrayMaxSize(128)
  @IsNumber({}, { each: true })
  liveVector!: number[];

  @IsString()
  machineId!: string;

  @IsString()
  @IsIn([
    'withdrawal',
    'transaction',
    'deposit',
    'balance-inquiry',
    'pin-change',
    'simulation',
  ])
  transactionType!:
    | 'withdrawal'
    | 'transaction'
    | 'balance-inquiry'
    | 'deposit'
    | 'pin-change'
    | 'simulation';
}
