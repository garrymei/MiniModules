import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, message, Alert, Typography, Space, Divider } from 'antd';
import { QrcodeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { apiClient } from '../services/apiClient';

const { Title, Paragraph, Text } = Typography;

interface VerificationResult {
    success: boolean;
    message: string;
    booking?: any; // Define a proper booking interface
}

export const VerificationPage = () => {
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const handleVerification = async (code: string) => {
    if (!code) {
      message.warning('请输入或扫描核销码');
      return;
    }
    try {
      setLoading(true);
      setResult(null);
      const response = await apiClient.post('/api/booking/verification/verify', { 
        code, 
        tenantId: 'current-tenant' // In a real app, get this from user context or a selector
      });
      setResult(response.data);
      if(response.data.success) {
          message.success('核销成功');
      } else {
          message.error(response.data.message || '核销失败');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '核销时发生错误';
      setResult({ success: false, message: errorMessage });
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;
    
    try {
      codeReaderRef.current = new BrowserMultiFormatReader();
      await codeReaderRef.current.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result) {
          // Stop scanning after successful decode
          stopScanning();
          handleScan(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
          console.error('Scan error:', err);
        }
      });
    } catch (err) {
      console.error('Failed to start scanning:', err);
      message.error('无法启动摄像头，请检查权限设置');
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
  };

  const handleScan = (data: string) => {
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'booking_verification' && parsed.code) {
          handleVerification(parsed.code);
        } else {
          message.error('无效的二维码');
        }
      } catch (e) {
        // If not a JSON, maybe it's the code itself
        handleVerification(data);
      }
    }
  };

  const handleManualSubmit = () => {
    handleVerification(manualCode);
  };

  useEffect(() => {
    if (scanning) {
      startScanning();
    } else {
      stopScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [scanning]);

  return (
    <div>
      <Title level={3}>核销</Title>
      <Paragraph type="secondary">通过扫描二维码或手动输入核销码来核销预约或订单。</Paragraph>
      
      <Card title="扫码核销" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <Button 
            type={scanning ? "primary" : "default"} 
            onClick={() => setScanning(!scanning)}
          >
            {scanning ? '停止扫描' : '开始扫描'}
          </Button>
        </div>
        
        {scanning && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <video 
              ref={videoRef} 
              style={{ width: '100%', maxWidth: 400, border: '1px solid #eee' }}
            />
          </div>
        )}
        
        {!scanning && (
          <div style={{ width: 300, height: 300, background: '#f0f0f0', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
            <Text type="secondary">点击"开始扫描"按钮启动摄像头</Text>
          </div>
        )}
      </Card>

      <Card title="手动核销">
        <Space.Compact style={{ width: '100%' }}>
          <Input 
            size="large"
            placeholder="请输入核销码"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            prefix={<QrcodeOutlined />}
          />
          <Button 
            type="primary" 
            size="large"
            loading={loading}
            onClick={handleManualSubmit}
          >
            确认核销
          </Button>
        </Space.Compact>
      </Card>

      {result && (
        <Card title="核销结果" style={{ marginTop: 24 }}>
          <Alert
            message={result.success ? '核销成功' : '核销失败'}
            description={result.message}
            type={result.success ? 'success' : 'error'}
            showIcon
            icon={result.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          />
          {result.success && result.booking && (
            <div style={{ marginTop: 16 }}>
                <Title level={5}>预约详情</Title>
                <Text><strong>预约号:</strong> {result.booking.bookingNumber}</Text><br/>
                <Text><strong>资源:</strong> {result.booking.resourceName}</Text><br/>
                <Text><strong>时间:</strong> {result.booking.date} {result.booking.timeSlot}</Text>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};