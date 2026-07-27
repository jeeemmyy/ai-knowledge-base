import { IsString, Length } from 'class-validator';

export class ConfirmVerificationDto {
  @IsString()
  @Length(4, 8)
  code!: string;
}
