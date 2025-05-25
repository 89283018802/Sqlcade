// src/entities/Query.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('queries')
export class Query {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  sqlText!: string;

  @Column('text', { nullable: true })
  result?: string;

  @Column('text', { nullable: true })
  error?: string;

  @Column('boolean', { default: false })
  isSuccess!: boolean;

  @Column('int', { default: 0 })
  executionTimeMs!: number;

  @Column()
  userId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;
}