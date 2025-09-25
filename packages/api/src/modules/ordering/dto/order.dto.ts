import { IsString, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  skuId!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  price!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsEnum(['dine_in', 'takeaway'])
  orderType!: 'dine_in' | 'takeaway';

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsString()
  customerName!: string;

  @IsString()
  customerPhone!: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsNumber()
  totalAmount!: number;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(['PENDING', 'PAID', 'CANCELLED', 'USED', 'REFUNDING', 'REFUNDED'])
  status?: 'PENDING' | 'PAID' | 'CANCELLED' | 'USED' | 'REFUNDING' | 'REFUNDED';

  @IsOptional()
  @IsString()
  remark?: string;
}

export class OrderDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  tenantId!: string;

  @IsString()
  orderNumber!: string;

  @IsEnum(['dine_in', 'takeaway'])
  orderType!: 'dine_in' | 'takeaway';

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsString()
  customerName!: string;

  @IsString()
  customerPhone!: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsNumber()
  totalAmount!: number;

  @IsEnum(['PENDING', 'PAID', 'CANCELLED', 'USED', 'REFUNDING', 'REFUNDED'])
  status!: 'PENDING' | 'PAID' | 'CANCELLED' | 'USED' | 'REFUNDING' | 'REFUNDED';

  @IsString()
  createdAt!: string;

  @IsString()
  updatedAt!: string;
}
