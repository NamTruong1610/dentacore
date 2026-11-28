import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { Outbox } from '@nestjs/outbox';
import { PasswordHasher } from '../common/crypto/password-hasher.service.js';
import { InviteTokenValidityDto } from './dto/invite-token-validity.dto.js';
import { TokenService } from '../common/crypto/token.service.js';
import { InvitePasswordSetupDto } from './dto/invite-password-setup.dto.js';

import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { InviteTokenRepository } from './invite-token.repository.js';
import { MailService } from '../mail/mail.service.js';

import { EmployeeService } from '../employee/employee.service.js';
import { TOTPVerificationDto } from './dto/totp-verification.dto.js';
import { PendingInvitationStore } from './stores/pending-invitation.store.js';
import { MfaService } from '../mfa/mfa.service.js';

@Injectable()
export class InvitationService {
  constructor(
    private readonly outbox: Outbox<Prisma.TransactionClient>,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly mfaService: MfaService,
    private readonly mailService: MailService,
    private readonly employeeService: EmployeeService,
    private readonly inviteTokenRepo: InviteTokenRepository,
    private readonly pendingInvitationStore: PendingInvitationStore,
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>
  ) { }

  private INVITE_DURATION: number = 7 * 24 * 60 * 60 * 1000;
  private acceptUrl(rawToken: string) {
    return `http://localhost:3000/invite/accept#token=${rawToken}`
  }

  async inviteEmployee(email: string) {

    // A repo function returns the number of users with matching primary email or secondary email.
    // If multiple users are found, throws exception because we can't send the invite link to accounts with duplicate email
    // Throws error if no account with matching email is found
    // Mark invte switch the invite status to INVITED
    // Add message to handler and commits or roll back message 

    await this.txHost.withTransaction(
      async () => {
        const employeeRecords = await this.employeeService.findUninvitedByEmail(email)
        if (employeeRecords.length > 1) {
          throw new ConflictException('Users with duplicate email found')
        }
        const employee = employeeRecords[0];
        if (!employee) throw new NotFoundException('User not found');
        const invited = await this.employeeService.markInvited(employeeRecords[0].id)
        if (!invited) throw new ConflictException('Employee already invited or removed');
        await this.outbox.add(this.txHost.tx, {
          topic: 'employee.invited',
          key: employee.id,
          payload: {
            employeeId: employee.id,
            email,
            employeeNumber: employee.employeeNumber,
            issuerNationalId: 'request-user-id-placeholder'
          },
        });
      }
    )
    this.outbox.notify();
  }

  async issueInvite(msg: {
    employeeId: string, 
    email: string, 
    issuerNationalId: string, 
    employeeNumber: string 
  }) {
    // Before the message is processed, a small window where a staff user deletes the invited user could make that user ineligible for issuance of an invite token in the database and invite email. 
    // findInvitable is a guard that closes such window
    const employee = await this.employeeService.findInvitable(msg.employeeId);
    if (!employee) return;
    const rawToken = this.tokenService.generate();
    await this.inviteTokenRepo.createInviteToken(employee.id, msg.email, this.tokenService.digest(rawToken), new Date(Date.now() + this.INVITE_DURATION), msg.issuerNationalId);
    await this.mailService.sendInvite(msg.email, this.acceptUrl(rawToken), employee.employeeNumber);
  }

  // When the user opens the invite link in the email, this function runs first to check if the invte token is valid (not consumed/expired/deleted/revoked or had a user marked INVITED that references it)
  async validateInviteToken(inviteTokenDto: InviteTokenValidityDto) {
    const inviteTokenHash = this.tokenService.digest(inviteTokenDto.inviteToken)
    const inviteTokenRecord = await this.inviteTokenRepo.findActiveInviteToken(inviteTokenHash)

    if (!inviteTokenRecord) {
      throw new BadRequestException('Invite token invalid or expired')
    }

    return { valid: true }

  }

  async setNewPassword(invitePasswordSetupDto: InvitePasswordSetupDto) {
    if (invitePasswordSetupDto.rawPassword !== invitePasswordSetupDto.retypedPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const inviteTokenHash = this.tokenService.digest(invitePasswordSetupDto.inviteToken)
    const inviteTokenRecord = await this.inviteTokenRepo.findActiveInviteToken(inviteTokenHash)

    if (!inviteTokenRecord) {
      throw new BadRequestException('Invite token invalid or expired')
    }
    const passwordHash = await this.passwordHasher.hash(invitePasswordSetupDto.rawPassword)

    const rawSecret = this.mfaService.createSecret()
    const encryptedSecret = this.mfaService.encryptSecret(inviteTokenRecord.employeeId, rawSecret)

    // At submission, create a pending mfa setup in Redis auth instance: { passwordHash, employeeId, excryptedSecret } keyed by tokenHash for idempotency, and returns the uri (otpauth://...). 
    // If the user submits the form again, the idempotent token hash updates payload with changed password hash or encryption secret. 
    // We pass the employee's email for the 'label' parameter in generateUri(), the email is taken from sentToEmail field in InviteToken schema

    const isSaved = await this.pendingInvitationStore.save(inviteTokenHash, { passwordHash, encryptedSecret, employeeId: inviteTokenRecord.employeeId }, inviteTokenRecord.expiresAt)

    if (!isSaved) throw new BadRequestException('Invite token invalid or expired');

    const otpUri = this.mfaService.buildOtpauthUri(inviteTokenRecord.sentToEmail, rawSecret)

    return { otpauthUri: otpUri };
  }


  async verifyTotp(totpDto: TOTPVerificationDto) {
    const inviteTokenHash = this.tokenService.digest(totpDto.inviteToken)
    const inviteTokenRecord = await this.inviteTokenRepo.findActiveInviteToken(inviteTokenHash)

    if (!inviteTokenRecord) {
      throw new BadRequestException('Invite token invalid or expired')
    }

    const parsedPayload = await this.pendingInvitationStore.get(inviteTokenHash)

    if (!parsedPayload) {
      throw new BadRequestException('MFA challenge expired');
    }

    const { passwordHash, encryptedSecret, employeeId } = parsedPayload

    if (employeeId !== inviteTokenRecord.employeeId) {
      throw new BadRequestException('Id(s) not matched');
    }

    const { valid, timeStep } = await this.mfaService.verifyEnrollmentOtp(employeeId, encryptedSecret, totpDto.totp)

    if (!valid) {
      throw new BadRequestException('OTP invalid or expired');
    }

    await this.txHost.withTransaction(async () => {

      // Consume invite token
      const isMatched = await this.inviteTokenRepo.consumeInviteTokenByHash(inviteTokenHash)
      if (!isMatched) throw new ConflictException('Token invalid or expired');

      // Save mfa credentials
      await this.mfaService.saveCredentials(inviteTokenRecord.employeeId, encryptedSecret, timeStep)

      // Save password hash and switch to active
      const isSaved = await this.employeeService.activateWithPasswordHash(employeeId, passwordHash)
      if (!isSaved) {
        throw new ConflictException();
      }
    })

    // Delete pending payload from Redis. No outbox the because the invite token is consumed, subsequent access to the invite link will be declined and the Redis payload can time out on its own
    await this.pendingInvitationStore.delete(inviteTokenHash);
  }

}
