import { IsNotEmpty, IsString, IsStrongPassword, MaxLength } from "class-validator"

export class InvitePasswordSetupDto {
  @IsNotEmpty()
  @IsString()
  inviteToken: string

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