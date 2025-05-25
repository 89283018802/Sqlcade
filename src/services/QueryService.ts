// src/services/QueryService.ts
import { AppDataSource } from '../config/dataSource';
import { Query } from '../entities/Query';
import { SqlValidator } from '../utils/SqlValidator';

export class QueryService {
  async executeQuery(userId: string, sqlText: string) {
    // Валидация SQL запроса
    const validation = SqlValidator.validate(sqlText);
    if (!validation.isValid) {
      return {
        error: validation.message || 'Недопустимый SQL запрос',
        isSuccess: false,
        executionTimeMs: 0
      };
    }

    const startTime = Date.now();
    
    try {
      // Выполнение запроса
      const result = await AppDataSource.query(sqlText);
      
      const executionTimeMs = Date.now() - startTime;
      
      // Сохранение запроса в историю
      const queryRepository = AppDataSource.getRepository(Query);
      await queryRepository.save({
        userId,
        sqlText,
        result: JSON.stringify(result),
        isSuccess: true,
        executionTimeMs
      });
      
      return {
        result: JSON.stringify(result),
        isSuccess: true,
        executionTimeMs
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Ошибка выполнения запроса';
      
      // Сохранение ошибочного запроса в историю
      const queryRepository = AppDataSource.getRepository(Query);
      await queryRepository.save({
        userId,
        sqlText,
        error: errorMessage,
        isSuccess: false,
        executionTimeMs
      });
      
      return {
        error: errorMessage,
        isSuccess: false,
        executionTimeMs
      };
    }
  }

  // Добавляем метод getQueryHistory
  async getQueryHistory(userId: string, limit: number) {
    const queryRepository = AppDataSource.getRepository(Query);
    
    // Получаем историю запросов пользователя, отсортированную по дате создания (новые вверху)
    const queries = await queryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit
    });
    
    return queries;
  }
}