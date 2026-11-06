import { Test, TestingModule } from '@nestjs/testing';
import { OutboxAdminController } from './outbox-admin.controller.js';

describe('OutboxAdminController', () => {
  let controller: OutboxAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutboxAdminController],
    }).compile();

    controller = module.get<OutboxAdminController>(OutboxAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
