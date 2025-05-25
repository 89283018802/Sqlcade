// src/controllers/CourseController.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/dataSource';
import { UserCourse } from '../entities/UserCourse';
import { User } from '../entities/User';

export class CourseController {
  // Получение всех курсов пользователя
  async getUserCourses(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Не авторизован' });
      }

      const userCourseRepository = AppDataSource.getRepository(UserCourse);
      const courses = await userCourseRepository.find({
        where: { userId }
      });

      return res.json({ courses });
    } catch (error) {
      console.error('Ошибка при получении курсов пользователя:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Сохранение прогресса курса
  async saveProgress(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Не авторизован' });
      }

      const { courseId, progress, currentLesson, completed, title } = req.body;
      
      if (!courseId) {
        return res.status(400).json({ error: 'Не указан ID курса' });
      }

      const userCourseRepository = AppDataSource.getRepository(UserCourse);
      const userRepository = AppDataSource.getRepository(User);
      
      // Ищем существующий прогресс
      let userCourse = await userCourseRepository.findOne({
        where: { userId, courseId }
      });

      // Проверяем, нужно ли добавить опыт пользователю
      let addXP = 0;
      if (userCourse) {
        // Если прогресс увеличился, добавляем XP
        if (progress > userCourse.progress) {
          addXP = 10; // за каждый % прогресса
        }
        // Если курс завершен, и раньше не был завершен
        if (completed && !userCourse.completed) {
          addXP += 200; // бонус за завершение курса
        }
      } else {
        // Если это новый курс, добавляем начальный XP
        addXP = 50;
      }

      // Обновляем или создаем запись прогресса
      if (userCourse) {
        userCourse.progress = progress;
        userCourse.currentLesson = currentLesson;
        userCourse.completed = completed;
      } else {
        userCourse = userCourseRepository.create({
          userId,
          courseId,
          title,
          progress,
          currentLesson,
          completed
        });
      }

      await userCourseRepository.save(userCourse);

      // Обновляем XP пользователя, если необходимо
      if (addXP > 0) {
        const user = await userRepository.findOne({ where: { id: userId } });
        if (user) {
          user.xp += addXP;
          
          // Проверяем уровень
          const xpToNextLevel = user.level * 1000;
          if (user.xp >= xpToNextLevel) {
            user.level += 1;
            user.xp = user.xp - xpToNextLevel;
          }
          
          await userRepository.save(user);
        }
      }

      return res.json({ 
        success: true, 
        course: userCourse,
        xpEarned: addXP
      });
    } catch (error) {
      console.error('Ошибка при сохранении прогресса:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
}