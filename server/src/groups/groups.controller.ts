import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GroupsService } from './groups.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // 1. יצירת קבוצה חדשה
  @Post()
  create(@Body() createGroupDto: any) {
    return this.groupsService.create(createGroupDto);
  }

  // 2. קבלת כל הקבוצות
  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  // 3. הוספנו את זה: הצטרפות לקבוצה! 
  // הכתובת תהיה: http://localhost:3000/groups/join
  @Post('join')
  joinGroup(@Body() body: { userId: string; groupId: string }) {
    return this.groupsService.joinGroup(body.userId, body.groupId);
  }

  // 4. קבלת קבוצה ספציפית לפי ID
  // (חשוב שזה יהיה בסוף כדי שלא יתנגש עם ה-join)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }
}