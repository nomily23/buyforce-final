import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  imports: [
    PrismaModule, // הייבוא של הדאטה בייס
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' }, // הטוקן תקף ליום אחד
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}