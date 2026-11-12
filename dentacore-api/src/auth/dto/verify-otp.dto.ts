import { Transform } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsString, Matches } from "class-validator";

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (value.trim()))
  mfaChallengeIdRaw: string

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim()))
  @Matches(/^\d{6}$/)
  otp: string
}