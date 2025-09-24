import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum CMSContentType {
  BANNER = 'banner',
  ANNOUNCEMENT = 'announcement',
  ARTICLE = 'article',
  ACTIVITY = 'activity',
  NEWS = 'news'
}

export enum CMSContentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum CMSJumpType {
  PAGE = 'page',           // 跳转到页面
  URL = 'url',            // 跳转到外部链接
  INTERNAL = 'internal',   // 内部跳转
  NONE = 'none'           // 无跳转
}

@Entity('cms_contents')
export class CMSContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ 
    type: 'enum', 
    enum: CMSContentType 
  })
  @Index()
  type: CMSContentType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  summary: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImage: string;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @Column({ 
    type: 'enum', 
    enum: CMSContentStatus,
    default: CMSContentStatus.DRAFT 
  })
  @Index()
  status: CMSContentStatus;

  @Column({ 
    type: 'enum', 
    enum: CMSJumpType,
    default: CMSJumpType.NONE 
  })
  jumpType: CMSJumpType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  jumpUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
