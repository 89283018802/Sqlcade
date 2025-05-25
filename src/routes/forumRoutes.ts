// src/routes/forumRoutes.ts
import { Router } from 'express';
import { ForumController } from '../controllers/ForumController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const forumController = new ForumController();

// Получение всех тем
router.get('/topics', async (req, res) => {
  await forumController.getAllTopics(req, res);
});

// Получение отдельной темы с комментариями
router.get('/topics/:id', async (req, res) => {
  await forumController.getTopicById(req, res);
});

// ПЕРЕМЕСТИТЕ СЮДА - Поиск тем по ключевому слову (должен быть доступен всем)
router.get('/search', async (req, res) => {
  await forumController.searchTopics(req, res);
});

// Защищенные маршруты (требуют авторизации)
router.use(authMiddleware);

// Создание новой темы
router.post('/topics', async (req, res) => {
  await forumController.createTopic(req, res);
});

// Добавление комментария к теме
router.post('/topics/:topicId/comments', async (req, res) => {
  await forumController.addComment(req, res);
});

// Удаление темы
router.delete('/topics/:id', async (req, res) => {
  await forumController.deleteTopic(req, res);
});

// Удаление комментария
router.delete('/comments/:id', async (req, res) => {
  await forumController.deleteComment(req, res);
});

// Обновление статуса темы (закрепление, закрытие)
router.patch('/topics/:id/status', async (req, res) => {
  await forumController.updateTopicStatus(req, res);
});

export default router;