import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ResourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance'
}

export enum ResourceType {
  ROOM = 'room',
  TABLE = 'table',
  COURT = 'court',
  EQUIPMENT = 'equipment',
  VENUE = 'venue'
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ 
    type: 'enum', 
    enum: ResourceType, 
    default: ResourceType.ROOM 
  })
  type: ResourceType;

  @Column({ type: 'int', default: 1 })
  capacity: number;

  @Column({ type: 'jsonb', nullable: true })
  features: any;

  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  @Column({ 
    type: 'enum', 
    enum: ResourceStatus, 
    default: ResourceStatus.ACTIVE 
  })
  status: ResourceStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  basePrice: number;

  @Column({ type: 'jsonb', nullable: true })
  attributes: any;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isBookable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
