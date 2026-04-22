import React, { useEffect, useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Space, Tag } from 'antd';
import { CheckCircleOutlined, ExperimentOutlined, SaveOutlined } from '@ant-design/icons';
import { scanService, type RwPluginTestReport } from '../services/scanService';

const DEFAULT_RW_PLUGIN_PATH = '/data/local/tmp/libmemory.so';

const PluginPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [rwType, setRwType] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testReport, setTestReport] = useState<RwPluginTestReport | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const resp = await scanService.getConfig();
      if (resp.status === 'success') {
        const type = Number(resp.data?.rw_type ?? 1);
        setRwType(type);
        form.setFieldsValue({
          rw_plugin_path: resp.data?.rw_plugin_path || DEFAULT_RW_PLUGIN_PATH
        });
      }
    } catch (error) {
      message.error('加载插件配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSavePath = async () => {
    const path = String(form.getFieldValue('rw_plugin_path') || '').trim();
    setSaving(true);
    try {
      const resp = await scanService.saveRwPluginPath(path);
      if (resp.status === 'success') {
        message.success(resp.message || '插件路径保存成功');
      } else {
        message.error(resp.message || '插件路径保存失败');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || '插件路径保存失败';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    const path = String(form.getFieldValue('rw_plugin_path') || '').trim();
    if (!path) {
      message.warning('请先填写动态库路径');
      return;
    }
    setTesting(true);
    try {
      const resp = await scanService.testRwPlugin(path);
      if (resp.status === 'success') {
        setTestReport(resp.data || null);
        message.success(resp.message || '读写插件测试成功');
      } else {
        setTestReport(resp.data || null);
        message.error(resp.message || '读写插件测试失败');
      }
    } catch (error: any) {
      setTestReport(error?.response?.data?.data || null);
      const msg = error?.response?.data?.message || '读写插件测试失败';
      message.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const isKernelMode = rwType === 3;

  return (
    <div
      className="page-container search-page-wide"
      style={{
        width: '100%',
        maxWidth: 'none',
        margin: '0 auto'
      }}
    >
      <Card
        className="glass-card"
        title={
          <Space>
            <CheckCircleOutlined />
            <span>读写插件</span>
          </Space>
        }
        extra={
          <Button onClick={loadConfig}>
            刷新状态
          </Button>
        }
        loading={loading}
      >
        {!isKernelMode ? (
          <Alert
            type="info"
            showIcon
            message="当前未启用 KERNEL 动态拓展"
            description="当设置页中的读写模式切换为 KERNEL（拓展内存库）后，这里会显示读写插件配置。"
          />
        ) : (
          <>
            <Form form={form} layout="vertical">
              <Form.Item
                name="rw_plugin_path"
                label="动态库路径"
                rules={[{ required: true, message: '请输入动态库路径' }]}
              >
                <Input placeholder="例如：/data/local/tmp/libmemory.so" className="search-transparent-input" />
              </Form.Item>

              <Space>
                <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSavePath}>
                  保存路径
                </Button>
                <Button icon={<ExperimentOutlined />} loading={testing} onClick={handleTest}>
                  测试
                </Button>
              </Space>
            </Form>

            {testReport && (
              <Card
                style={{ marginTop: 16 }}
                type="inner"
                title="测试报告"
              >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div><strong>路径:</strong> {testReport.path}</div>
                  <div>
                    <strong>结果:</strong>{' '}
                    <Tag color={testReport.overall_success ? 'success' : 'error'}>
                      {testReport.overall_success ? '测试成功' : '测试失败'}
                    </Tag>
                  </div>
                  <div><strong>路径存在:</strong> {String(testReport.path_exists)}</div>
                  <div><strong>动态库加载:</strong> {String(testReport.load_success)}</div>
                  <div><strong>init_pid:</strong> {String(testReport.init_pid_success)}</div>
                  <div><strong>read:</strong> {String(testReport.read_success)}</div>
                  {typeof testReport.self_pid === 'number' && <div><strong>self pid:</strong> {testReport.self_pid}</div>}
                  {typeof testReport.test_address === 'number' && <div><strong>测试地址:</strong> 0x{testReport.test_address.toString(16)}</div>}
                  {typeof testReport.expected_value === 'number' && <div><strong>预期值:</strong> {testReport.expected_value}</div>}
                  {typeof testReport.actual_value === 'number' && <div><strong>读取值:</strong> {testReport.actual_value}</div>}
                  {typeof testReport.value_match === 'boolean' && <div><strong>值一致:</strong> {String(testReport.value_match)}</div>}
                  {testReport.error && (
                    <Alert
                      type="error"
                      showIcon
                      message="错误详情"
                      description={testReport.error}
                    />
                  )}
                </Space>
              </Card>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default PluginPage;
