// src/migration/1698765432-InitialSchema.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1698765432 implements MigrationInterface {
    name = 'InitialSchema1698765432'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Создание таблицы пользователей
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "users" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "username" VARCHAR(100) UNIQUE NOT NULL,
                "email" VARCHAR(100) UNIQUE NOT NULL,
                "password" VARCHAR(255) NOT NULL,
                "role" VARCHAR(20) DEFAULT 'user',
                "level" INTEGER DEFAULT 1,
                "xp" INTEGER DEFAULT 0,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Создание таблицы курсов пользователей
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_courses" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "userId" UUID NOT NULL,
                "courseId" INTEGER NOT NULL,
                "title" VARCHAR(100) NOT NULL,
                "progress" INTEGER DEFAULT 0,
                "currentLesson" INTEGER DEFAULT 1,
                "completed" BOOLEAN DEFAULT false,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
            )
        `);

        // Создание таблицы запросов
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "queries" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "sqlText" TEXT NOT NULL,
                "result" TEXT,
                "error" TEXT,
                "isSuccess" BOOLEAN DEFAULT false,
                "executionTimeMs" INTEGER DEFAULT 0,
                "userId" UUID NOT NULL,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
            )
        `);
        await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "forum_topics" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(255) NOT NULL,
        "content" TEXT NOT NULL,
        "userId" UUID NOT NULL,
        "viewCount" INTEGER DEFAULT 0,
        "isPinned" BOOLEAN DEFAULT false,
        "isClosed" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
    )
`);
  // Обновляем таблицу комментариев форума
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "forum_comments" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "content" TEXT NOT NULL,
                "userId" UUID NOT NULL,
                "topicId" UUID NOT NULL,
                "parentId" UUID NULL,
                "likesCount" INTEGER DEFAULT 0,
                "dislikesCount" INTEGER DEFAULT 0,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
                FOREIGN KEY ("topicId") REFERENCES "forum_topics" ("id") ON DELETE CASCADE,
                FOREIGN KEY ("parentId") REFERENCES "forum_comments" ("id") ON DELETE CASCADE
            )
        `);

        // Создаем таблицу для тегов тем
        await queryRunner.query(`
            ALTER TABLE "forum_topics" ADD COLUMN IF NOT EXISTS "tags" TEXT[];
        `);

        // Создаем таблицу рейтингов комментариев
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "comment_ratings" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "userId" UUID NOT NULL,
                "commentId" UUID NOT NULL,
                "type" VARCHAR(10) NOT NULL CHECK (type IN ('like', 'dislike')),
                FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
                FOREIGN KEY ("commentId") REFERENCES "forum_comments" ("id") ON DELETE CASCADE,
                UNIQUE("userId", "commentId")
            )
        `);
    

// Создание таблицы комментариев форума
await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "forum_comments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "content" TEXT NOT NULL,
        "userId" UUID NOT NULL,
        "topicId" UUID NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        FOREIGN KEY ("topicId") REFERENCES "forum_topics" ("id") ON DELETE CASCADE
    )
`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "queries"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "user_courses"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "comment_ratings"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "forum_comments"`);
await queryRunner.query(`DROP TABLE IF EXISTS "forum_topics"`);
    }
}