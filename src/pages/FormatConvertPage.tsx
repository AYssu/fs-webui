import { useState, useEffect } from 'react';
import { Card, Button, message, Space, Typography, List, Tag, Radio, Divider } from 'antd';
import { FileTextOutlined, SwapOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;

interface FileInfo {
  index: number;
  filename: string;
  path: string;
  size: number;
  type: 'bin' | 'txt';
  bitSize?: number;
  modifiedTime: string;
}

export default function FormatConvertPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);
  const [convertMode, setConvertMode] = useState<'bin2txt' | 'txt2bin'>('bin2txt');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await axios.get('/api/files/list?type=bin,out,txt,db');
      setFiles(response.data.files);
    } catch (error) {
      message.error('加载文件列表失败');
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      message.warning('请先选择文件');
      return;
    }

    const file = files.find(f => f.index === selectedFile);
    if (!file) return;

    // 验证文件类型
    if (convertMode === 'bin2txt' && file.type !== 'bin') {
      message.error('请选择二进制文件(.bin/.out)');
      return;
    }
    if (convertMode === 'txt2bin' && file.type !== 'txt') {
      message.error('请选择文本文件(.txt/.db)');
      return;
    }

    setConverting(true);
    try {
      const response = await axios.post('/api/format/convert', {
        filePath: file.path,
        mode: convertMode
      });

      message.success(`转换完成: ${response.data.outputFile}`);
      loadFiles(); // 刷新文件列表
    } catch (error) {
      message.error('转换失败');
    } finally {
      setConverting(false);
    }
  };

  const filteredFiles = files.filter(f => {
    if (convertMode === 'bin2txt') {
      return f.type === 'bin';
    } else {
      return f.type === 'txt';
    }
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <Title level={2}>格式转换</Title>
      
      <Card title="转换模式" style={{ marginBottom: '20px' }}>
        <Radio.Group
          value={convertMode}
          onChange={(e) => {
            setConvertMode(e.target.value);
            setSelectedFile(null); // 重置选择
          }}
          size="large"
        >
          <Radio.Button value="bin2txt">
            <Space>
              <FileTextOutlined />
              二进制 → 文本
            </Space>
          </Radio.Button>
          <Radio.Button value="txt2bin">
            <Space>
              <FileTextOutlined />
              文本 → 二进制
            </Space>
          </Radio.Button>
        </Radio.Group>
        <Divider />
        <Text type="secondary">
          {convertMode === 'bin2txt' 
            ? '将二进制格式(.bin/.out)转换为可读的文本格式(.txt)'
            : '将文本格式(.txt/.db)转换为二进制格式(.bin)以提高处理速度'
          }
        </Text>
      </Card>

      <Card 
        title={`选择${convertMode === 'bin2txt' ? '二进制' : '文本'}文件`} 
        style={{ marginBottom: '20px' }}
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadFiles}>
            刷新
          </Button>
        }
      >
        {filteredFiles.length === 0 ? (
          <Text type="secondary">没有找到可转换的文件</Text>
        ) : (
          <List
            dataSource={filteredFiles}
            renderItem={(file) => (
              <List.Item
                key={file.index}
                onClick={() => setSelectedFile(file.index)}
                style={{
                  cursor: 'pointer',
                  background: selectedFile === file.index ? '#e6f7ff' : 'transparent',
                  padding: '12px',
                  borderRadius: '8px'
                }}
              >
                <Space>
                  <Tag color={selectedFile === file.index ? 'blue' : 'default'}>
                    {file.index}
                  </Tag>
                  <FileTextOutlined />
                  <Text strong>{file.filename}</Text>
                  {file.bitSize && (
                    <Tag color={file.bitSize === 32 ? 'cyan' : 'purple'}>
                      {file.bitSize}位
                    </Tag>
                  )}
                  <Text type="secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                  <Text type="secondary">{file.modifiedTime}</Text>
                </Space>
              </List.Item>
            )}
          />
        )}
      </Card>

      <Space>
        <Button
          type="primary"
          icon={<SwapOutlined />}
          onClick={handleConvert}
          disabled={!selectedFile || converting}
          size="large"
          loading={converting}
        >
          开始转换
        </Button>
      </Space>
    </div>
  );
}
