import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AuthDto } from './dto/auth.dto'; // <--- הנה השורה שהייתה חסרה!

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // ==========================
  // הרשמה
  // ==========================
  async register(dto: AuthDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: '', 
      },
    });

    return { message: 'User registered successfully', userId: user.id };
  }

  // ==========================
  // התחברות
  // ==========================
  async login(dto: AuthDto) {
    // 1. נחפש אם המשתמש קיים בכלל
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials'); 
    }

    // 2. נבדוק אם הסיסמה תואמת למה שמוצפן
    const isPasswordMatch = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. הצלחה! נחזיר את פרטי המשתמש
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}