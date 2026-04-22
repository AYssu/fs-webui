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
  message,
  Upload,
  List
} from 'antd';
import {
  SwapOutlined,
  CopyOutlined,
  ClearOutlined,
  DownloadOutlined,
  UploadOutlined,

  CodeOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ScriptConvertPage: React.FC = () => {
  const [inputScript, setInputScript] = useState('');
  const [outputScript, setOutputScript] = useState('');
  const [convertType, setConvertType] = useState('bash_to_powershell');
  const [scriptHistory, setScriptHistory] = useState<any[]>([]);

  const scriptTemplates = {
    bash_basic: `#!/bin/bash
# 基础 Bash 脚本模板
echo "Hello World"
read -p "请输入您的名字: " name
echo "你好, $name!"`,

    powershell_basic: `# 基础 PowerShell 脚本模板
Write-Host "Hello World"
$name = Read-Host "请输入您的名字"
Write-Host "你好, $name!"`,

    python_basic: `#!/usr/bin/env python3
# 基础 Python 脚本模板
print("Hello World")
name = input("请输入您的名字: ")
print(f"你好, {name}!")`,

    batch_basic: `@echo off
REM 基础批处理脚本模板
echo Hello World
set /p name=请输入您的名字: 
echo 你好, %name%!`
  };

  const convertFunctions = {
    bash_to_powershell: (script: string) => {
      return script
        .replace(/#!\/bin\/bash/g, '# PowerShell 脚本')
        .replace(/echo\s+"([^"]+)"/g, 'Write-Host "$1"')
        .replace(/echo\s+([^\s]+)/g, 'Write-Host $1')
        .replace(/read\s+-p\s+"([^"]+)"\s+(\w+)/g, '$$$2 = Read-Host "$1"')
        .replace(/\$(\w+)/g, '$$$1')
        .replace(/if\s+\[\s+(.+)\s+\]/g, 'if ($1)')
        .replace(/fi/g, '}')
        .replace(/then/g, '{');
    },

    powershell_to_bash: (script: string) => {
      return script
        .replace(/# PowerShell 脚本/g, '#!/bin/bash')
        .replace(/Write-Host\s+"([^"]+)"/g, 'echo "$1"')
        .replace(/Write-Host\s+([^\s]+)/g, 'echo $1')
        .replace(/\$(\w+)\s+=\s+Read-Host\s+"([^"]+)"/g, 'read -p "$2" $1')
        .replace(/\$\$(\w+)/g, '$$$1')
        .replace(/if\s+\((.+)\)/g, 'if [ $1 ]')
        .replace(/\{/g, 'then')
        .replace(/\}/g, 'fi');
    },

    bash_to_python: (script: string) => {
      return script
        .replace(/#!\/bin\/bash/g, '#!/usr/bin/env python3')
        .replace(/echo\s+"([^"]+)"/g, 'print("$1")')
        .replace(/echo\s+\$(\w+)/g, 'print($1)')
        .replace(/read\s+-p\s+"([^"]+)"\s+(\w+)/g, '$2 = input("$1")')
        .replace(/\$(\w+)/g, '$1')
        .replace(/if\s+\[\s+(.+)\s+\]/g, 'if $1:')
        .replace(/then/g, '')
        .replace(/fi/g, '');
    },

    python_to_bash: (script: string) => {
      return script
        .replace(/#!\/usr\/bin\/env python3/g, '#!/bin/bash')
        .replace(/print\("([^"]+)"\)/g, 'echo "$1"')
        .replace(/print\(([^)]+)\)/g, 'echo $$$1')
        .replace(/(\w+)\s+=\s+input\("([^"]+)"\)/g, 'read -p "$2" $1')
        .replace(/if\s+(.+):/g, 'if [ $1 ]')
        .replace(/^(\s+)/gm, '') // 移除缩进
        .replace(/if\s+\[/g, 'if [\nthen')
        .replace(/$/gm, '\nfi'); // 添加 fi
    },

    format_json: (script: string) => {
      try {
        const obj = JSON.parse(script);
        return JSON.stringify(obj, null, 2);
      } catch {
        return '格式化失败：无效的 JSON 格式';
      }
    },

    minify_json: (script: string) => {
      try {
        const obj = JSON.parse(script);
        return JSON.stringify(obj);
      } catch {
        return '压缩失败：无效的 JSON 格式';
      }
    }
  };

  const handleConvert = () => {
    if (!inputScript.trim()) {
      message.warning('请输入要转换的脚本');
      return;
    }

    const convertFunc = convertFunctions[convertType as keyof typeof convertFunctions];
    if (convertFunc) {
      const result = convertFunc(inputScript);
      setOutputScript(result);
      
      // 添加到历史记录
      const historyItem = {
        id: Date.now(),
        type: convertType,
        input: inputScript.substring(0, 100) + (inputScript.length > 100 ? '...' : ''),
        timestamp: new Date().toLocaleString()
      };
      setScriptHistory(prev => [historyItem, ...prev.slice(0, 9)]); // 保留最近10条
    }
  };

  const handleLoadTemplate = (template: string) => {
    setInputScript(scriptTemplates[template as keyof typeof scriptTemplates]);
  };

  const handleCopy = async () => {
    if (!outputScript) {
      message.warning('没有可复制的内容');
      return;
    }

    try {
      await navigator.clipboard.writeText(outputScript);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  const handleDownload = () => {
    if (!outputScript) {
      message.warning('没有可下载的内容');
      return;
    }

    const extension = convertType.includes('powershell') ? '.ps1' : 
                     convertType.includes('python') ? '.py' : 
                     convertType.includes('batch') ? '.bat' : '.sh';
    
    const blob = new Blob([outputScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_script_${Date.now()}${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('脚本下载成功');
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputScript(content);
      message.success('文件上传成功');
    };
    reader.readAsText(file);
    return false; // 阻止默认上传行为
  };

  return (
    <div className="page-container">
      <Card className="glass-card" title="转换设置">
        <Space size="large" style={{ width: '100%', marginBottom: 16 }} wrap>
          <div>
            <Text strong>转换类型：</Text>
            <Select
              value={convertType}
              onChange={setConvertType}
              style={{ width: 250, marginLeft: 8 }}
            >
              <Option value="bash_to_powershell">Bash → PowerShell</Option>
              <Option value="powershell_to_bash">PowerShell → Bash</Option>
              <Option value="bash_to_python">Bash → Python</Option>
              <Option value="python_to_bash">Python → Bash</Option>
              <Divider style={{ margin: '4px 0' }} />
              <Option value="format_json">JSON 格式化</Option>
              <Option value="minify_json">JSON 压缩</Option>
            </Select>
          </div>

          <div>
            <Text strong>快速模板：</Text>
            <Select
              placeholder="选择模板"
              style={{ width: 200, marginLeft: 8 }}
              onChange={handleLoadTemplate}
              allowClear
            >
              <Option value="bash_basic">Bash 基础模板</Option>
              <Option value="powershell_basic">PowerShell 基础模板</Option>
              <Option value="python_basic">Python 基础模板</Option>
              <Option value="batch_basic">批处理基础模板</Option>
            </Select>
          </div>

          <Upload
            beforeUpload={handleFileUpload}
            showUploadList={false}
            accept=".sh,.ps1,.py,.bat,.txt"
          >
            <Button icon={<UploadOutlined />}>
              上传脚本文件
            </Button>
          </Upload>
        </Space>

        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>输入脚本：</Text>
            </div>
            <TextArea
              value={inputScript}
              onChange={(e) => setInputScript(e.target.value)}
              placeholder="请输入要转换的脚本代码..."
              rows={15}
              style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '13px' }}
            />
          </Col>
          
          <Col xs={24} lg={12}>
            <div style={{ marginBottom: 16 }}>
              <Text strong>转换结果：</Text>
            </div>
            <TextArea
              value={outputScript}
              readOnly
              placeholder="转换结果将显示在这里..."
              rows={15}
              style={{ 
                fontFamily: 'Consolas, Monaco, monospace', 
                fontSize: '13px',
                backgroundColor: '#f5f5f5' 
              }}
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
            转换脚本
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
            下载脚本
          </Button>
          
          <Button 
            icon={<ClearOutlined />}
            onClick={() => {
              setInputScript('');
              setOutputScript('');
            }}
            size="large"
          >
            清空
          </Button>
        </Space>
      </Card>

      {scriptHistory.length > 0 && (
        <Card className="glass-card" title="转换历史">
          <List
            dataSource={scriptHistory}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    size="small" 
                    onClick={() => setInputScript(item.input)}
                  >
                    重新加载
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<CodeOutlined />}
                  title={`${item.type} - ${item.timestamp}`}
                  description={item.input}
                />
              </List.Item>
            )}
            size="small"
          />
        </Card>
      )}

      <Card className="glass-card" title="转换说明">
        <Space direction="vertical" size="small">
          <Text>• <Text strong>Bash ↔ PowerShell:</Text> 基础命令和语法转换</Text>
          <Text>• <Text strong>Bash ↔ Python:</Text> 简单脚本逻辑转换</Text>
          <Text>• <Text strong>JSON 处理:</Text> 格式化和压缩 JSON 数据</Text>
          <Text>• <Text strong>注意:</Text> 转换结果可能需要手动调整以确保完全兼容</Text>
          <Text>• <Text strong>建议:</Text> 转换后请测试脚本的功能性和语法正确性</Text>
        </Space>
      </Card>
    </div>
  );
};

export default ScriptConvertPage;