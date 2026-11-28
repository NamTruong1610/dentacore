import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, IsStrongPassword, Matches, MaxLength } from "class-validator";

export class PasswordResetConfirmDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value.trim()))
  @Matches(/^\d{6}$/)
  totp: string

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value.trim()))
  resetToken: string

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword(
    { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    { message: 'Password must be at least 8 characters with upper, lower, number and symbol' },
  )
  @MaxLength(72)
  rawPassword: string

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword(
    { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    { message: 'Password must be at least 8 characters with upper, lower, number and symbol' },
  )
  @MaxLength(72)
  retypedPassword: string
}