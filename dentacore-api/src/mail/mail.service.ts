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
}