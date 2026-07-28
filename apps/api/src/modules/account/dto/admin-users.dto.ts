import { IsBoolean } from 'class-validator';

export class SetUnlimitedDto {
  @IsBoolean()
  unlimited!: boolean;
}
