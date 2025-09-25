import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CMSBanner } from '../../../entities/cms-banner.entity';
import { CreateCMSBannerDto, UpdateCMSBannerDto, CMSBannerDto } from '../dto/cms-banner.dto';

@Injectable()
export class CMSBannerService {
  constructor(
    @InjectRepository(CMSBanner)
    private bannerRepository: Repository<CMSBanner>,
  ) {}

  async create(tenantId: string, createDto: CreateCMSBannerDto): Promise<CMSBannerDto> {
    const banner = this.bannerRepository.create({
      ...createDto,
      tenantId,
    });

    const saved = await this.bannerRepository.save(banner);
    return this.mapToDto(saved);
  }

  async findAll(tenantId: string, status?: string): Promise<CMSBannerDto[]> {
    const where: any = { tenantId };
    if (status) {
      where.status = status;
    }

    const banners = await this.bannerRepository.find({
      where,
      order: { sort: 'ASC', createdAt: 'DESC' },
    });

    return banners.map(this.mapToDto);
  }

  async findActive(tenantId: string): Promise<CMSBannerDto[]> {
    const now = new Date();
    const banners = await this.bannerRepository
      .createQueryBuilder('banner')
      .where('banner.tenantId = :tenantId', { tenantId })
      .andWhere('banner.status = :status', { status: 'active' })
      .andWhere('(banner.startAt IS NULL OR banner.startAt <= :now)', { now })
      .andWhere('(banner.endAt IS NULL OR banner.endAt >= :now)', { now })
      .orderBy('banner.sort', 'ASC')
      .addOrderBy('banner.createdAt', 'DESC')
      .getMany();

    return banners.map(this.mapToDto);
  }

  async findOne(id: string, tenantId: string): Promise<CMSBannerDto> {
    const banner = await this.bannerRepository.findOne({
      where: { id, tenantId },
    });

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    return this.mapToDto(banner);
  }

  async update(id: string, tenantId: string, updateDto: UpdateCMSBannerDto): Promise<CMSBannerDto> {
    const banner = await this.bannerRepository.findOne({
      where: { id, tenantId },
    });

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    Object.assign(banner, updateDto);
    const saved = await this.bannerRepository.save(banner);
    return this.mapToDto(saved);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.bannerRepository.delete({ id, tenantId });
    if (result.affected === 0) {
      throw new NotFoundException('Banner not found');
    }
  }

  async updateSort(tenantId: string, sortData: Array<{ id: string; sort: number }>): Promise<void> {
    for (const item of sortData) {
      await this.bannerRepository.update(
        { id: item.id, tenantId },
        { sort: item.sort }
      );
    }
  }

  private mapToDto(banner: CMSBanner): CMSBannerDto {
    return {
      id: banner.id,
      tenantId: banner.tenantId,
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      linkType: banner.linkType,
      linkPayload: banner.linkPayload,
      sort: banner.sort,
      status: banner.status,
      startAt: banner.startAt?.toISOString(),
      endAt: banner.endAt?.toISOString(),
      createdAt: banner.createdAt.toISOString(),
      updatedAt: banner.updatedAt.toISOString(),
    };
  }
}
