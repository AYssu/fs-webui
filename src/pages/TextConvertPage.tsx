import React, { useState } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Select, 
  Row, 
  Col,
  Divider,
  message
} from 'antd';
import {
  SwapOutlined,
  CopyOutlined,
  ClearOutlined,
  DownloadOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TextConvertPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [convertType, setConvertType] = useState('base64_encode');

  const convertFunctions = {
    // Base64
    base64_encode: (text: string) => btoa(unescape(encodeURIComponent(text))),
    base64_decode: (text: string) => {
      try {
        return decodeURIComponent(escape(atob(text)));
      } catch {
        return '解码失败：无效的 Base64 格式';
      }
    },
    
    // URL 编码
    url_encode: (text: string) => encodeURIComponent(text),
    url_decode: (text: string) => {
      try {
        return decodeURIComponent(text);
      } catch {
        return '解码失败：无效的 URL 编码格式';
      }
    },
    
    // HTML 编码
    html_encode: (text: string) => 
      text.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;'),
    html_decode: (text: string) => 
      text.replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'"),
    
    // 十六进制
    hex_encode: (text: string) => 
      Array.from(new TextEncoder().encode(text))
           .map(b => b.toString(16).padStart(2, '0'))
           .join(''),
    hex_decode: (text: string) => {
      try {
        const hex = text.replace(/\s/g, '');
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
          bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        return new TextDecoder().decode(new Uint8Array(bytes));
      } catch {
        return '解码失败：无效的十六进制格式';
      }
    },
    
    // MD5 (简单实现，实际项目中应使用专业库)
    md5: (text: string) => {
      // 这里只是示例，实际应该使用 crypto-js 等库
      return `MD5(${text}) - 需要引入 crypto-js 库`;
    },
    
    // 大小写转换
    uppercase: (text: string) => text.toUpperCase(),
    lowercase: (text: string) => text.toLowerCase(),
    
    // JSON 格式化
    json_format: (text: string) => {
      try {
        const obj = JSON.parse(text);
        return JSON.stringify(obj, null, 2);
      } catch {
        return '格式化失败：无效的 JSON 格式';
      }
    },
    json_minify: (text: string) => {
      try {
        const obj = JSON.parse(text);
        return JSON.stringify(obj);
      } catch {
        return '压缩失败：无效的 JSON 格式';
      }
    }
  };

  const handleConvert = () => {
    if (!inputText.trim()) {
      message.warning('请输入要转换的文本');
      return;
    }

    const convertFunc = convertFunctions[convertType as keyof typeof convertFunctions];
    if (convertFunc) {
      const result = convertFunc(inputText);
      setOutputText(result);
    }
  };

  const handleCopy = async () => {
    if (!outputText) {
      message.warning('没有可复制的内容');
      return;
    }

    try {
      await navigator.clipboard.writeText(outputText);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  const handleDownload = () => {
    if (!outputText) {
      message.warning('没有可下载的内容');
      return;
    }

    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_text_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('文件下载成功');
  };

  const handleSwap = () => {
    const temp = inputText;
    setInputText(outputText);
    setOutputText(temp);
  };

  return (
    <div className="page-container">
      <Card className="glass-card">
        <Title level={3}>文本转换</Title>
        <Text type="secondary">各种文本编码、解码和格式转换工具</Text>
      </Card>

      <Card className="glass-card" title="转换设置">
        <Space size="large" style={{ width: '100%', marginBottom: 16 }}>
          <div>
            <Text strong>转换类型：</Text>
            <Select
              value={convertType}
              onChange={setConvertType}
              style={{ width: 200, marginLeft: 8 }}
            >
              <Option value="base64_encode">Base64 编码</Option>
              <Option value="base64_decode">Base64 解码</Option>
              <Divider style={{ margin: '4px 0' }} />
              <Option value="url_encode">URL 编码</Option>
              <Option value="url_decode">URL 解码</Option>
              <Divider style={{ margin: '4px 0' }} />
              <Option value="html_encode">HTML 编码</Option>
              <Option value="html_decode">HTML 解码</Option>
              <Divider style={{ margin: '4px 0' }} />
              <Option value="hex_encode">十六进制编码</Option>
              <Option value="hex_decode">十六进制解码</Option>
              <Divider style={{ margin: '4px 0' }} />
              <Option value="md5">MD5 哈希</Option>
              <Divider style={{ margin: '4px 0' }} />
              <Option value="uppercase">转大写</Option>
              <Option value="lowercase">转小写</Option>
              <Divider style={{ margin: '4px 0' }} />
              <Option value="json_format">JSON 格式化</Option>
              <Option value="json_minify">JSON 压缩</Option>
            </Select>
          </div>
        </Space>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>输入文本：</Text>
            </div>
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请输入要转换的文本..."
              rows={12}
              style={{ fontFamily: 'monospace' }}
            />
          </Col>
          
          <Col xs={24} lg={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>输出结果：</Text>
            </div>
            <TextArea
              value={outputText}
              readOnly
              placeholder="转换结果将显示在这里..."
              rows={12}
              style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5' }}
            />
          </Col>
        </Row>

        <Divider />

        <Space wrap>
          <Button 
            type="primary" 
            icon={<SwapOutlined />}
            onClick={handleConvert}
            size="large"
          >
            转换
          </Button>
          
          <Button 
            icon={<SwapOutlined rotate={90} />}
            onClick={handleSwap}
            size="large"
            title="交换输入输出内容"
          >
            交换
          </Button>
          
          <Button 
            icon={<CopyOutlined />}
            onClick={handleCopy}
            size="large"
          >
            复制结果
          </Button>
          
          <Button 
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            size="large"
          >
            下载结果
          </Button>
          
          <Button 
            icon={<ClearOutlined />}
            onClick={handleClear}
            size="large"
          >
            清空
          </Button>
        </Space>
      </Card>

      <Card className="glass-card" title="使用说明">
        <Space direction="vertical" size="small">
          <Text>• <Text strong>Base64:</Text> 常用于数据传输和存储的编码方式</Text>
          <Text>• <Text strong>URL 编码:</Text> 用于 URL 参数的安全传输</Text>
          <Text>• <Text strong>HTML 编码:</Text> 防止 XSS 攻击的字符转义</Text>
          <Text>• <Text strong>十六进制:</Text> 二进制数据的文本表示</Text>
          <Text>• <Text strong>JSON:</Text> 格式化或压缩 JSON 数据</Text>
        </Space>
      </Card>
    </div>
  );
};

export default TextConvertPage;