import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// ייבוא המודולים שיצרנו
import { PrismaModule } from './prisma/prisma.module'; // המודול של הדאטה-בייס
import { AuthModule } from './auth/auth.module';       // המודול של ההרשמה (חשוב!)
import { ProductsModule } from './products/products.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { ConfigModule } from '@nestjs/config'; // מומלץ לניהול משתני סביבה

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // הופך את קובץ ה-.env לזמין בכל מקום
    PrismaModule,   // טוענים את המודול של פריסמה
    AuthModule,     // <--- הוספנו את ה-Auth! עכשיו הלוגין יעבוד
    UsersModule,
    ProductsModule,
    GroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}