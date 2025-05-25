// src/entities/ForumTopic.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './User';
import { ForumComment } from './ForumComment';

@Entity('forum_topics')
export class ForumTopic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  content!: string;

  @Column('simple-array', { nullable: true })
  tags!: string[];

  @Column()
  userId!: string;

  @Column({ default: 0 })
  viewCount!: number;

  @Column({ default: false })
  isPinned!: boolean;

  @Column({ default: false })
  isClosed!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => ForumComment, comment => comment.topic)
  comments!: ForumComment[];
}