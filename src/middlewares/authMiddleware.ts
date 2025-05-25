// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/dataSource';
import { User } from '../entities/User';

// Расширяем интерфейс Request для добавления поля user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ error: 'Не предоставлен токен авторизации' });
      }
      
      const token = authHeader.split(' ')[1]; // Bearer <token>
      
      if (!token) {
        return res.status(401).json({ error: 'Неверный формат токена' });
      }
      
      // Проверяем JWT
      const jwtSecret = process.env.JWT_SECRET || 'supersecretkey';
      const decoded = jwt.verify(token, jwtSecret) as { id: string };
      
      // Находим пользователя
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: decoded.id } });
      
      if (!user) {
        return res.status(401).json({ error: 'Пользователь не найден' });
      }
      
      // Добавляем пользователя в объект запроса
      req.user = user;
      
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Недействительный токен' });
      }
      
      console.error('Ошибка авторизации:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  })().catch(next);
};