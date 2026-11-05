import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class InvitationService {
  constructor(private readonly prismaService: PrismaService) {}
  inviteEmployee() {
    // Find if email already exists
    this.prismaService.
  }
}
