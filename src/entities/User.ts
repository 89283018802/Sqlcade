// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserCourse } from './UserCourse';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;
  
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ default: 'user' })
  role!: 'admin' | 'user';

  @Column('int', { default: 1 })
  level!: number;

  @Column('int', { default: 0 })
  xp!: number;
  
@Column({ nullable: true, type: 'varchar' }) // указываем конкретный тип для БД
avatarUrl!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => UserCourse, userCourse => userCourse.user)
  courses!: UserCourse[];

  async comparePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}