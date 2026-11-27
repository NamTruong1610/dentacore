import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginPasswordDto } from './dto/login-password.dto.js';
import { TokenService } from '../common/crypto/token.service.js';
import { EmployeeService } from '../employee/employee.service.js';
import { PasswordHasher } from '../common/crypto/password-hasher.service.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { SessionStore } from './stores/session.store.js';
import { MfaChallengeStore } from './stores/mfa-challenge.store.js';
import { MfaService } from '../mfa/mfa.service.js';



@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly employeeService: EmployeeService,
    private readonly passwordHasher: PasswordHasher,
    private readonly mfaService: MfaService,
    private readonly mfaChallengeStore: MfaChallengeStore,
    private readonly sessionStore: SessionStore
  ) { }
  async login(loginPasswordDto: LoginPasswordDto) {

    const employeeRecord = await this.employeeService.findActiveByEmployeeNo(loginPasswordDto.employeeNumber)

    if (!employeeRecord) {
      throw new UnauthorizedException('Invalid employee number or password')
    }

    const passwordMatched = await this.passwordHasher.compare(loginPasswordDto.password, employeeRecord.passwordHash)

    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid employee number or password')
    }

    const mfaChallengeIdRaw = await this.mfaChallengeStore.create(employeeRecord.id, loginPasswordDto.rememberMe)

    return mfaChallengeIdRaw 
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const mfaChallengeIdHash = this.tokenService.digest(verifyOtpDto.mfaChallengeIdRaw)


    const parsedMfaPayload = await this.mfaChallengeStore.get(mfaChallengeIdHash)

    if (!parsedMfaPayload) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isValidAttempt = await this.mfaChallengeStore.registerAttempt(mfaChallengeIdHash)
    if (!isValidAttempt) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const employeeId: string = parsedMfaPayload.employeeId
    const rememberMe: boolean = parsedMfaPayload.rememberMe

    const employeeRecord = await this.employeeService.findActiveByEmployeeId(employeeId)

    if (!employeeRecord) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const claimed = await this.mfaService.verifyAndClaim(employeeRecord.id, verifyOtpDto.otp)
    if (!claimed) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const consumed = await this.mfaChallengeStore.consume(mfaChallengeIdHash)
    if (!consumed) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create new session
    const { sessionIdRaw, absoluteExpiresAt } = await this.sessionStore.create(employeeRecord.id, rememberMe)

    
    return { sessionIdRaw, absoluteExpiresAt, rememberMe }
  }
}

