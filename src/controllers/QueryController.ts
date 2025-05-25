// src/controllers/QueryController.ts
import { Request, Response } from 'express';
import { QueryService } from '../services/QueryService';

export class QueryController {
  private queryService = new QueryService();

  async executeQuery(req: Request, res: Response) {
    try {
      const { sqlText } = req.body;
      
      if (!sqlText) {
        return res.status(400).json({ error: 'SQL запрос не указан' });
      }
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }
      
      const result = await this.queryService.executeQuery(userId, sqlText);
      
      return res.json(result);
    } catch (error) {
      console.error('Ошибка выполнения запроса:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Ошибка выполнения запроса',
        isSuccess: false 
      });
    }
  }

  async getQueryHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
      }
      
      const limit = parseInt(req.query.limit as string) || 100;
      
      const history = await this.queryService.getQueryHistory(userId, limit);
      
      return res.json(history);
    } catch (error) {
      console.error('Ошибка получения истории запросов:', error);
      return res.status(500).json({ error: 'Ошибка получения истории запросов' });
    }
  }
}

export default new QueryController();