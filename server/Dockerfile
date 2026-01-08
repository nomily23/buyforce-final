# משתמשים בגרסת Node עדכנית
FROM node:18

# יצירת תיקיית עבודה בתוך הקונטיינר
WORKDIR /app

# העתקת קבצי ההגדרות (כדי להתקין ספריות ביעילות)
COPY package*.json ./

# התקנת הספריות
RUN npm install

# העתקת כל שאר הקוד פנימה
COPY . .

# יצירת מנוע הפריזמה (חשוב מאוד!)
RUN npx prisma generate

# חשיפת הפורט של האפליקציה
EXPOSE 3000

# הפקודה שתריץ את השרת בפועל
CMD ["npm", "run", "start:dev"]