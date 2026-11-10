import { IsNotEmpty, IsString } from "class-validator"

export class SaveMfaDto {
  @IsNotEmpty()
  @IsString()
  employeeId: string

  @IsNotEmpty()
  @IsString()
  encryptedSecret: string
}