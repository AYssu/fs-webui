import React, { useState } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Form, 
  Select, 
  Table,
  Tag,

} from 'antd';
import {
  FilterOutlined,
  ClearOutlined,
  ExportOutlined,

} from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const BaseFilterPage: React.FC = () => {
  const [form] = Form.useForm();
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // 模拟原始数据
  const mockData = [
    {
      key: '1',
      ip: '192.168.1.1',
      hostname: 'router.local',
      ports: [80, 443, 22],
      services: ['HTTP', 'HTTPS', 'SSH'],
      os: 'Linux',
      status: 'online'
    },
    {
      key: '2',
      ip: '192.168.1.100',
      hostname: 'server.local',
      ports: [80, 3306, 22, 443],
      services: ['HTTP', 'MySQL', 'SSH', 'HTTPS'],
      os: 'Ubuntu',
      status: 'online'
    },
    {
      key: '3',
      ip: '192.168.1.200',
      hostname: 'workstation.local',
      ports: [135, 445, 3389],
      services: ['RPC', 'SMB', 'RDP'],
      os: 'Windows',
      status: 'online'
    }
  ];

  const columns = [
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      key: 'ip',
      sorter: (a: any, b: any) => a.ip.localeCompare(b.ip),
    },
    {
      title: '主机名',
      dataIndex: 'hostname',
      key: 'hostname',
    },
    {
      title: '开放端口',
      dataIndex: 'ports',
      key: 'ports',
      render: (ports: number[]) => (
        <Space wrap>
          {ports.map(port => (
            <Tag key={port} color="blue">{port}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '服务',
      dataIndex: 'services',
      key: 'services',
      render: (services: string[]) => (
        <Space wrap>
          {services.map(service => (
            <Tag key={service} color="green">{service}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作系统',
      dataIndex: 'os',
      key: 'os',
      render: (os: string) => (
        <Tag color={os === 'Windows' ? 'blue' : 'orange'}>{os}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'online' ? 'green' : 'red'}>
          {status === 'online' ? '在线' : '离线'}
        </Tag>
      ),
    }
  ];

  const onFinish = (values: any) => {
    console.log('过滤条件:', values);
    
    let filtered = [...mockData];

    // IP 地址过滤
    if (values.ipFilter) {
      filtered = filtered.filter(item => 
        item.ip.includes(values.ipFilter)
      );
    }

    // 端口过滤
    if (values.portFilter) {
      const ports = values.portFilter.split(',').map((p: string) => parseInt(p.trim()));
      filtered = filtered.filter(item => 
        ports.some((port: number) => item.ports.includes(port))
      );
    }

    // 服务过滤
    if (values.serviceFilter && values.serviceFilter.length > 0) {
      filtered = filtered.filter(item => 
        values.serviceFilter.some((service: string) => 
          item.services.includes(service)
        )
      );
    }

    // 操作系统过滤
    if (values.osFilter && values.osFilter.length > 0) {
      filtered = filtered.filter(item => 
        values.osFilter.includes(item.os)
      );
    }

    setFilteredData(filtered);
  };

  const onReset = () => {
    form.resetFields();
    setFilteredData([]);
  };

  const exportData = () => {
    const dataToExport = filteredData.length > 0 ? filteredData : mockData;
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filtered_results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      <Card className="glass-card" title="过滤条件">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              label="IP 地址过滤"
              name="ipFilter"
              style={{ minWidth: 200 }}
            >
              <Input placeholder="例如: 192.168.1" />
            </Form.Item>

            <Form.Item
              label="端口过滤"
              name="portFilter"
              style={{ minWidth: 200 }}
            >
              <Input placeholder="例如: 80,443,22" />
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%' }}>
            <Form.Item
              label="服务过滤"
              name="serviceFilter"
              style={{ minWidth: 200 }}
            >
              <Select
                mode="multiple"
                placeholder="选择服务类型"
                allowClear
              >
                <Option value="HTTP">HTTP</Option>
                <Option value="HTTPS">HTTPS</Option>
                <Option value="SSH">SSH</Option>
                <Option value="MySQL">MySQL</Option>
                <Option value="RPC">RPC</Option>
                <Option value="SMB">SMB</Option>
                <Option value="RDP">RDP</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="操作系统过滤"
              name="osFilter"
              style={{ minWidth: 200 }}
            >
              <Select
                mode="multiple"
                placeholder="选择操作系统"
                allowClear
              >
                <Option value="Linux">Linux</Option>
                <Option value="Windows">Windows</Option>
                <Option value="Ubuntu">Ubuntu</Option>
                <Option value="CentOS">CentOS</Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<FilterOutlined />}
                size="large"
              >
                应用过滤
              </Button>
              <Button 
                icon={<ClearOutlined />} 
                onClick={onReset}
                size="large"
              >
                清除过滤
              </Button>
              <Button 
                icon={<ExportOutlined />} 
                onClick={exportData}
                size="large"
              >
                导出结果
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card 
        className="glass-card" 
        title={`过滤结果 (${filteredData.length > 0 ? filteredData.length : mockData.length} 条记录)`}
      >
        <Table
          columns={columns}
          dataSource={filteredData.length > 0 ? filteredData : mockData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default BaseFilterPage;