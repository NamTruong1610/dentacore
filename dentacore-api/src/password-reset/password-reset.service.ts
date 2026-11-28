import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PasswordResetRequestDto } from './dtos/password-reset-request.dto.js';
import { Outbox } from '@nestjs/outbox';
import { Prisma } from '../generated/prisma/client.js';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TokenService } from '../common/crypto/token.service.js';
import { EmployeeService } from '../employee/employee.service.js';
import { PasswordResetRepository } from './password-reset.repository.js';
import { MailService } from '../mail/mail.service.js';
import { PasswordResetTokenDto } from './dtos/password-reset-token.dto.js';
import { PasswordResetConfirmDto } from './dtos/password-reset-confirm.dto.js';
import { MfaService } from '../mfa/mfa.service.js';
import { PasswordHasher } from '../common/crypto/password-hasher.service.js';
import { SessionStore } from '../auth/stores/session.store.js';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly outbox: Outbox<Prisma.TransactionClient>,
    private readonly txHost: TransactionHost<TransactionalAdapterPrisma>,
    private readonly employeeService: EmployeeService,
    private readonly mfaService: MfaService,
    private readonly tokenService: TokenService,
    private readonly passwordResetRepo: PasswordResetRepository,
    private readonly mailService: MailService,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionStore: SessionStore
  ) { }

  private readonly PASSWORD_RESET_TOKEN_MINUTES = 15
  private readonly PASSWORD_RESET_TOKEN_DURATION = this.PASSWORD_RESET_TOKEN_MINUTES * 60 * 1000
  private acceptUrl(rawToken: string) {
    return `http://localhost:3000/password/reset#token=${rawToken}`
  }
  async requestPasswordReset(resetDto: PasswordResetRequestDto) {
    // look up employee by number
    await this.txHost.withTransaction(
      async () => {
        const employeeRecord = await this.employeeService.findPasswordResettable(resetDto.employeeNumber)
        if (!employeeRecord) {
          return
        }
        await this.outbox.add(this.txHost.tx, {
          topic: 'password-reset.requested',
          key: employeeRecord.id,
          payload: {
            employeeId: employeeRecord.id
          },
        });
      }
    )
    this.outbox.notify();
  }
  async issuePasswordResetToken(msg: { employeeId: string }) {
    const employeeRecord = await this.employeeService.findActiveByEmployeeId(msg.employeeId)
    if (!employeeRecord) return
    const rawToken = this.tokenService.generate();
    await this.passwordResetRepo.createToken(msg.employeeId, employeeRecord.primaryEmail, this.tokenService.digest(rawToken), new Date(Date.now() + this.PASSWORD_RESET_TOKEN_DURATION))
    await this.mailService.sendPasswordReset(
      employeeRecord.primaryEmail,
      this.acceptUrl(rawToken),
      this.PASSWORD_RESET_TOKEN_MINUTES,
    )
  }

  async validate(passwordResetTokenDto: PasswordResetTokenDto) {
    const token = await this.passwordResetRepo.findActive(this.tokenService.digest(passwordResetTokenDto.resetToken))

    if (!token) {
      throw new BadRequestException('Reset token invalid or expired')
    }

    return { valid: true }
  }

  async confirm(passwordResetConfirmDto: PasswordResetConfirmDto) {
    if (passwordResetConfirmDto.rawPassword !== passwordResetConfirmDto.retypedPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const tokenHash = this.tokenService.digest(passwordResetConfirmDto.resetToken)
    const resetTokenRecord = await this.passwordResetRepo.findActive(tokenHash)

    if (!resetTokenRecord) {
      throw new BadRequestException('Reset token invalid or expired')
    }

    const passwordHash = await this.passwordHasher.hash(passwordResetConfirmDto.rawPassword)

    await this.txHost.withTransaction(async () => {
      const valid = await this.mfaService.verifyAndClaim(resetTokenRecord.employeeId, passwordResetConfirmDto.totp)

      if (!valid) {
        throw new BadRequestException('OTP invalid or expired');
      }

      // Consume invite token
      const isMatched = await this.passwordResetRepo.consumeByHash(tokenHash)
      if (!isMatched) throw new ConflictException('Token invalid or expired');

      // Save new password
      const isSaved = await this.employeeService.saveNewPassword(resetTokenRecord.employeeId, passwordHash)
      if (!isSaved) {
        throw new ConflictException();
      }

      await this.outbox.add(this.txHost.tx, {
        topic: 'password-reset.success',
        key: resetTokenRecord.employeeId,
        payload: {
          email: resetTokenRecord.sentToEmail,
        },
      });
    })

    this.outbox.notify();

    // Delete all sessions
    await this.sessionStore.revokeAll(resetTokenRecord.employeeId)
  }

  async confirmResetSuccess(msg: { email: string }) {
    await this.mailService.sendPasswordResetSuccess(msg.email)
  }
}
