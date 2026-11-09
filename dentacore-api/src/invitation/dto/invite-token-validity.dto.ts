import { IsNotEmpty, IsString } from "class-validator";

export class InviteTokenValidityDto {

  @IsNotEmpty()
  @IsString()
  inviteToken: string
}