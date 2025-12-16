import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // יצירת מוצר חדש
  async create(createProductDto: any) {
    return this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        price: parseFloat(createProductDto.price), // המרה למספר
        groupPrice: parseFloat(createProductDto.groupPrice),
        minMembers: parseInt(createProductDto.minMembers),
        image: createProductDto.image,
      },
    });
  }

// שליפת כל המוצרים + הקבוצות שלהם
  async findAll() {
    return this.prisma.product.findMany({
      include: {
        groups: true, // 👈 הוספנו את זה: תביא גם את הקבוצות הקשורות למוצר
      },
    });
  }

  // שליפת מוצר אחד לפי מזהה
  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }
}