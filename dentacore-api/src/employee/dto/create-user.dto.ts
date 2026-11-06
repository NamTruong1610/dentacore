import { IsEmail, IsString, IsNotEmpty, IsOptional } from "class-validator"
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  firstName: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim().toLowerCase()))
  middleName?: string | null;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  lastName: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim().toLowerCase()))
  employeeNumber: string | null

  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  primaryEmail: string

  @IsString()
  @IsNotEmpty()
  rawPassword: string

  @IsString()
  @IsNotEmpty()
  nationalId: string
}