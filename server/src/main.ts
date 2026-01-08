import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. הפעלת ולידציה (כדי לוודא שהנתונים שמגיעים תקינים)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // 2. הפעלת CORS (כדי שהאפליקציה במובייל תוכל לדבר עם השרת בלי חסימות)
  app.enableCors();

  // 3. הגדרת Swagger (יוצר דף תיעוד אוטומטי ל-API)
  const config = new DocumentBuilder()
    .setTitle('BuyForce API')
    .setDescription('The BuyForce API description')
    .setVersion('1.0')
    .addBearerAuth() // הכנה להתחברות עם טוקן
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // שימוש בפורט מקובץ ה-.env או ברירת מחדל 3001
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger is running on: http://localhost:${port}/api`);
}
bootstrap();