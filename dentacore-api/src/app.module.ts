import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserModule } from './user/user.module.js';
import { InvitationModule } from './invitation/invitation.module.js';

@Module({
  imports: [UserModule, InvitationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
