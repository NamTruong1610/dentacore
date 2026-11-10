import { Test, TestingModule } from '@nestjs/testing';
import { MfaCredentialsService } from './mfa-credentials.service.js';

describe('MfaCredentialsService', () => {
  let service: MfaCredentialsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MfaCredentialsService],
    }).compile();

    service = module.get<MfaCredentialsService>(MfaCredentialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
