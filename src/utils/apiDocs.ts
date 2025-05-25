import { Request, Response } from 'express';

export const generateApiDocs = (req: Request, res: Response) => {
  res.json({
    api: {
      version: '1.0',
      endpoints: [
        {
          path: '/api/queries/execute',
          method: 'POST',
          description: 'Выполнение SQL запроса',
          body: {
            sqlText: 'Текст SQL запроса (string)'
          },
          response: {
            id: 'ID запроса',
            sqlText: 'Текст запроса',
            result: 'Результат выполнения (если успешно)',
            error: 'Текст ошибки (если не успешно)',
            isSuccess: 'Флаг успешности выполнения',
            executionTimeMs: 'Время выполнения в миллисекундах',
            createdAt: 'Дата создания запроса'
          }
        },
        {
          path: '/api/queries/history',
          method: 'GET',
          description: 'Получение истории запросов',
          query: {
            limit: 'Максимальное количество запросов (по умолчанию 100)'
          },
          response: 'Массив объектов запросов'
        },
        {
          path: '/api/queries/:id',
          method: 'GET',
          description: 'Получение запроса по ID',
          params: {
            id: 'ID запроса'
          },
          response: 'Объект запроса или ошибка 404'
        }
      ]
    }
  });
};