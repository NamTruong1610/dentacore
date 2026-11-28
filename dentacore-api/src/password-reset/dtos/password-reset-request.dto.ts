import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class PasswordResetRequestDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value.trim()))
  employeeNumber: string
}