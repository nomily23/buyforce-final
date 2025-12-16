import { IsEmail, IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional() // השם הוא אופציונלי (יכול להיות ריק בהתחלה)
  name: string; // כאן השינוי: קראנו לזה name ולא fullName
}