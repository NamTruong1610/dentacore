import { Controller, Get, Post, Put, Body, Param, Query, Delete } from '@nestjs/common';
import { EmployeeService } from './employee.service.js';

@Controller('user')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {

  }

  
}
