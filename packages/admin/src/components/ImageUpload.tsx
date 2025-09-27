
import React, { useState } from 'react';
import { Upload, Modal, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

interface ImageUploadProps {
  value?: string;
  onChange?: (value: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  
  const fileList: UploadFile[] = value ? [
    {
      uid: '-1',
      name: 'image.png',
      status: 'done',
      url: value,
    },
  ] : [];

  const handleCancel = () => setPreviewOpen(false);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  const handleChange: UploadProps['onChange'] = ({ file }) => {
    if (file.status === 'done') {
        // Assuming the API returns a JSON response with a 'url' field
        const newUrl = file.response?.url;
        if (newUrl) {
            onChange?.(newUrl);
            message.success(`${file.name} 上传成功`);
        } else {
            message.error('上传失败：服务器未返回有效的URL');
        }
    } else if (file.status === 'error') {
        message.error(`${file.name} 上传失败`);
    } else if (file.status === 'removed') {
        onChange?.('');
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  );

  return (
    <>
      <Upload
        action="/admin/files/upload" // The API endpoint for uploading files
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        maxCount={1}
      >
        {uploadButton}
      </Upload>
      <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={handleCancel}>
        <img alt="example" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  );
};
