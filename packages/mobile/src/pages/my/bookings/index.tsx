import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button, Modal } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useI18n } from '../../../hooks/useI18n';
import useUserStore from '../../../store/user';
import { getStoredTenantId } from '../../../services/config';
import { fetchUserBookings, type BookingSummary } from '../../../services/booking';
// In a real project, you would install and import a QR code library.
// e.g., import QRCode from 'taro-qrcode-react-native';
import { QRCode } from '../../../components/QRCode'; // Placeholder component
import './index.scss';

// The interface is extended to include the full verification payload
interface BookingSummary {
  id: string;
  bookingNumber: string;
  status: string;
  resourceName: string;
  date: string;
  timeSlot: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
  qrCodeData?: string; // The full data for the QR code
}

const MyBookingsPage: React.FC = () => {
  const { t } = useI18n();
  const profile = useUserStore((state) => state.profile);
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState('');
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);

  useEffect(() => {
    const storedTenantId = getStoredTenantId();
    setTenantId(storedTenantId);
    if (profile?.userId && storedTenantId) {
      loadBookings(storedTenantId, profile.userId);
    }
  }, [profile?.userId]);

  const loadBookings = async (currentTenantId: string, currentUserId: string) => {
    try {
      setLoading(true);
      const bookingList = await fetchUserBookings(currentTenantId, currentUserId);
      setBookings(bookingList);
    } catch (error) {
      console.error('加载预约失败:', error);
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleShowQrCode = (booking: BookingSummary) => {
    if (booking.qrCodeData) {
      setQrCodeValue(booking.qrCodeData);
      setIsQrModalVisible(true);
    }
  };

  // ... (other handlers and utility functions like getStatusText, formatDate remain the same)
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      checked_in: '已签到',
      completed: '已完成',
      cancelled: '已取消',
      no_show: '未到店'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: '#ff9500',
      confirmed: '#007aff',
      checked_in: '#34c759',
      completed: '#8e8e93',
      cancelled: '#8e8e93',
      no_show: '#ff3b30'
    }
    return colorMap[status] || '#8e8e93'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <View className="bookings-page">
        {/* Header remains the same */}
        {bookings.length > 0 ? (
            <ScrollView className="bookings-list" scrollY>
            {bookings.map((booking) => (
                <View key={booking.id} className="booking-item">
                    <View className="booking-header">
                        <Text className="booking-number">预约号: {booking.bookingNumber}</Text>
                        <View className="booking-status" style={{ color: getStatusColor(booking.status) }}>
                            {getStatusText(booking.status)}
                        </View>
                    </View>

                    <View className="booking-info">
                        <Text>资源: {booking.resourceName}</Text>
                        <Text>日期: {formatDate(booking.date)} {booking.timeSlot}</Text>
                    </View>

                    <View className="booking-footer">
                        <Text className="total-amount">¥{booking.totalAmount.toFixed(2)}</Text>
                        {booking.status === 'confirmed' && booking.qrCodeData && (
                            <Button 
                                className="qr-code-button" 
                                size="mini" 
                                type="primary"
                                onClick={(e) => { e.stopPropagation(); handleShowQrCode(booking); }}
                            >
                                核销码
                            </Button>
                        )}
                    </View>
                </View>
            ))}
            </ScrollView>
        ) : (
            <View className="empty-container">
                <Text>暂无预约记录</Text>
            </View>
        )}

        {isQrModalVisible && (
            <View className="qr-modal-overlay" onClick={() => setIsQrModalVisible(false)}>
                <View className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
                    <Text className="qr-modal-title">向商家出示此码</Text>
                    <View className="qr-code-wrapper">
                        <QRCode value={qrCodeValue} size={200} />
                    </View>
                    <Button className="qr-modal-close-btn" onClick={() => setIsQrModalVisible(false)}>关闭</Button>
                </View>
            </View>
        )}
    </View>
  );
};

export default MyBookingsPage;