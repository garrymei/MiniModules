import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 手机号验证装饰器
 */
@ValidatorConstraint({ async: false })
export class IsPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(phoneNumber: string, args: ValidationArguments) {
    if (!phoneNumber) return false;
    // 中国手机号正则
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  defaultMessage(args: ValidationArguments) {
    return '手机号格式不正确';
  }
}

export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPhoneNumberConstraint,
    });
  };
}

/**
 * 邮箱验证装饰器
 */
@ValidatorConstraint({ async: false })
export class IsEmailConstraint implements ValidatorConstraintInterface {
  validate(email: string, args: ValidationArguments) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  defaultMessage(args: ValidationArguments) {
    return '邮箱格式不正确';
  }
}

export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailConstraint,
    });
  };
}

/**
 * 金额验证装饰器
 */
@ValidatorConstraint({ async: false })
export class IsAmountConstraint implements ValidatorConstraintInterface {
  validate(amount: number, args: ValidationArguments) {
    if (typeof amount !== 'number') return false;
    if (amount < 0) return false;
    // 检查小数位数不超过2位
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    return decimalPlaces <= 2;
  }

  defaultMessage(args: ValidationArguments) {
    return '金额必须是非负数，且小数位数不超过2位';
  }
}

export function IsAmount(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAmountConstraint,
    });
  };
}

/**
 * 字符串长度验证装饰器
 */
export function IsStringLength(min: number, max: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {
        ...validationOptions,
        message: `字符串长度必须在${min}到${max}个字符之间`,
      },
      constraints: [min, max],
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          return value.length >= min && value.length <= max;
        },
      },
    });
  };
}

/**
 * 数组长度验证装饰器
 */
export function IsArrayLength(min: number, max: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {
        ...validationOptions,
        message: `数组长度必须在${min}到${max}之间`,
      },
      constraints: [min, max],
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!Array.isArray(value)) return false;
          return value.length >= min && value.length <= max;
        },
      },
    });
  };
}

/**
 * 正整数验证装饰器
 */
@ValidatorConstraint({ async: false })
export class IsPositiveIntegerConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    if (typeof value !== 'number') return false;
    return Number.isInteger(value) && value > 0;
  }

  defaultMessage(args: ValidationArguments) {
    return '必须是正整数';
  }
}

export function IsPositiveInteger(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPositiveIntegerConstraint,
    });
  };
}

/**
 * 非空字符串验证装饰器
 */
@ValidatorConstraint({ async: false })
export class IsNonEmptyStringConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  defaultMessage(args: ValidationArguments) {
    return '不能为空字符串';
  }
}

export function IsNonEmptyString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNonEmptyStringConstraint,
    });
  };
}

/**
 * 字符串去空格转换器
 */
export function TrimString() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  });
}

/**
 * 数字转换器
 */
export function ToNumber() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }
    return value;
  });
}

/**
 * 布尔值转换器
 */
export function ToBoolean() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  });
}
