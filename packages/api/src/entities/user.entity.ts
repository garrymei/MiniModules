import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToMany, JoinTable } from 'typeorm';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  wechatOpenId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  unionId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nickname?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'boolean', default: false })
  isAdmin: boolean;

  @Column({ type: 'boolean', default: false })
  isPlatformAdmin: boolean;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' }
  })
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}