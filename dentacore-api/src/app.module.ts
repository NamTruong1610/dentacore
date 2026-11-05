import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { EmployeeModule } from './employee/employee.module.js';
import { InvitationModule } from './invitation/invitation.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { CryptoModule } from './common/crypto/crypto.module.js';

@Module({
  imports: [EmployeeModule, InvitationModule, PrismaModule, CryptoModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
