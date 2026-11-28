import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';


function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Injectable()
export class MailService {
  private readonly transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: Number(config.getOrThrow('SMTP_PORT')),
      secure: config.get('SMTP_SECURE') === 'true',
      auth: {
        user: config.getOrThrow<string>('SMTP_USER'),
        pass: config.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async sendInvite(to: string, inviteUrl: string, employeeNo: string): Promise<void> {
    const name = escapeHtml(to);
    const number = escapeHtml(employeeNo);
    const url = escapeHtml(inviteUrl);
    await this.transporter.sendMail({
      from: this.config.getOrThrow<string>('MAIL_FROM'),
      to,
      subject: 'You have been invited to Dentacore',
      text: [
        `Hi ${to},`,
        '',
        'You have been invited to Dentacore.',
        '',
        `Your employee number is: ${employeeNo}`,
        'You will use it with your password to sign in, so keep it somewhere safe.',
        '',
        `Accept your invite and set up your account: ${inviteUrl}`,
        '',
        'This link expires in 7 days and can only be used once.',
        "If you weren't expecting this email, you can ignore it.",
      ].join('\n'),
      html: `
        <p>Hi ${name},</p>
        <p>You have been invited to Dentacore.</p>
        <p>Your employee number is: <strong>${number}</strong><br>
        You will use it with your password to sign in, so keep it somewhere safe.</p>
        <p><a href="${url}">Accept your invite and set up your account</a></p>
        <p>This link expires in 7 days and can only be used once.<br>
        If you weren't expecting this email, you can ignore it.</p>
      `,
    });
  }

  async sendPasswordReset(
    to: string,
    email: string,
    resetUrl: string,
  ): Promise<void> {
    const name = escapeHtml(email);
    const url = escapeHtml(resetUrl);
    await this.transporter.sendMail({
      from: this.config.getOrThrow<string>('MAIL_FROM'),
      to,
      subject: 'Reset your Dentacore password',
      text: [
        `Hi ${name},`,
        '',
        'We received a request to reset the password for your Dentacore account.',
        '',
        `Reset your password: ${resetUrl}`,
        '',
        `This link expires in 15 minutes and can only be used once.`,
        "If you didn't request this, you can ignore this email. Your password won't change.",
      ].join('\n'),
      html: `
        <p>Hi ${name},</p>
        <p>We received a request to reset the password for your Dentacore account.</p>
        <p><a href="${url}">Reset your password</a></p>
        <p>This link expires in 15 minutes and can only be used once.<br>
        If you didn't request this, you can ignore this email. Your password won't change.</p>
      `,
    });
  }

  async sendPasswordResetSuccess(to: string) {
    const name = escapeHtml(to);
    await this.transporter.sendMail({
      from: this.config.getOrThrow<string>('MAIL_FROM'),
      to,
      subject: 'Your Dentacore password was changed',
      text: [
        `Hi ${to},`,
        '',
        'The password for your Dentacore account was just changed.',
        'For your security, you have been signed out on all devices.',
        '',
        'If you made this change, no further action is needed.',
        "If you didn't, contact your clinic administrator immediately so they can lock your account.",
      ].join('\n'),
      html: `
        <p>Hi ${name},</p>
        <p>The password for your Dentacore account was just changed.<br>
        For your security, you have been signed out on all devices.</p>
        <p>If you made this change, no further action is needed.<br>
        If you didn't, <strong>contact your clinic administrator immediately</strong> so they can lock your account.</p>
      `,
    });
  }
}