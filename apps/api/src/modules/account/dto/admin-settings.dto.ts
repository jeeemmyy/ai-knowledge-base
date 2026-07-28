import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAdminSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  apiKey?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  fromEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fromName?: string;
}

export class TestEmailDto {
  @IsEmail()
  @MaxLength(320)
  to!: string;
}
