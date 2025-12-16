import { Controller, Get, Post, Body, Param } from '@nestjs/common'; // 👈 הוספנו את Param כאן
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: any) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // כתובת חדשה: /users/:id/groups
  @Get(':id/groups')
  getUserGroups(@Param('id') id: string) {
    return this.usersService.findUserGroups(id);
  }
  @Post('login')
  login(@Body() loginDto: any) {
    return this.usersService.login(loginDto);
  }
}