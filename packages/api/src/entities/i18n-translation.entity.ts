import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('i18n_translations')
@Index(['key', 'locale', 'namespace'], { unique: true })
@Index(['locale', 'namespace'])
@Index(['namespace'])
export class I18nTranslation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  key: string;

  @Column({ type: 'varchar', length: 10 })
  locale: string;

  @Column({ type: 'varchar', length: 100, default: 'default' })
  namespace: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'text', nullable: true })
  context?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
