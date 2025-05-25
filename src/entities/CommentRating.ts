// src/entities/CommentRating.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { ForumComment } from './ForumComment';

@Entity('comment_ratings')
export class CommentRating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  commentId!: string;

  @Column('varchar', { length: 10 })
  type!: 'like' | 'dislike';

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => ForumComment)
  @JoinColumn({ name: 'commentId' })
  comment!: ForumComment;
}