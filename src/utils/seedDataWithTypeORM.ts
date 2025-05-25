// src/utils/seedDataWithTypeORM.ts
import { AppDataSource } from '../config/dataSource';
import { User } from '../entities/User';
import * as bcrypt from 'bcrypt';

export async function seedDatabase() {
  try {
    const userRepository = AppDataSource.getRepository(User);
    
    // Проверяем, есть ли уже пользователи в базе
    const count = await userRepository.count();
    
    if (count === 0) {
      // Создаем тестовых пользователей
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const admin = userRepository.create({
        username: 'admin',
        email: 'admin@example.com', // Добавляем email
        password: hashedPassword,
        role: 'admin'
      });
      
      const user1 = userRepository.create({
        username: 'ivan',
        email: 'ivan@example.com', // Добавляем email
        password: hashedPassword,
        role: 'user'
      });
      
      const user2 = userRepository.create({
        username: 'maria',
        email: 'maria@example.com', // Добавляем email
        password: hashedPassword,
        role: 'user'
      });
      
      await userRepository.save([admin, user1, user2]);
      
      console.log('Тестовые пользователи успешно добавлены');
    } else {
      console.log('Пропуск добавления тестовых данных: пользователи уже существуют');
    }
  
  
  } catch (error) {
    console.error('Ошибка при добавлении тестовых данных:', error);
    throw error;
  }

  
  
}