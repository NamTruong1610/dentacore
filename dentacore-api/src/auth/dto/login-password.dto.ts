import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginPasswordDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value.trim()))
  employeeNumber: string

  @IsNotEmpty()
  @IsString()
  password: string

  @IsBoolean()
  @IsNotEmpty()
  remember: boolean
}