// src/controllers/ForumController.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/dataSource';
import { ForumTopic } from '../entities/ForumTopic';
import { ForumComment } from '../entities/ForumComment';
import { User } from '../entities/User';
import { CommentRating } from '../entities/CommentRating';
import { IsNull, In } from 'typeorm';

export class ForumController {
  // Получение списка всех тем форума
 async getAllTopics(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const topicRepository = AppDataSource.getRepository(ForumTopic);
    
    const [topics, total] = await topicRepository.findAndCount({
      relations: ['user'],
      order: {
        isPinned: 'DESC',
        updatedAt: 'DESC'
      },
      skip,
      take: limit,
      select: {
        user: {
          id: true,
          username: true,
          avatarUrl: true
        }
      }
    });

    const topicsWithCommentCount = await Promise.all(topics.map(async (topic) => {
      const commentRepository = AppDataSource.getRepository(ForumComment);
      const commentCount = await commentRepository.count({
        where: { topicId: topic.id }
      });
      
      return {
        ...topic,
        commentCount
      };
    }));

    return res.json({
      topics: topicsWithCommentCount,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Ошибка при получении тем форума:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}
  
  // Получение отдельной темы с комментариями
    // Получение отдельной темы с комментариями
  async getTopicById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const topicRepository = AppDataSource.getRepository(ForumTopic);
      const topic = await topicRepository.findOne({
        where: { id },
        relations: ['user'],
        select: {
          user: {
            id: true,
            username: true,
            avatarUrl: true,
            level: true
          }
        }
      });
      
      if (!topic) {
        return res.status(404).json({ error: 'Тема не найдена' });
      }
      
      // Увеличиваем счетчик просмотров
      topic.viewCount += 1;
      await topicRepository.save(topic);
      
      // Получаем комментарии к теме
      const commentRepository = AppDataSource.getRepository(ForumComment);
      
      // Получаем корневые комментарии (без родителя)
      const rootComments = await commentRepository.find({
        where: { topicId: id, parentId: IsNull() }, // Исправление 1
        relations: ['user'],
        order: { createdAt: 'ASC' },
        select: {
          user: {
            id: true,
            username: true,
            avatarUrl: true,
            level: true
          }
        }
      });
      
      // Получаем все дочерние комментарии
      const commentIds = rootComments.map(comment => comment.id);
      
      let childComments: ForumComment[] = [];
      if (commentIds.length > 0) { // Проверяем, есть ли комментарии
        childComments = await commentRepository.find({
          where: { parentId: In(commentIds) }, // Исправление 2
          relations: ['user'],
          order: { createdAt: 'ASC' },
          select: {
            user: {
              id: true,
              username: true,
              avatarUrl: true,
              level: true
            }
          }
        });
      }
      
      // Создаем карту комментариев для быстрого поиска
      const commentsMap = new Map();
      rootComments.forEach(comment => {
        comment.replies = [];
        commentsMap.set(comment.id, comment);
      });
      
      // Добавляем дочерние комментарии к их родителям
      childComments.forEach(comment => {
        if (comment.parentId && commentsMap.has(comment.parentId)) {
          comment.replies = [];
          commentsMap.get(comment.parentId).replies.push(comment);
          commentsMap.set(comment.id, comment);
        }
      });
      
      return res.json({
        topic,
        comments: rootComments
      });
    } catch (error) {
      console.error('Ошибка при получении темы форума:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
  
  // Создание новой темы
  async createTopic(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Не авторизован' });
      }
      
      const { title, content, tags } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ error: 'Заголовок и содержание обязательны' });
      }
      
