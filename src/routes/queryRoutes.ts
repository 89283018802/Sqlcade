// src/routes/queryRoutes.ts
import { Router } from 'express';
import { QueryController } from '../controllers/QueryController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const queryController = new QueryController();

// Применяем middleware аутентификации ко всем маршрутам
router.use(authMiddleware);

// Выполнение SQL запроса
router.post('/execute', async (req, res) => {
  await queryController.executeQuery(req, res);
});

// Получение истории запросов
router.get('/history', async (req, res) => {
  await queryController.getQueryHistory(req, res);
});

export default router;