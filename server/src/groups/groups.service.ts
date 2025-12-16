import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  // 1. פתיחת קבוצת רכישה חדשה
  async create(createGroupDto: any) {
    return this.prisma.group.create({
      data: {
        productId: createGroupDto.productId, // איזה מוצר מוכרים?
        targetMembers: parseInt(createGroupDto.targetMembers), // כמה אנשים צריך?
        deadline: new Date(createGroupDto.deadline), // מתי זה נגמר?
        status: 'OPEN', // הקבוצה נפתחת כ"פתוחה"
        currentMembers: 0,
      },
      include: {
        product: true, // שיחזיר לנו גם את פרטי המוצר בתשובה
      },
    });
  }

  // 2. שליפת כל הקבוצות הפעילות (לדף הבית)
  async findAll() {
    return this.prisma.group.findMany({
      include: {
        product: true, // מביא את פרטי המוצר לכל קבוצה
      },
    });
  }

  // 3. שליפת קבוצה ספציפית
  async findOne(id: string) {
    return this.prisma.group.findUnique({
      where: { id },
      include: {
        product: true,
        members: true, // נראה גם מי הצטרף
      },
    });
  }

  // ======================================================
  // 4. חדש: פונקציה להצטרפות לקבוצה (Join Group)
  // ======================================================
  async joinGroup(userId: string, groupId: string) {
    // א. קודם בודקים שהקבוצה קיימת ופתוחה
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    
    if (!group) throw new Error('Group not found');
    if (group.status !== 'OPEN') throw new Error('Group is closed');

    // ב. רושמים את המשתמש בטבלת החברים
    await this.prisma.groupMember.create({
      data: {
        userId: userId,
        groupId: groupId,
      },
    });

    // ג. מעדכנים את מונה המשתתפים בקבוצה ב-1+ ומחזירים את המידע המעודכן
    return this.prisma.group.update({
      where: { id: groupId },
      data: { 
        currentMembers: { increment: 1 } 
      },
      include: { members: true } // נחזיר את רשימת החברים המעודכנת
    });
  }

}