import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('cms_articles')
export class CMSArticle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  excerpt?: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverUrl?: string;

  @Column({ 
    type: 'varchar', 
    length: 50,
    comment: 'product, resource, url, article'
  })
  linkType!: 'product' | 'resource' | 'url' | 'article';

  @Column({ type: 'text', nullable: true })
  linkPayload?: string; // JSON string for link data

  @Column({ type: 'varchar', length: 100, default: 'general' })
  category!: string;

  @Index()
  @Column({ type: 'varchar', length: 500, nullable: true })
  tags?: string; // comma-separated tags

  @Column({ type: 'int', default: 0 })
  sort!: number;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'draft',
    comment: 'draft, published, archived'
  })
  status!: 'draft' | 'published' | 'archived';

  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
