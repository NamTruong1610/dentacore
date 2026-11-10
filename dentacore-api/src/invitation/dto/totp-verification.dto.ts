import { Transform } from "class-transformer"
import { IsNotEmpty, IsString, IsStrongPassword, Matches, MaxLength, MinLength } from "class-validator"

export class TOTPVerificationDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim()))
  @Matches(/^\d{6}$/)
  totp: string

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim()))
  inviteToken: string

}