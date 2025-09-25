import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('cms_banners')
export class CMSBanner {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500 })
  imageUrl!: string;

  @Column({ 
    type: 'varchar', 
    length: 50,
    comment: 'product, resource, url, article'
  })
  linkType!: 'product' | 'resource' | 'url' | 'article';

  @Column({ type: 'text', nullable: true })
  linkPayload?: string; // JSON string for link data

  @Column({ type: 'int', default: 0 })
  sort!: number;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'active',
    comment: 'active, inactive'
  })
  status!: 'active' | 'inactive';

  @Column({ type: 'timestamp', nullable: true })
  startAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
