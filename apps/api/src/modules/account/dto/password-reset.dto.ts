import { IsEmail, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

export class ConfirmPasswordResetDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @Length(4, 8)
  code!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;
}
