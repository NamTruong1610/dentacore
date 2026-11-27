import { Test, TestingModule } from '@nestjs/testing';
import { PermissionRepository } from './permission.repository.js';

describe('PermissionRepository', () => {
  let provider: PermissionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionRepository],
    }).compile();

    provider = module.get<PermissionRepository>(PermissionRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
