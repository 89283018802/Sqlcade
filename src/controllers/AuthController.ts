// src/controllers/AuthController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/dataSource';
import { User } from '../entities/User';
import { UserCourse } from '../entities/UserCourse';
import fs from 'fs';
import path from 'path';

export class AuthController {
  // Регистрация нового пользователя
  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
      }

      const userRepository = AppDataSource.getRepository(User);

      // Проверяем, существует ли пользователь с таким username или email
      const existingUser = await userRepository.findOne({
        where: [{ username }, { email }]
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'Пользователь с таким именем или email уже существует' 
        });
      }

      // Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 10);

      // Создаем нового пользователя
      const user = userRepository.create({
        username,
        email,
        password: hashedPassword,
        role: 'user',
        level: 1,
        xp: 0
      });

      await userRepository.save(user);

      // Создаем JWT токен
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '7d' }
      );

      // Возвращаем данные пользователя без пароля
      const { password: _, ...userWithoutPassword } = user;

      return res.status(201).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      return res.status(500).json({ error: 'Ошибка при регистрации' });
    }
  }

  // Вход пользователя
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
      }

      const userRepository = AppDataSource.getRepository(User);

      // Ищем пользователя по имени пользователя или email
      const user = await userRepository.findOne({
        where: [
          { username },
          { email: username } // Позволяем войти как по username, так и по email
        ]
      });

      if (!user) {
        return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
      }

      // Проверяем пароль
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
      }

      // Создаем JWT токен
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '7d' }
      );

      // Возвращаем данные пользователя без пароля
      const { password: _, ...userWithoutPassword } = user;

      return res.json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Ошибка при входе:', error);
      return res.status(500).json({ error: 'Ошибка при входе' });
    }
  }

  // Получение текущего пользователя
  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Не авторизован' });
      }

      const userRepository = AppDataSource.getRepository(User);
      const userCourseRepository = AppDataSource.getRepository(UserCourse);
      
      // Находим пользователя
      const user = await userRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      // Получаем курсы пользователя
      const courses = await userCourseRepository.find({
        where: { userId }
      });

      // Возвращаем данные пользователя без пароля
      const { password: _, ...userWithoutPassword } = user;

      return res.json({
        ...userWithoutPassword,
        courses
      });
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
      return res.status(500).json({ error: 'Ошибка получения данных пользователя' });
    }
  }

  // Обновление аватара пользователя
  async updateAvatar(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Не авторизован' });
      }
      
      // Файл должен быть загружен через middleware multer
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не был загружен' });
      }
      
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOneBy({ id: userId });
      
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      
      // Удаляем предыдущий аватар, если он существует
      if (user.avatarUrl) {
        const oldAvatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatarUrl));
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      
      // Сохраняем путь к новому аватару
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      user.avatarUrl = avatarUrl;
      
      await userRepository.save(user);
      
      return res.json({ 
        success: true, 
        avatarUrl: avatarUrl,
        message: 'Аватар успешно обновлен'
      });
    } catch (error) {
      console.error('Ошибка при обновлении аватара:', error);
      return res.status(500).json({ error: 'Ошибка при обновлении аватара' });
    }
  }
  
  // Удаление аватара пользователя
  async deleteAvatar(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Не авторизован' });
      }
      
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOneBy({ id: userId });
      
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      
      // Удаляем файл аватара, если он существует
      if (user.avatarUrl) {
        const avatarPath = path.join(__dirname, '../../uploads/avatars', path.basename(user.avatarUrl));
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
        }
        
        // Сбрасываем путь к аватару
        user.avatarUrl = null;
        await userRepository.save(user);
      }
      
      return res.json({ 
        success: true, 
        message: 'Аватар успешно удален'
      });
    } catch (error) {
      console.error('Ошибка при удалении аватара:', error);
      return res.status(500).json({ error: 'Ошибка при удалении аватара' });
    }
  }
  
  // Обновление данных пользователя
  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Не авторизован' });
      }
      
      const { username, email } = req.body;
      
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOneBy({ id: userId });

      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      // Обновляем поля пользователя
      if (username) user.username = username;
      if (email) user.email = email;

      await userRepository.save(user);

      // Возвращаем обновленные данные пользователя без пароля
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error('Ошибка при обновлении пользователя:', error);
      return res.status(500).json({ error: 'Ошибка при обновлении данных пользователя' });
    }
  }
}

export default new AuthController();