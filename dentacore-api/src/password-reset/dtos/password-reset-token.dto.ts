import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class PasswordResetTokenDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value.trim()))
  resetToken: string
}