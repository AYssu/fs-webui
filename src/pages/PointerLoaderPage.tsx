import { useState, useEffect } from 'react';
import { Card, Button, Select, InputNumber, Switch, message, Space, Typography, Divider, List, Tag, Input, Table } from 'antd';
import { FileTextOutlined, FilterOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

interface TextFile {
  index: number;
  filename: string;
  path: string;
  size: number;
  modifiedTime: string;
}

interface AddressResult {
  address: string;
  count: number;
  intValue: number;
  floatValue: string;
  rank: number;
}

export default function PointerLoaderPage() {
  const [files, setFiles] = useState<TextFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 加载配置
  const [loadMode, setLoadMode] = useState<'normal' | 'violent'>('normal');
  const [maxResults, setMaxResults] = useState<number>(0);
  const [levelFilter, setLevelFilter] = useState<number>(0);
  const [useCache, setUseCache] = useState<boolean>(true);
  const [processBits, setProcessBits] = useState<32 | 64>(64);
  const [customHead, setCustomHead] = useState<string>('');
  
  // 地址结果
  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [selectedAddresses, setSelectedAddresses] = useState<number[]>([]);
  const [filterResults, setFilterResults] = useState<number>(0);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await axios.get('/api/files/list?type=txt,db');
      setFiles(response.data.files);
    } catch (error) {
      message.error('加载文件列表失败');
    }
  };

  const handleLoadAll = async () => {
    if (!selectedFile) {
      message.warning('请先选择文件');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/loader/analyze', {
        filePath: files.find(f => f.index === selectedFile)?.path,
        mode: loadMode,
        useCache,
        processBits,
        customHead: customHead || null
      });

      setAddressResults(response.data.results);
      message.success(`分析完成，找到 ${response.data.results.length} 个地址`);
    } catch (error) {
      message.error('分析失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    if (selectedAddresses.length === 0) {
      message.warning('请先选择要过滤的地址');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/loader/filter', {
        filePath: files.find(f => f.index === selectedFile)?.path,
        addresses: selectedAddresses.map(rank => 
          addressResults.find(r => r.rank === rank)?.address
        ),
        mode: loadMode,
        maxResults,
        levelFilter,
        useCache,
        processBits,
        customHead: customHead || null
      });

      setFilterResults(response.data.count);
      message.success(`过滤完成，找到 ${response.data.count} 条指针链`);
    } catch (error) {
      message.error('过滤失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '序号',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <Tag color={selectedAddresses.includes(rank) ? 'blue' : 'default'}>
          {rank}
        </Tag>
      )
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: (addr: string) => <Text code>{addr}</Text>
    },
    {
      title: '出现次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: AddressResult, b: AddressResult) => a.count - b.count,
      render: (count: number) => <Tag color="green">{count}</Tag>
    },
    {
      title: '值[D]',
      dataIndex: 'intValue',
      key: 'intValue'
    },
    {
      title: '值[F]',
      dataIndex: 'floatValue',
      key: 'floatValue'
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card title="文件选择" style={{ marginBottom: '20px' }}>
        <List
          dataSource={files}
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
                <Text type="secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                <Text type="secondary">{file.modifiedTime}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      <Card title="加载配置" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text>载入方式:</Text>
            <Select
              value={loadMode}
              onChange={setLoadMode}
              style={{ width: '200px', marginLeft: '10px' }}
            >
              <Option value="normal">普通载入</Option>
              <Option value="violent">暴力载入</Option>
            </Select>
          </div>

          <div>
            <Text>过滤数量:</Text>
            <InputNumber
              value={maxResults}
              onChange={(val) => setMaxResults(val || 0)}
              min={0}
              placeholder="0=不限制"
              style={{ width: '200px', marginLeft: '10px' }}
            />
            <Text type="secondary" style={{ marginLeft: '10px' }}>
              (15级推荐50-4000)
            </Text>
          </div>

          <div>
            <Text>过滤层数:</Text>
            <InputNumber
              value={levelFilter}
              onChange={(val) => setLevelFilter(val || 0)}
              min={0}
              placeholder="0=不限制"
              style={{ width: '200px', marginLeft: '10px' }}
            />
          </div>

          <div>
            <Space>
              <Text>文本缓存:</Text>
              <Switch checked={useCache} onChange={setUseCache} />
              <Text type="secondary">(大文件推荐开启，小文件关闭更快)</Text>
            </Space>
          </div>

          <div>
            <Text>进程位数:</Text>
            <Select
              value={processBits}
              onChange={setProcessBits}
              style={{ width: '150px', marginLeft: '10px' }}
            >
              <Option value={32}>32位进程</Option>
              <Option value={64}>64位进程</Option>
            </Select>
          </div>

          <div>
            <Text>自定义头:</Text>
            <Input
              value={customHead}
              onChange={(e) => setCustomHead(e.target.value)}
              placeholder="0x12345678 (可选)"
              style={{ width: '300px', marginLeft: '10px' }}
            />
          </div>
        </Space>
      </Card>

      <Space style={{ marginBottom: '20px' }}>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleLoadAll}
          disabled={!selectedFile || loading}
          size="large"
        >
          全部数据加载
        </Button>
        <Button
          icon={<FilterOutlined />}
          onClick={handleFilter}
          disabled={!selectedFile || selectedAddresses.length === 0 || loading}
          size="large"
        >
          过滤选中地址
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={loadFiles}
          size="large"
        >
          刷新文件列表
        </Button>
      </Space>

      {addressResults.length > 0 && (
        <Card title={`地址分析结果 (共 ${addressResults.length} 条)`} style={{ marginBottom: '20px' }}>
          <Table
            dataSource={addressResults}
            columns={columns}
            rowKey="rank"
            pagination={{ pageSize: 20 }}
            rowSelection={{
              selectedRowKeys: selectedAddresses,
              onChange: (keys) => setSelectedAddresses(keys as number[])
            }}
            onRow={(record) => ({
              onClick: () => {
                if (selectedAddresses.includes(record.rank)) {
                  setSelectedAddresses(selectedAddresses.filter(r => r !== record.rank));
                } else {
                  setSelectedAddresses([...selectedAddresses, record.rank]);
                }
              }
            })}
          />
        </Card>
      )}

      {filterResults > 0 && (
        <Card>
          <Text strong>过滤结果: </Text>
          <Tag color="success">{filterResults} 条指针链</Tag>
          <Divider />
          <Text type="secondary">
            结果已保存到临时文件，可在文件列表中查看
          </Text>
        </Card>
      )}
    </div>
  );
}
