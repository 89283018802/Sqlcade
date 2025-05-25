// src/routes/courseRoutes.ts
import { Router } from 'express';
import { CourseController } from '../controllers/CourseController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const courseController = new CourseController();

// Применяем middleware аутентификации как обработчик запроса
// (не как .use)
router.all('*', authMiddleware);

// Получение курсов пользователя
router.get('/user-courses', async (req, res) => {
  await courseController.getUserCourses(req, res);
});

// Сохранение прогресса
router.post('/save-progress', async (req, res) => {
  await courseController.saveProgress(req, res);
});

export default router;