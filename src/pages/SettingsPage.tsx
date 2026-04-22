import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  Typography, 

  Row,
  Col,
  Alert,
  List,
  Tag,
  Spin,
  Modal,
  App,
  Select
} from 'antd';
import {
  AppstoreOutlined,
  SyncOutlined,
  SearchOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { getServerUrl, setServerUrl } from '../utils/config';
import { scanService } from '../services/scanService';

const { Text } = Typography;

const SettingsPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [processes, setProcesses] = useState<any[]>([]);
  const [filteredProcesses, setFilteredProcesses] = useState<any[]>([]);
  const [processLoading, setProcessLoading] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [processSearchText, setProcessSearchText] = useState('');
  const [selectedMemoryTypes, setSelectedMemoryTypes] = useState<string[]>([]);
  const [serverUrl, setServerUrlState] = useState(getServerUrl());
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);
  const [rwType, setRwType] = useState<number>(1); // 默认 SYSCALL

  const memoryTypes = [
    { key: 'PPSSPP', label: '01.PPSSPP', color: '#1668dc' },
    { key: 'Anonymous', label: '02.Anonymous', color: '#389e0d' },
    { key: 'Ashmem', label: '03.Ashmem', color: '#d48806' },
    { key: 'Code_app', label: '04.Code_app', color: '#08979c' },
    { key: 'Stack', label: '05.Stack', color: '#c41d7f' },
    { key: 'C_bss', label: '06.C_bss', color: '#531dab' },
    { key: 'Code_system', label: '07.Code_system', color: '#cf1322' },
    { key: 'C_data', label: '08.C_data', color: '#d4380d' },
    { key: 'C_heap', label: '09.C_heap', color: '#d4b106' },
    { key: 'Java', label: '10.Java', color: '#7cb305' },
    { key: 'Java_heap', label: '11.Java_heap', color: '#389e0d' },
    { key: 'Other', label: '12.Other', color: '#1668dc' },
    { key: 'Video', label: '13.Video', color: '#531dab' },
    { key: 'C_alloc', label: '14.C_alloc', color: '#c41d7f' },
    { key: 'All', label: '15.All', color: '#cf1322' },
    { key: 'Bad', label: '16.Bad', color: '#595959' }
  ];

  const handleMemoryTypeToggle = async (key: string) => {
    const newSelected = selectedMemoryTypes.includes(key)
      ? selectedMemoryTypes.filter(item => item !== key)
      : [...selectedMemoryTypes, key];
    
    try {
      // 构建内存配置对象
      const memoryConfig: any = {};
      memoryTypes.forEach(type => {
        memoryConfig[type.key] = newSelected.includes(type.key);
      });
      
      // 保存到后端
      const data = await scanService.saveMemoryConfig(memoryConfig);
      
      if (data.status === 'success') {
        // 成功后更新状态
        setSelectedMemoryTypes(newSelected);
        
        // 更新表单值
        const memoryValues: any = {};
        memoryTypes.forEach(type => {
          memoryValues[type.key] = newSelected.includes(type.key);
        });
        form.setFieldsValue(memoryValues);
      } else {
        message.error('保存内存配置失败: ' + (data.message || '未知错误'));
      }
    } catch (error) {
      message.error('保存内存配置失败');
      console.error('Save memory config error:', error);
    }
  };

  // 测试服务端连接
  const testConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      await scanService.healthCheck();
      setConnectionStatus('success');
      message.success('连接成功');
    } catch (error) {
      setConnectionStatus('error');
      message.error('连接失败，请检查服务端地址');
    } finally {
      setTestingConnection(false);
    }
  };

  // 保存服务端地址
  const saveServerUrl = () => {
    if (!serverUrl.trim()) {
      message.error('请输入服务端地址');
      return;
    }
    
    // 验证 URL 格式
    try {
      new URL(serverUrl);
    } catch {
      message.error('请输入有效的 URL 地址');
      return;
    }
    
    setServerUrl(serverUrl);
    setConnectionStatus(null);
    message.success('服务端地址已保存');
  };

  // 批量保存内存配置
  const saveBatchMemoryConfig = async (keys: string[]) => {
    try {
      const memoryConfig: any = {};
      memoryTypes.forEach(type => {
        memoryConfig[type.key] = keys.includes(type.key);
      });
      
      const data = await scanService.saveMemoryConfig(memoryConfig);
      
      if (data.status === 'success') {
        setSelectedMemoryTypes(keys);
        const values: any = {};
        memoryTypes.forEach(type => {
          values[type.key] = keys.includes(type.key);
        });
        form.setFieldsValue(values);
      } else {
        message.error('保存内存配置失败: ' + (data.message || '未知错误'));
      }
    } catch (error) {
      message.error('保存内存配置失败');
      console.error('Save memory config error:', error);
    }
  };

  // 保存读写模式
  const saveRwType = async (type: number) => {
    try {
      const data = await scanService.saveRwType(type);
      if (data.status === 'success') {
        setRwType(type);
        message.success('读写模式保存成功');
        console.log('读写模式已保存:', type);
      } else {
        message.error('保存读写模式失败: ' + (data.message || '未知错误'));
      }
    } catch (error) {
      message.error('保存读写模式失败');
      console.error('Save rw type error:', error);
    }
  };

  // 通过包名获取软件名称
  const getAppNameByPackage = async (packageName: string) => {
    try {
      const data = await scanService.getPackageInfo(packageName);
      if (data.status === 'success') {
        return data.data.app_name || packageName;
      }
    } catch (error) {
      console.error('Get app name error:', error);
    }
    return packageName;
  };

  // 通过包名获取PID
  const getPidByPackage = async (packageName: string) => {
    try {
      const data = await scanService.getPackagePid(packageName);
      if (data.status === 'success') {
        return data.data.pid || 'N/A';
      }
    } catch (error) {
      console.error('Get PID error:', error);
    }
    return 'N/A';
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await scanService.getConfig();
      if (data.status === 'success') {
        form.setFieldsValue({
          ...data.data,
          // 添加一些默认的前端设置
          theme: 'dark',
          language: 'zh-CN',
          autoSave: true,
          notifications: true,
          maxLogLines: 1000,
          refreshInterval: 5000
        });
        
        // 加载读写模式
        if (data.data.rw_type) {
          setRwType(data.data.rw_type);
        }
        
        // 加载内存配置
        const memorySelected: string[] = [];
        memoryTypes.forEach(type => {
          if (data.data[type.key] === true) {
            memorySelected.push(type.key);
          }
        });
        setSelectedMemoryTypes(memorySelected);
        
        // 如果有已保存的包名，获取对应的软件名称和PID
        if (data.data.package_name) {
          const appName = await getAppNameByPackage(data.data.package_name);
          const pid = await getPidByPackage(data.data.package_name);
          
          setSelectedProcess({
            name: appName, // 软件名称
            package: data.data.package_name, // 包名
            pid: pid, // PID
            saved: true // 标记为已保存的配置
          });
        }
      }
    } catch (error) {
      message.error('加载配置失败');
      console.error('Load config error:', error);
    }
  };

  const loadProcesses = async () => {
    setProcessLoading(true);
    try {
      const data = await scanService.getProcesses();
      if (data.status === 'success') {
        setProcesses(data.data);
        setFilteredProcesses(data.data);
        message.success(`获取到 ${data.data.length} 个进程`);
      }
    } catch (error) {
      message.error('获取进程列表失败');
      console.error('Load processes error:', error);
    } finally {
      setProcessLoading(false);
    }
  };

  // 过滤进程列表
  const filterProcesses = (searchText: string) => {
    setProcessSearchText(searchText);
    if (!searchText.trim()) {
      setFilteredProcesses(processes);
    } else {
      const filtered = processes.filter(process => 
        process.name.toLowerCase().includes(searchText.toLowerCase()) ||
        process.package.toLowerCase().includes(searchText.toLowerCase()) ||
        process.pid.toString().includes(searchText)
      );
      setFilteredProcesses(filtered);
    }
  };

  const selectProcess = async (process: any) => {
    try {
      const data = await scanService.selectProcess({
        pid: process.pid,
        name: process.name,
        package: process.package
      });
      
      if (data.status === 'success') {
        setSelectedProcess(process);
        // 更新表单中的 package_name 和 app_name 字段
        form.setFieldsValue({
          package_name: process.package,
          app_name: process.name
        });
        
        message.success(`已选择进程: ${process.name}`);
        // 关闭弹窗
        setProcessModalVisible(false);
      }
    } catch (error) {
      message.error('选择进程失败');
      console.error('Select process error:', error);
    }
  };

  const openProcessModal = () => {
    setProcessModalVisible(true);
    setProcessSearchText('');
    // 打开弹窗时自动刷新进程列表
    loadProcesses();
  };

  return (
    <div
      className="page-container search-page-wide"
      style={{
        width: '100%',
        maxWidth: 'none',
        margin: '0 auto'
      }}
    >
      {/* 服务端配置 */}
      <Card className="glass-card" title={<Space><ApiOutlined />服务端配置</Space>}>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.Item label="服务端地址">
              <Input
                value={serverUrl}
                onChange={(e) => setServerUrlState(e.target.value)}
                placeholder="http://localhost:8080"
                prefix={<ApiOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />}
                suffix={
                  connectionStatus === 'success' ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : connectionStatus === 'error' ? (
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  ) : null
                }
                

              
                className="search-transparent-input"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item label=" " colon={false}>
              <Space>
                <Button
                  type="primary"
                  onClick={saveServerUrl}
                  disabled={serverUrl === getServerUrl()}
                >
                  保存
                </Button>
                <Button
                  onClick={testConnection}
                  loading={testingConnection}
                  icon={<SyncOutlined />}
                >
                  测试连接
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
        <Alert
          message="提示"
          description="修改服务端地址后，请点击测试连接验证是否可以正常访问。"
          type="info"
          showIcon
          style={{ marginTop: 8 }}
        />
      </Card>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          theme: 'dark',
          language: 'zh-CN',
          autoSave: true,
          notifications: true,
          maxLogLines: 1000,
          refreshInterval: 5000
        }}
      >
        {/* 基础配置 */}
        <Card className="glass-card" title="目标进程配置">
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Form.Item
                label="目标进程"
                name="package_name"
                rules={[{ required: true, message: '请选择目标进程' }]}
              >
                <Input 
                  className="target-process-input"
                  placeholder="请点击选择进程按钮选择目标进程" 
                  disabled 
                  value={selectedProcess ? selectedProcess.package : ''}
                  style={{ 
                    backgroundColor: 'transparent',
                    border: 'none',
                    boxShadow: 'none'
                  }}
                  suffix={
                    <Tag 
                      color={selectedProcess ? "green" : "default"} 
                      style={{ 
                        margin: 0,
                        opacity: selectedProcess ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      {selectedProcess 
                        ? `${selectedProcess.name}${selectedProcess.pid !== 'N/A' ? ` (${selectedProcess.pid})` : ''}` 
                        : '未选择'
                      }
                    </Tag>
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label=" " colon={false}>
                <Button 
                  type="primary"
                  icon={<AppstoreOutlined />}
                  onClick={openProcessModal}
                  size="large"
                  block
                >
                  选择进程
                </Button>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col xs={24}>
              <Form.Item
                label="读写模式"
                tooltip="选择内存读写方式"
              >
                <Select
                  value={rwType}
                  onChange={saveRwType}
                  style={{ width: '100%' }}
                  options={[
                    { value: 1, label: 'SYSCALL (默认系统调用)' },
                    { value: 2, label: 'PREAD64 (模拟器专用)' },
                    { value: 3, label: 'KERNEL (拓展内存库)' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col xs={24}>
              <Form.Item
                label="内存范围选择"
                tooltip="选择要扫描的内存区域类型，点击标签进行选择/取消"
              >
                <div style={{ 
                  background: 'rgba(30, 41, 59, 0.4)', 
                  padding: '20px', 
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.15)'
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <Space wrap size={[8, 8]}>
                      {memoryTypes.map(type => (
                        <Tag
                          key={type.key}
                          color={selectedMemoryTypes.includes(type.key) ? type.color : undefined}
                          style={{
                            cursor: 'pointer',
                            padding: '4px 12px',
                            fontSize: '13px',
                            borderRadius: '6px',
                            border: selectedMemoryTypes.includes(type.key) 
                              ? `1px solid ${type.color}` 
                              : '1px solid rgba(255, 255, 255, 0.3)',
                            background: selectedMemoryTypes.includes(type.key) 
                              ? `${type.color}80` // 添加99表示60%透明度
                              : 'rgba(255, 255, 255, 0.1)',
                            color: selectedMemoryTypes.includes(type.key) 
                              ? '#fff' 
                              : 'rgba(255, 255, 255, 0.7)',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => handleMemoryTypeToggle(type.key)}
                        >
                          {type.label}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                  
                  <div style={{ 
                    paddingTop: 16, 
                    borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div>
                      <Space size="small">
                        <Button 
                          size="small" 
                          type="link"
                          style={{ padding: '0 8px', color: 'rgba(255, 255, 255, 0.8)' }}
                          onClick={() => {
                            const allKeys = memoryTypes.map(t => t.key);
                            saveBatchMemoryConfig(allKeys);
                          }}
                        >
                          全选
                        </Button>
                        <Button 
                          size="small" 
                          type="link"
                          style={{ padding: '0 8px', color: 'rgba(255, 255, 255, 0.8)' }}
                          onClick={() => saveBatchMemoryConfig([])}
                        >
                          清空
                        </Button>
                        <Button 
                          size="small" 
                          type="link"
                          style={{ padding: '0 8px', color: 'rgba(255, 255, 255, 0.8)' }}
                          onClick={() => {
                            const recommended = ['Anonymous', 'Code_app', 'Stack', 'C_data', 'C_heap', 'Java', 'Java_heap', 'C_alloc'];
                            saveBatchMemoryConfig(recommended);
                          }}
                        >
                          推荐
                        </Button>
                      </Space>
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                      已选择 {selectedMemoryTypes.length} / {memoryTypes.length} 项
                    </div>
                  </div>
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* 进程选择弹窗 */}
        <Modal
          title={
            <Space>
              <AppstoreOutlined />
              <span>选择目标进程</span>
            </Space>
          }
          open={processModalVisible}
          onCancel={() => setProcessModalVisible(false)}
          footer={[
            <Button key="refresh" icon={<SyncOutlined />} onClick={loadProcesses} loading={processLoading}>
              刷新进程
            </Button>,
            <Button key="cancel" onClick={() => setProcessModalVisible(false)}>
              取消
            </Button>
          ]}
          width={600}
          className="process-modal"
        >
          {processLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16, color: 'rgba(0, 0, 0, 0.65)' }}>
                正在获取进程列表...
              </div>
            </div>
          ) : (
            <>
              {/* 搜索过滤 */}
              <div style={{ marginBottom: 16 }}>
                <Input
                  placeholder="搜索进程名称、软件名称、PID..."
                  value={processSearchText}
                  onChange={(e) => filterProcesses(e.target.value)}
                  style={{
                    backgroundColor: 'transparent !important',
                    border: 'none !important',
                    boxShadow: 'none !important',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                   className="search-transparent-input"
                  prefix={<SearchOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />}
                />
              </div>

              <List
                dataSource={filteredProcesses}
                renderItem={(process) => (
                  <List.Item
                    className={`process-item ${selectedProcess?.package === process.package ? 'selected' : ''}`}
                    onClick={() => selectProcess(process)}
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space>
                            <span style={{ fontSize: '16px', fontWeight: 600 }}>
                              {process.name}
                            </span>
                            {selectedProcess?.package === process.package && (
                              <Tag color="green">已选择</Tag>
                            )}
                          </Space>
                          <Tag color="blue" style={{ fontSize: '11px' }}>
                            PID: {process.pid}
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ marginTop: '8px' }}>
                          <Text style={{ fontSize: '13px', color: 'rgba(248, 250, 252, 0.75)' }}>
                            {process.package}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                size="small"
              />
              
              {filteredProcesses.length === 0 && !processLoading && processSearchText && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  未找到匹配的进程
                </div>
              )}
              
              {processes.length === 0 && !processLoading && !processSearchText && (
                <Alert
                  message="未找到进程"
                  description="请点击刷新按钮重新获取进程列表"
                  type="info"
                  showIcon
                />
              )}
            </>
          )}
        </Modal>
      </Form>

      <Alert
        title="配置说明"
        description="修改配置后需要重启服务才能生效。建议在修改前先导出当前配置作为备份。"
        type="info"
        showIcon
        className="glass-card"
      />
    </div>
  );
};

export default SettingsPage;