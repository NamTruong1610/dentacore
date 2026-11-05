import { Controller, Get, Post, Put, Body, Param, Query, Delete } from '@nestjs/common';
import { UserService } from './user.service.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {

  }

  
}
