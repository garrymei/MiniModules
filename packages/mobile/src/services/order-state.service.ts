import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface OrderStatus {
  status: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  canCancel: boolean;
  canRefund: boolean;
  showProgress: boolean;
}

export interface OrderStateTransition {
  from: string;
  to: string;
  allowed: boolean;
  conditions?: string[];
  actions?: string[];
}

export interface OrderProgress {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    status: string;
    label: string;
    completed: boolean;
    active: boolean;
    timestamp?: Date;
    description?: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class OrderStateService {
  private orderStatusSubject = new BehaviorSubject<OrderStatus[]>([]);
  public orderStatuses$ = this.orderStatusSubject.asObservable();

  // 订单状态定义
  private readonly orderStatuses: OrderStatus[] = [
    {
      status: 'PENDING',
      label: '待支付',
      description: '订单已创建，等待支付',
      color: '#ffc107',
      icon: '⏳',
      canCancel: true,
      canRefund: false,
      showProgress: true
    },
    {
      status: 'CONFIRMED',
      label: '已确认',
      description: '支付成功，订单已确认',
      color: '#17a2b8',
      icon: '✅',
      canCancel: true,
      canRefund: true,
      showProgress: true
    },
    {
      status: 'PREPARING',
      label: '准备中',
      description: '商家正在准备您的订单',
      color: '#fd7e14',
      icon: '👨‍🍳',
      canCancel: true,
      canRefund: true,
      showProgress: true
    },
    {
      status: 'READY',
      label: '待取餐',
      description: '订单已准备完成，可以取餐',
      color: '#20c997',
      icon: '🍽️',
      canCancel: false,
      canRefund: true,
      showProgress: true
    },
    {
      status: 'COMPLETED',
      label: '已完成',
      description: '订单已完成',
      color: '#28a745',
      icon: '🎉',
      canCancel: false,
      canRefund: true,
      showProgress: false
    },
    {
      status: 'CANCELLED',
      label: '已取消',
      description: '订单已取消',
      color: '#6c757d',
      icon: '❌',
      canCancel: false,
      canRefund: false,
      showProgress: false
    }
  ];

  // 状态流转规则
  private readonly stateTransitions: Record<string, string[]> = {
    'PENDING': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['PREPARING', 'CANCELLED'],
    'PREPARING': ['READY', 'CANCELLED'],
    'READY': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [],
    'CANCELLED': []
  };

  constructor(private http: HttpClient) {
    this.orderStatusSubject.next(this.orderStatuses);
  }

  /**
   * 获取订单状态信息
   */
  getOrderStatus(status: string): OrderStatus | undefined {
    return this.orderStatuses.find(s => s.status === status);
  }

  /**
   * 获取所有订单状态
   */
  getAllOrderStatuses(): OrderStatus[] {
    return [...this.orderStatuses];
  }

  /**
   * 检查状态转换是否允许
   */
  canTransition(from: string, to: string): boolean {
    const allowedTransitions = this.stateTransitions[from] || [];
    return allowedTransitions.includes(to);
  }

  /**
   * 获取允许的状态转换
   */
  getAllowedTransitions(currentStatus: string): string[] {
    return this.stateTransitions[currentStatus] || [];
  }

  /**
   * 生成订单进度
   */
  generateOrderProgress(currentStatus: string, orderHistory?: any[]): OrderProgress {
    const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    const steps = statusOrder.map((status, index) => {
      const statusInfo = this.getOrderStatus(status);
      const isCompleted = index <= currentIndex;
      const isActive = index === currentIndex;
      
      // 从历史记录中查找时间戳
      const historyEntry = orderHistory?.find(h => h.status === status);
      
      return {
        status,
        label: statusInfo?.label || status,
        completed: isCompleted,
        active: isActive,
        timestamp: historyEntry?.timestamp ? new Date(historyEntry.timestamp) : undefined,
        description: statusInfo?.description
      };
    });

    return {
      currentStep: currentIndex + 1,
      totalSteps: statusOrder.length,
      steps
    };
  }

  /**
   * 获取订单状态历史
   */
  getOrderStatusHistory(orderId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/orders/${orderId}/status-history`);
  }

  /**
   * 更新订单状态
   */
  updateOrderStatus(
    orderId: string, 
    newStatus: string, 
    context?: any
  ): Observable<any> {
    return this.http.post(`/api/orders/${orderId}/status`, {
      status: newStatus,
      context
    });
  }

  /**
   * 取消订单
   */
  cancelOrder(orderId: string, reason?: string): Observable<any> {
    return this.http.post(`/api/orders/${orderId}/cancel`, {
      reason
    });
  }

  /**
   * 申请退款
   */
  requestRefund(orderId: string, reason?: string): Observable<any> {
    return this.http.post(`/api/orders/${orderId}/refund`, {
      reason
    });
  }

  /**
   * 获取订单详情
   */
  getOrderDetails(orderId: string): Observable<any> {
    return this.http.get(`/api/orders/${orderId}`);
  }

  /**
   * 检查订单是否可以取消
   */
  canCancelOrder(order: any): { canCancel: boolean; reason?: string } {
    const statusInfo = this.getOrderStatus(order.status);
    
    if (!statusInfo) {
      return { canCancel: false, reason: '未知订单状态' };
    }

    if (!statusInfo.canCancel) {
      return { canCancel: false, reason: '当前状态不允许取消' };
    }

    // 检查时间限制
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    const maxCancelTime = 30 * 60 * 1000; // 30分钟

    if (orderAge > maxCancelTime && order.status !== 'PENDING') {
      return { canCancel: false, reason: '订单创建时间过长，无法取消' };
    }

    return { canCancel: true };
  }

  /**
   * 检查订单是否可以退款
   */
  canRefundOrder(order: any): { canRefund: boolean; reason?: string } {
    const statusInfo = this.getOrderStatus(order.status);
    
    if (!statusInfo) {
      return { canRefund: false, reason: '未知订单状态' };
    }

    if (!statusInfo.canRefund) {
      return { canRefund: false, reason: '当前状态不允许退款' };
    }

    // 检查时间限制
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    const maxRefundTime = 7 * 24 * 60 * 60 * 1000; // 7天

    if (orderAge > maxRefundTime) {
      return { canRefund: false, reason: '订单创建时间过长，无法退款' };
    }

    return { canRefund: true };
  }

  /**
   * 获取状态转换提示
   */
  getStatusTransitionHint(from: string, to: string): string {
    const hints: Record<string, Record<string, string>> = {
      'PENDING': {
        'CONFIRMED': '支付成功后订单将自动确认',
        'CANCELLED': '取消后订单将无法恢复'
      },
      'CONFIRMED': {
        'PREPARING': '商家开始准备您的订单',
        'CANCELLED': '取消后可能需要处理退款'
      },
      'PREPARING': {
        'READY': '订单准备完成，可以取餐',
        'CANCELLED': '准备中取消可能需要处理退款'
      },
      'READY': {
        'COMPLETED': '取餐后订单将完成',
        'CANCELLED': '取餐前取消可能需要处理退款'
      }
    };

    return hints[from]?.[to] || '状态转换';
  }

  /**
   * 格式化状态时间
   */
  formatStatusTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60 * 1000) {
      return '刚刚';
    } else if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    } else {
      return timestamp.toLocaleDateString();
    }
  }

  /**
   * 获取订单状态统计
   */
  getOrderStatusStats(orders: any[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.orderStatuses.forEach(status => {
      stats[status.status] = 0;
    });

    orders.forEach(order => {
      if (stats.hasOwnProperty(order.status)) {
        stats[order.status]++;
      }
    });

    return stats;
  }

  /**
   * 获取订单状态趋势
   */
  getOrderStatusTrend(orders: any[], days: number = 7): Array<{
    date: string;
    statuses: Record<string, number>;
  }> {
    const trend: Array<{
      date: string;
      statuses: Record<string, number>;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === dateStr;
      });

      const statuses: Record<string, number> = {};
      this.orderStatuses.forEach(status => {
        statuses[status.status] = 0;
      });

      dayOrders.forEach(order => {
        if (statuses.hasOwnProperty(order.status)) {
          statuses[order.status]++;
        }
      });

      trend.push({ date: dateStr, statuses });
    }

    return trend;
  }
}
