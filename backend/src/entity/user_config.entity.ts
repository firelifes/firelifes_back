import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_configs', comment: '用户配置表' })
@Index(['userId', 'configKey'], { unique: true })
export class UserConfig {
  @PrimaryGeneratedColumn('increment', { comment: '配置ID，主键自增' })
  id: number;

  @Column({ name: 'user_id', type: 'int', comment: '用户ID' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'config_key', length: 100, comment: '配置键名' })
  configKey: string;

  @Column({ name: 'config_value', type: 'text', comment: '配置值（JSON字符串）' })
  configValue: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
