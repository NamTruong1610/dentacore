import { IsEmail, IsString, IsNotEmpty, IsOptional } from "class-validator"
import { Transform } from 'class-transformer';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim()))
  firstName: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim()))
  middleName?: string | null;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? null : value?.trim()))
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
  nationalId: string
}