// src/entities/UserCourse.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

@Entity('user_courses')
export class UserCourse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  courseId!: number;

  @Column('varchar', { length: 100 })
  title!: string;

  @Column('int', { default: 0 })
  progress!: number;

  @Column('int', { default: 1 })
  currentLesson!: number;

  @Column('boolean', { default: false })
  completed!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, user => user.courses)
  @JoinColumn({ name: 'userId' })
  user!: User;
}