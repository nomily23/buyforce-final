import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 1. יצירת משתמש חדש (הרשמה)
  async create(createUserDto: any) {
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: createUserDto.password, // בהמשך נלמד להצפין את זה
        name: createUserDto.name,
      },
    });
  }

  // 2. שליפת כל המשתמשים (לשימוש האדמין)
  async findAll() {
    return this.prisma.user.findMany();
  }
  
  // 3. שליפת משתמש לפי אימייל (לצורך התחברות)
  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
  // 4. שליפת כל הקבוצות שמשתמש ספציפי הצטרף אליהן
  async findUserGroups(userId: string) {
    return this.prisma.groupMember.findMany({
      where: { userId: userId }, // תביא לי את השורות של המשתמש הזה
      include: {
        group: {
          include: {
            product: true, // תביא גם את פרטי המוצר של הקבוצה
          },
        },
      },
    });
  }
  // 5. התחברות למערכת (Login)
  async login(loginDto: any) {
    // א. נחפש אם יש בכלל משתמש עם האימייל הזה
    const user = await this.prisma.user.findUnique({ 
      where: { email: loginDto.email } 
    });

    // ב. אם לא מצאנו משתמש - נחזיר שגיאה
    if (!user) {
      throw new Error('User not found');
    }

    // ג. אם מצאנו, נבדוק אם הסיסמה תואמת (השוואה פשוטה בינתיים)
    if (user.password !== loginDto.password) {
      throw new Error('Wrong password');
    }

    // ד. אם הכל תקין - נחזיר את המשתמש (זה ה"כרטיס כניסה" שלנו)
    return user;
  }
}