      // Обработка тегов
      const processedTags = Array.isArray(tags) ? 
        tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0) : 
        [];
      
      const topicRepository = AppDataSource.getRepository(ForumTopic);
      const newTopic = topicRepository.create({
        title,
        content,
        userId,
        tags: processedTags
      });
      
      await topicRepository.save(newTopic);
      
      // Добавляем XP пользователю за создание темы
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });
      if (user) {
        user.xp += 10;
        
        // Проверяем уровень
        const xpToNextLevel = user.level * 1000;
        if (user.xp >= xpToNextLevel) {
          user.level += 1;
          user.xp = user.xp - xpToNextLevel;
        }
        
        await userRepository.save(user);
      }
      
      return res.status(201).json(newTopic);
    } catch (error) {
      console.error('Ошибка при создании темы форума:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
  
  // Добавление комментария к теме или ответа на комментарий
  async addComment(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Не авторизован' });
      }
      
      const { topicId } = req.params;
      const { content, parentId } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Содержание комментария обязательно' });
      }
      
      // Проверяем существование темы
      const topicRepository = AppDataSource.getRepository(ForumTopic);
      const topic = await topicRepository.findOne({ where: { id: topicId } });
      
      if (!topic) {
        return res.status(404).json({ error: 'Тема не найдена' });
      }
      
      if (topic.isClosed) {
        return res.status(403).json({ error: 'Тема закрыта для комментариев' });
      }
      
      // Если указан parentId, проверяем существование родительского комментария
      if (parentId) {
        const commentRepository = AppDataSource.getRepository(ForumComment);
        const parentComment = await commentRepository.findOne({ 
          where: { 
            id: parentId,
            topicId // Убедимся, что родительский комментарий принадлежит той же теме
          } 
        });
        
        if (!parentComment) {
          return res.status(404).json({ error: 'Родительский комментарий не найден' });
        }
      }
      
      // Создаем комментарий
      const commentRepository = AppDataSource.getRepository(ForumComment);
      const newComment = commentRepository.create({
        content,
        userId,
        topicId,
        parentId
      });
      
      await commentRepository.save(newComment);
      
      // Обновляем дату изменения темы
      topic.updatedAt = new Date();
      await topicRepository.save(topic);
      
      // Добавляем XP пользователю за комментарий
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id: userId } });
      if (user) {
        user.xp += 5;
        
        // Проверяем уровень
        const xpToNextLevel = user.level * 1000;
        if (user.xp >= xpToNextLevel) {
          user.level += 1;
          user.xp = user.xp - xpToNextLevel;
        }
        
        await userRepository.save(user);
      }
      
      // Получаем данные пользователя для ответа
      const commentWithUser = await commentRepository.findOne({
        where: { id: newComment.id },
        relations: ['user'],
        select: {
          user: {
            id: true,
            username: true,
            avatarUrl: true,
            level: true
          }
        }
      });
      
      return res.status(201).json(commentWithUser);
    } catch (error) {
      console.error('Ошибка при добавлении комментария:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
  
  // Удаление темы (только автор или админ)
  async deleteTopic(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId) {
        return res.status(401).json({ error: 'Не авторизован' });
      }
      
      const { id } = req.params;
      
      const topicRepository = AppDataSource.getRepository(ForumTopic);
      const topic = await topicRepository.findOne({ where: { id } });
      
      if (!topic) {
        return res.status(404).json({ error: 'Тема не найдена' });
      }
      
      // Проверяем права на удаление
      if (topic.userId !== userId && userRole !== 'admin') {
        return res.status(403).json({ error: 'Нет прав на удаление этой темы' });
      }
      
      await topicRepository.remove(topic);
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Ошибка при удалении темы:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
  
  // Удаление комментария (только автор или админ)
  async deleteComment(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId) {
        return res.status(401).json({ error: 'Не авторизован' });
      }
      
      const { id } = req.params;
      
      const commentRepository = AppDataSource.getRepository(ForumComment);
      const comment = await commentRepository.findOne({ where: { id } });
      
      if (!comment) {
        return res.status(404).json({ error: 'Комментарий не найден' });
      }
      
      // Проверяем права на удаление
      if (comment.userId !== userId && userRole !== 'admin') {
        return res.status(403).json({ error: 'Нет прав на удаление этого комментария' });
}
  await commentRepository.remove(comment);
  
  return res.status(200).json({ message: 'Комментарий успешно удален' });
} catch (error) {
  console.error('Ошибка при удалении комментария:', error);
  return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
}

/* Лайк/дизлайк комментария
async rateComment(req: Request, res: Response) {
try {
const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  const { id } = req.params;
  const { type } = req.body; // 'like' или 'dislike'
  
  if (type !== 'like' &amp;&amp; type !== 'dislike') {
    return res.status(400).json({ error: 'Неверный тип оценки' });
  }
  
  const commentRepository = AppDataSource.getRepository(ForumComment);
  const comment = await commentRepository.findOne({ where: { id } });
  
  if (!comment) {
    return res.status(404).json({ error: 'Комментарий не найден' });
  }
  
  const ratingRepository = AppDataSource.getRepository(CommentRating);
  
  // Проверяем, голосовал ли пользователь уже
  const existingRating = await ratingRepository.findOne({
    where: { userId, commentId: id }
  });
  
  if (existingRating) {
    // Если пользователь уже поставил такую же оценку, то отменяем её
    if (existingRating.type === type) {
      await ratingRepository.remove(existingRating);
      
      // Обновляем счетчики
      if (type === 'like') {
        comment.likesCount = Math.max(0, comment.likesCount - 1);
      } else {
        comment.dislikesCount = Math.max(0, comment.dislikesCount - 1);
      }
      
      await commentRepository.save(comment);
      return res.status(200).json({ message: 'Оценка отменена', comment });
    } else {
      // Если оценка другая, то меняем тип
      existingRating.type = type;
      await ratingRepository.save(existingRating);
      
      // Обновляем счетчики
      if (type === 'like') {
        comment.likesCount += 1;
        comment.dislikesCount = Math.max(0, comment.dislikesCount - 1);
      } else {
        comment.dislikesCount += 1;
        comment.likesCount = Math.max(0, comment.likesCount - 1);
      }
      
      await commentRepository.save(comment);
      return res.status(200).json({ message: 'Оценка изменена', comment });
    }
  } else {
    // Если пользователь еще не голосовал, создаем новую оценку
    const newRating = new CommentRating();
    newRating.userId = userId;
    newRating.commentId = id;
    newRating.type = type;
    
    await ratingRepository.save(newRating);
    
    // Обновляем счетчики
    if (type === 'like') {
      comment.likesCount += 1;
    } else {
      comment.dislikesCount += 1;
    }
    
    await commentRepository.save(comment);
    return res.status(201).json({ message: 'Оценка добавлена', comment });
  }
} catch (error) {
  console.error('Ошибка при оценке комментария:', error);
  return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
}
}*/
async searchTopics(req: Request, res: Response) {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Параметр поиска обязателен' });
    }
    
    const topicRepository = AppDataSource.getRepository(ForumTopic);
    
    const topics = await topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.user', 'user')
      .where('topic.title ILIKE :query OR topic.content ILIKE :query', { 
        query: `%${query}%` 
      })
      .orderBy('topic.updatedAt', 'DESC')
      .select([
        'topic.id',
        'topic.title',
        'topic.viewCount',
        'topic.isPinned',
        'topic.isClosed',
        'topic.createdAt',
        'topic.updatedAt',
        'topic.tags',
        'user.id',
        'user.username',
        'user.avatarUrl'
      ])
      .getMany();
    
    // Добавляем количество комментариев для каждой темы
    const topicsWithCommentCount = await Promise.all(topics.map(async (topic) => {
      const commentRepository = AppDataSource.getRepository(ForumComment);
      const commentCount = await commentRepository.count({
        where: { topicId: topic.id }
      });
      
      return {
        ...topic,
        commentCount
      };
    }));
    
    return res.json(topicsWithCommentCount);
  } catch (error) {
    console.error('Ошибка при поиске тем:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

// Добавляем метод обновления статуса темы
async updateTopicStatus(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId || userRole !== 'admin') {
      return res.status(403).json({ error: 'Нет прав для выполнения этой операции' });
    }
    
    const { id } = req.params;
    const { isPinned, isClosed } = req.body;
    
    const topicRepository = AppDataSource.getRepository(ForumTopic);
    const topic = await topicRepository.findOne({ where: { id } });
    
    if (!topic) {
      return res.status(404).json({ error: 'Тема не найдена' });
    }
    
    if (typeof isPinned === 'boolean') {
      topic.isPinned = isPinned;
    }
    
    if (typeof isClosed === 'boolean') {
      topic.isClosed = isClosed;
    }
    
    await topicRepository.save(topic);
    
    return res.json(topic);
  } catch (error) {
    console.error('Ошибка при обновлении статуса темы:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}

}



export default new ForumController();