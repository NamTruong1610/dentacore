import { IsNotEmpty, IsString } from "class-validator";

export class UpdateInvitedEmployeeDto {
  @IsString()
  @IsNotEmpty()
  passwordHash: string
}