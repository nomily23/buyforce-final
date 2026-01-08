import { Controller, Get, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ProductsService } from './products.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiConsumes('multipart/form-data') // 1. אומרים ל-Swagger שזה טופס עם קבצים
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        groupPrice: { type: 'number' },
        minMembers: { type: 'integer' },
        image: { // 2. הגדרת השדה של התמונה כקובץ
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads', 
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  create(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
    // יצירת אובייקט עם הנתונים
    const productData = {
      name: body.name,
      description: body.description,
      // המרה למספרים כי ב-Multipart הכל מגיע כטקסט
      price: parseFloat(body.price),
      groupPrice: parseFloat(body.groupPrice),
      minMembers: parseInt(body.minMembers),
      image: file ? `/uploads/${file.filename}` : '', // שמירת הנתיב לתמונה
    };

    return this.productsService.create(productData);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }
}