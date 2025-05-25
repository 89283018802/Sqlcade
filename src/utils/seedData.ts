// src/utils/seedData.ts
import { AppDataSource } from '../config/dataSource';

export async function seedDatabase() {
  try {
    // Создаем таблицы с использованием UUID вместо SERIAL
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        content TEXT,
        user_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Создаем таблицу комментариев
    await AppDataSource.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        user_id UUID REFERENCES users(id),
        post_id UUID REFERENCES posts(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Добавляем тестовые данные
    // Сначала создаем пользователей с хешированными паролями
    const users = await AppDataSource.query(`
      INSERT INTO users (name, email, username, password, role)
      VALUES 
        ('Иван Петров', 'ivan@example.com', 'ivan', '$2b$10$3GyD8E43.7CsJ.UqTgVrD.DP.fO.j7Hs9f3tULxP5dPjvFJMJ.nHu', 'user'),
        ('Мария Сидорова', 'maria@example.com', 'maria', '$2b$10$3GyD8E43.7CsJ.UqTgVrD.DP.fO.j7Hs9f3tULxP5dPjvFJMJ.nHu', 'user'),
        ('Админ', 'admin@example.com', 'admin', '$2b$10$3GyD8E43.7CsJ.UqTgVrD.DP.fO.j7Hs9f3tULxP5dPjvFJMJ.nHu', 'admin')
      ON CONFLICT (username) DO NOTHING
      RETURNING id
    `);
    
    if (users && users.length > 0) {
      // Используем возвращенные ID для создания постов
      await AppDataSource.query(`
        INSERT INTO posts (title, content, user_id)
        VALUES 
          ('Первый пост', 'Содержимое первого поста', $1),
          ('О базах данных', 'SQL - это язык запросов к реляционным базам данных', $2)
      `, [users[0].id, users[1].id]);
      
      // Получаем ID созданных постов
      const posts = await AppDataSource.query(`SELECT id FROM posts LIMIT 2`);
      
      if (posts && posts.length > 0) {
        // Создаем комментарии
        await AppDataSource.query(`
          INSERT INTO comments (content, user_id, post_id)
          VALUES 
            ('Отличный пост!', $1, $2),
            ('Спасибо за информацию', $2, $2)
        `, [users[1].id, posts[0].id]);
      }
    }
    
    console.log('Тестовые данные успешно добавлены');
  } catch (error) {
    console.error('Ошибка при добавлении тестовых данных:', error);
    throw error;
  }
}