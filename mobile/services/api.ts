import axios from 'axios';

// ⚠️ חשוב: תחליפי את המספרים פה לכתובת ה-IPv4 שמצאת ב-ipconfig
// ואל תשכחי להשאיר את הפורט :3001 בסוף
const API_URL = 'http://192.168.7.3:3001'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// פונקציה להרשמה
export const registerUser = async (userData: any) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration Error:', error);
    throw error;
  }
};

// פונקציה להתחברות
export const loginUser = async (userData: any) => {
  try {
    const response = await api.post('/auth/login', userData);
    return response.data;
  } catch (error) {
    console.error('Login Error:', error);
    throw error;
  }
};

export default api;