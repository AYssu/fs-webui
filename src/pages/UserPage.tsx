import React, { useState } from 'react';
import { 
  Card, 
  Avatar, 
  Typography, 
  Space, 
  Button, 
  Form, 
  Input, 
  Upload, 
  message,

  Row,
  Col,
  Statistic,
  List,
  Tag,
  Switch
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CameraOutlined,
  MailOutlined,

  EnvironmentOutlined,
  CalendarOutlined,
  TrophyOutlined,
  SettingOutlined,
  BellOutlined,
  SecurityScanOutlined,
  LogoutOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const UserPage: React.FC = () => {
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [userInfo, setUserInfo] = useState({
    name: 'FastScan 用户',
    email: 'user@fastscan.com',
    phone: '+86 138****8888',
    location: '北京, 中国',
    joinDate: '2024-01-15',
    avatar: '',
    bio: '网络安全爱好者，专注于渗透测试和漏洞挖掘。',
    totalScans: 156,
    successfulScans: 142,
    vulnerabilitiesFound: 89,
    lastScanDate: '2024-03-15'
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReport: true,
    securityAlerts: true,
    autoBackup: true
  });

  const handleSave = async (values: any) => {
    try {
      console.log('保存用户信息:', values);
      setUserInfo({ ...userInfo, ...values });
      setEditing(false);
      message.success('用户信息保存成功');
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleAvatarUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUserInfo({ ...userInfo, avatar: result });
      message.success('头像上传成功');
    };
    reader.readAsDataURL(file);
    return false;
  };

  const recentActivities = [
    {
      id: 1,
      type: 'scan',
      title: '完成端口扫描',
      description: '扫描了 192.168.1.0/24 网段',
      time: '2小时前',
      status: 'success'
    },
    {
      id: 2,
      type: 'vulnerability',
      title: '发现安全漏洞',
      description: '在目标服务器发现 SQL 注入漏洞',
      time: '1天前',
      status: 'warning'
    },
    {
      id: 3,
      type: 'report',
      title: '生成扫描报告',
      description: '导出了详细的漏洞评估报告',
      time: '3天前',
      status: 'info'
    },
    {
      id: 4,
      type: 'config',
      title: '更新配置',
      description: '修改了扫描参数配置',
      time: '1周前',
      status: 'default'
    }
  ];

  const achievements = [
    { name: '初级扫描师', description: '完成首次扫描', icon: '🎯', earned: true },
    { name: '漏洞猎手', description: '发现10个漏洞', icon: '🔍', earned: true },
    { name: '扫描专家', description: '完成100次扫描', icon: '🏆', earned: true },
    { name: '安全大师', description: '发现50个高危漏洞', icon: '🛡️', earned: false },
    { name: '效率之王', description: '单日完成20次扫描', icon: '⚡', earned: false }
  ];

  return (
    <div className="page-container">
      {/* 用户信息卡片 */}
      <Card className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', marginRight: 24 }}>
            <Avatar 
              size={80} 
              src={userInfo.avatar} 
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
            <Upload
              beforeUpload={handleAvatarUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button
                type="primary"
                shape="circle"
                size="small"
                icon={<CameraOutlined />}
                style={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  zIndex: 1
                }}
              />
            </Upload>
          </div>
          
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0, color: 'rgba(255,255,255,0.9)' }}>
              {userInfo.name}
            </Title>
            <Space direction="vertical" size="small">
              <Text type="secondary">
                <MailOutlined /> {userInfo.email}
              </Text>
              <Text type="secondary">
                <EnvironmentOutlined /> {userInfo.location}
              </Text>
              <Text type="secondary">
                <CalendarOutlined /> 加入时间: {userInfo.joinDate}
              </Text>
            </Space>
          </div>
          
          <Button
            type="primary"
            icon={editing ? <SaveOutlined /> : <EditOutlined />}
            onClick={() => {
              if (editing) {
                form.submit();
              } else {
                setEditing(true);
                form.setFieldsValue(userInfo);
              }
            }}
          >
            {editing ? '保存' : '编辑'}
          </Button>
        </div>

        {editing ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={userInfo}
          >
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="姓名" name="name">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="邮箱" name="email">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="电话" name="phone">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="位置" name="location">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="个人简介" name="bio">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        ) : (
          <Paragraph style={{ color: 'rgba(255,255,255,0.8)' }}>
            {userInfo.bio}
          </Paragraph>
        )}
      </Card>

      {/* 统计数据 */}
      <Card className="glass-card" title="使用统计">
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Statistic
              title="总扫描次数"
              value={userInfo.totalScans}
              prefix={<SecurityScanOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="成功扫描"
              value={userInfo.successfulScans}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="发现漏洞"
              value={userInfo.vulnerabilitiesFound}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="成功率"
              value={((userInfo.successfulScans / userInfo.totalScans) * 100).toFixed(1)}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>

      {/* 成就系统 */}
      <Card className="glass-card" title="成就徽章">
        <Row gutter={[16, 16]}>
          {achievements.map((achievement, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                size="small"
                className={`achievement-card ${achievement.earned ? 'earned' : 'locked'}`}
                style={{
                  background: achievement.earned 
                    ? 'linear-gradient(135deg, #52c41a, #389e0d)' 
                    : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  opacity: achievement.earned ? 1 : 0.6
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>
                    {achievement.icon}
                  </div>
                  <Title level={5} style={{ margin: 0, color: 'white' }}>
                    {achievement.name}
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                    {achievement.description}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 最近活动 */}
      <Card className="glass-card" title="最近活动">
        <List
          dataSource={recentActivities}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {item.title}
                    </span>
                    <Tag color={
                      item.status === 'success' ? 'green' :
                      item.status === 'warning' ? 'orange' :
                      item.status === 'info' ? 'blue' : 'default'
                    }>
                      {item.type.toUpperCase()}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {item.description}
                    </Text>
                    <br />
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                      {item.time}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 通知设置 */}
      <Card className="glass-card" title="通知设置">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong style={{ color: 'rgba(255,255,255,0.9)' }}>邮件通知</Text>
              <br />
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                接收扫描结果和系统通知邮件
              </Text>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onChange={(checked) => 
                setPreferences({...preferences, emailNotifications: checked})
              }
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong style={{ color: 'rgba(255,255,255,0.9)' }}>推送通知</Text>
              <br />
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                浏览器推送通知
              </Text>
            </div>
            <Switch
              checked={preferences.pushNotifications}
              onChange={(checked) => 
                setPreferences({...preferences, pushNotifications: checked})
              }
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong style={{ color: 'rgba(255,255,255,0.9)' }}>周报</Text>
              <br />
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                每周发送使用统计报告
              </Text>
            </div>
            <Switch
              checked={preferences.weeklyReport}
              onChange={(checked) => 
                setPreferences({...preferences, weeklyReport: checked})
              }
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong style={{ color: 'rgba(255,255,255,0.9)' }}>安全警报</Text>
              <br />
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                发现高危漏洞时立即通知
              </Text>
            </div>
            <Switch
              checked={preferences.securityAlerts}
              onChange={(checked) => 
                setPreferences({...preferences, securityAlerts: checked})
              }
            />
          </div>
        </Space>
      </Card>

      {/* 账户操作 */}
      <Card className="glass-card" title="账户操作">
        <Space size="large" wrap>
          <Button icon={<SettingOutlined />} size="large">
            账户设置
          </Button>
          <Button icon={<SecurityScanOutlined />} size="large">
            安全设置
          </Button>
          <Button danger icon={<LogoutOutlined />} size="large">
            退出登录
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default UserPage;