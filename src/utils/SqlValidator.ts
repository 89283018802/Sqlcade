// src/utils/SqlValidator.ts
// Список разрешенных таблиц для песочницы
const ALLOWED_TABLES = [
  'demo_products', 
  'demo_categories', 
  'demo_orders', 
  'demo_customers',
  'demo_order_items'
];

// Список запрещенных таблиц, содержащих конфиденциальные данные
const FORBIDDEN_TABLES = [
  'users', 
  'user_courses', 
  'queries'
];

export class SqlValidator {
  static validate(sqlQuery: string): { isValid: boolean; message?: string } {
    // Проверка на пустой запрос
    if (!sqlQuery || sqlQuery.trim() === '') {
      return {
        isValid: false,
        message: 'SQL запрос не может быть пустым'
      };
    }
    
    // Приводим запрос к верхнему регистру для простоты проверки
    const uppercaseQuery = sqlQuery.toUpperCase();
    
    // Проверка на опасные операции изменения структуры БД
    const dangerousOperations = [
      'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE'
    ];
    
    for (const op of dangerousOperations) {
      if (uppercaseQuery.includes(op + ' ') || uppercaseQuery.startsWith(op + ' ')) {
        return {
          isValid: false,
          message: `Операция "${op}" запрещена в песочнице`
        };
      }
    }
    
    // Проверка размера запроса
    if (sqlQuery.length > 5000) {
      return {
        isValid: false,
        message: 'Запрос слишком длинный (максимальная длина 5000 символов)'
      };
    }
    
    // Проверка на запрещенные таблицы
    for (const table of FORBIDDEN_TABLES) {
      const tablePattern = new RegExp(`\\bFROM\\s+${table}\\b|\\bJOIN\\s+${table}\\b|\\bINTO\\s+${table}\\b|\\bUPDATE\\s+${table}\\b`, 'i');
      if (tablePattern.test(sqlQuery)) {
        return {
          isValid: false,
          message: `Доступ к таблице "${table}" запрещен в песочнице`
        };
      }
    }
    
    // Проверка, что используются только разрешенные таблицы
    const tablePattern = /\bFROM\s+(\w+)\b|\bJOIN\s+(\w+)\b|\bINTO\s+(\w+)\b|\bUPDATE\s+(\w+)\b/gi;
    let match;
    let foundTables = [];
    
    while ((match = tablePattern.exec(sqlQuery)) !== null) {
      // Ищем первую непустую группу в массиве совпадений
      const tableName = match.slice(1).find(m => m !== undefined);
      if (tableName) {
        foundTables.push(tableName.toLowerCase());
      }
    }
    
    // Проверяем, что все найденные таблицы разрешены
    for (const table of foundTables) {
      if (!ALLOWED_TABLES.includes(table)) {
        return {
          isValid: false,
          message: `Таблица "${table}" не доступна в песочнице. Используйте только таблицы: ${ALLOWED_TABLES.join(', ')}`
        };
      }
    }
    
    return { isValid: true };
  }
}