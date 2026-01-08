import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static'; // 👇 ייבוא חובה לתמונות
import { join } from 'path'; // 👇 ייבוא חובה לניהול נתיבים
import { AppController } from './app.controller';
import { AppService } from './app.service';

// המודולים שלך
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // 👇 החלק החדש: זה מה שפותח את תיקיית התמונות לעולם
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), // שימוש ב-cwd מבטיח שנמצא את התיקייה הנכונה
      serveRoot: '/uploads', 
    }),

    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    GroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}