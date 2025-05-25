// src/services/SandboxService.ts
import { AppDataSource } from '../config/dataSource';

export class SandboxService {
  // Выполняет SQL-запрос с проверкой безопасности
  static async executeQuery(sql: string): Promise<{ result?: any; error?: string; isSuccess: boolean; executionTimeMs: number }> {
    const startTime = Date.now();
    
    try {
      // Проверяем, что запрос не содержит операторов, которые могут изменить структуру БД
      this.validateQuery(sql);
      
      // Выполняем запрос
      const result = await AppDataSource.query(sql);
      
      // Время выполнения запроса
      const executionTimeMs = Date.now() - startTime;
      
      return {
        result,
        isSuccess: true,
        executionTimeMs
      };
    } catch (error) {
      console.error('Ошибка выполнения SQL-запроса:', error);
      
      const executionTimeMs = Date.now() - startTime;
      
      return {
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
        isSuccess: false,
        executionTimeMs
      };
    }
  }
  
  // Валидирует SQL-запрос на наличие потенциально опасных операторов
  private static validateQuery(sql: string): void {
    const dangerousOperations = [
      'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE', 
      'COMMIT', 'ROLLBACK', 'SAVEPOINT'
    ];
    
    const uppercaseSql = sql.toUpperCase();
    
    for (const op of dangerousOperations) {
      if (uppercaseSql.includes(op + ' ') || uppercaseSql.startsWith(op + ' ')) {
        throw new Error(`Операция ${op} не разрешена в песочнице`);
      }
    }
  }
}