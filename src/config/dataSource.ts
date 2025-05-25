// src/config/dataSource.ts
import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { UserCourse } from '../entities/UserCourse';
import { Query } from '../entities/Query';
import { ForumTopic } from '../entities/ForumTopic';
import { ForumComment } from '../entities/ForumComment';
import 'dotenv/config';
import path from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'mitokarev',
  database: process.env.DB_NAME || 'sql_sandbox',
  synchronize: process.env.NODE_ENV !== 'production', // Включаем только для разработки
  logging: process.env.NODE_ENV !== 'production',
  entities: [User, UserCourse, Query, ForumTopic, ForumComment],
  migrations: [path.join(__dirname, '../migration/*.ts')],
  subscribers: [],
});