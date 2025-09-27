export enum BusinessErrorCode {
  // 通用错误
  SUCCESS = 0,
  UNKNOWN_ERROR = 1000,
  INVALID_PARAMS = 1001,
  RESOURCE_NOT_FOUND = 1002,
  OPERATION_FAILED = 1003,

  // 认证授权错误
  UNAUTHORIZED = 2000,
  FORBIDDEN = 2001,
  TOKEN_EXPIRED = 2002,
  TOKEN_INVALID = 2003,
  PERMISSION_DENIED = 2004,

  // 租户相关错误
  TENANT_NOT_FOUND = 3000,
  TENANT_DISABLED = 3001,
  TENANT_QUOTA_EXCEEDED = 3002,

  // 模块相关错误
  MODULE_NOT_FOUND = 4000,
  MODULE_DISABLED = 4001,
  MODULE_NOT_AUTHORIZED = 4002,
  MODULE_DEPENDENCY_MISSING = 4003,

  // 配置相关错误
  CONFIG_INVALID = 5000,
  CONFIG_NOT_FOUND = 5001,
  CONFIG_VERSION_MISMATCH = 5002,

  // 订单相关错误
  ORDER_NOT_FOUND = 6000,
  ORDER_STATUS_INVALID = 6001,
  ORDER_ALREADY_PAID = 6002,
  ORDER_CANNOT_CANCEL = 6003,
  INSUFFICIENT_STOCK = 6004,
  OUT_OF_STOCK = 6005,
  ORDER_ALREADY_EXISTS = 6006,
  SKU_NOT_FOUND = 6007,
  SKU_INACTIVE = 6008,

  // 预约相关错误
  BOOKING_NOT_FOUND = 7000,
  BOOKING_SLOT_UNAVAILABLE = 7001,
  BOOKING_TIME_CONFLICT = 7002,
  BOOKING_CANNOT_CANCEL = 7003,
  CONFLICT_SLOT = 7004,
  BOOKING_ALREADY_VERIFIED = 7005,
  BOOKING_EXPIRED = 7006,
  RESOURCE_UNAVAILABLE = 7008,
  RESOURCE_CAPACITY_EXCEEDED = 7009,

  // 核销相关错误
  VERIFICATION_CODE_EXPIRED = 7100,
  VERIFICATION_CODE_INVALID = 7101,
  VERIFICATION_CODE_USED = 7102,
  VERIFICATION_ATTEMPTS_EXCEEDED = 7103,

  // 支付相关错误
  PAYMENT_FAILED = 8000,
  PAYMENT_NOT_FOUND = 8001,
  PAYMENT_ALREADY_PROCESSED = 8002,
  PAYMENT_AMOUNT_MISMATCH = 8003,

  // 用户相关错误
  USER_NOT_FOUND = 9000,
  USER_ALREADY_EXISTS = 9001,
  USER_DISABLED = 9002,
  INVALID_CREDENTIALS = 9003,
}

export const BusinessErrorMessages: Record<BusinessErrorCode, string> = {
  [BusinessErrorCode.SUCCESS]: '操作成功',
  [BusinessErrorCode.UNKNOWN_ERROR]: '未知错误',
  [BusinessErrorCode.INVALID_PARAMS]: '参数无效',
  [BusinessErrorCode.RESOURCE_NOT_FOUND]: '资源不存在',
  [BusinessErrorCode.OPERATION_FAILED]: '操作失败',

  [BusinessErrorCode.UNAUTHORIZED]: '未授权访问',
  [BusinessErrorCode.FORBIDDEN]: '禁止访问',
  [BusinessErrorCode.TOKEN_EXPIRED]: '令牌已过期',
  [BusinessErrorCode.TOKEN_INVALID]: '令牌无效',
  [BusinessErrorCode.PERMISSION_DENIED]: '权限不足',

  [BusinessErrorCode.TENANT_NOT_FOUND]: '租户不存在',
  [BusinessErrorCode.TENANT_DISABLED]: '租户已禁用',
  [BusinessErrorCode.TENANT_QUOTA_EXCEEDED]: '租户配额已超限',

  [BusinessErrorCode.MODULE_NOT_FOUND]: '模块不存在',
  [BusinessErrorCode.MODULE_DISABLED]: '模块已禁用',
  [BusinessErrorCode.MODULE_NOT_AUTHORIZED]: '模块未授权',
  [BusinessErrorCode.MODULE_DEPENDENCY_MISSING]: '模块依赖缺失',

  [BusinessErrorCode.CONFIG_INVALID]: '配置无效',
  [BusinessErrorCode.CONFIG_NOT_FOUND]: '配置不存在',
  [BusinessErrorCode.CONFIG_VERSION_MISMATCH]: '配置版本不匹配',

  [BusinessErrorCode.ORDER_NOT_FOUND]: '订单不存在',
  [BusinessErrorCode.ORDER_STATUS_INVALID]: '订单状态无效',
  [BusinessErrorCode.ORDER_ALREADY_PAID]: '订单已支付',
  [BusinessErrorCode.ORDER_CANNOT_CANCEL]: '订单无法取消',
  [BusinessErrorCode.INSUFFICIENT_STOCK]: '库存不足',
  [BusinessErrorCode.OUT_OF_STOCK]: '商品缺货',
  [BusinessErrorCode.ORDER_ALREADY_EXISTS]: '订单已存在',
  [BusinessErrorCode.SKU_NOT_FOUND]: '商品规格不存在',
  [BusinessErrorCode.SKU_INACTIVE]: '商品规格已下架',

  [BusinessErrorCode.BOOKING_NOT_FOUND]: '预约不存在',
  [BusinessErrorCode.BOOKING_SLOT_UNAVAILABLE]: '预约时段不可用',
  [BusinessErrorCode.BOOKING_TIME_CONFLICT]: '预约时间冲突',
  [BusinessErrorCode.BOOKING_CANNOT_CANCEL]: '预约无法取消',
  [BusinessErrorCode.CONFLICT_SLOT]: '时段冲突',
  [BusinessErrorCode.BOOKING_ALREADY_VERIFIED]: '预约已核销',
  [BusinessErrorCode.BOOKING_EXPIRED]: '预约已过期',
  [BusinessErrorCode.RESOURCE_UNAVAILABLE]: '场地不可用',
  [BusinessErrorCode.RESOURCE_CAPACITY_EXCEEDED]: '场地容量已满',

  [BusinessErrorCode.VERIFICATION_CODE_EXPIRED]: '核销码已过期',
  [BusinessErrorCode.VERIFICATION_CODE_INVALID]: '核销码无效',
  [BusinessErrorCode.VERIFICATION_CODE_USED]: '核销码已使用',
  [BusinessErrorCode.VERIFICATION_ATTEMPTS_EXCEEDED]: '核销尝试次数超限',

  [BusinessErrorCode.PAYMENT_FAILED]: '支付失败',
  [BusinessErrorCode.PAYMENT_NOT_FOUND]: '支付记录不存在',
  [BusinessErrorCode.PAYMENT_ALREADY_PROCESSED]: '支付已处理',
  [BusinessErrorCode.PAYMENT_AMOUNT_MISMATCH]: '支付金额不匹配',

  [BusinessErrorCode.USER_NOT_FOUND]: '用户不存在',
  [BusinessErrorCode.USER_ALREADY_EXISTS]: '用户已存在',
  [BusinessErrorCode.USER_DISABLED]: '用户已禁用',
  [BusinessErrorCode.INVALID_CREDENTIALS]: '凭据无效',
};