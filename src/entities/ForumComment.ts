// src/entities/ForumComment.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './User';
import { ForumTopic } from './ForumTopic';

@Entity('forum_comments')
export class ForumComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  content!: string;

  @Column()
  userId!: string;

  @Column()
  topicId!: string;

  @Column({ nullable: true })
  parentId?: string;

  @Column('int', { default: 0 })
  likesCount!: number;

  @Column('int', { default: 0 })
  dislikesCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => ForumTopic, topic => topic.comments)
  @JoinColumn({ name: 'topicId' })
  topic!: ForumTopic;

  @ManyToOne(() => ForumComment, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent?: ForumComment;

  @OneToMany(() => ForumComment, comment => comment.parent)
  replies!: ForumComment[];
}