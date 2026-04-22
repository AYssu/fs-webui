import React, { useEffect, useMemo, useState } from 'react';
import { App, Avatar, Badge, Button, Card, Checkbox, Dropdown, Form, Input, Modal, Space, Tag, Typography } from 'antd';
import { ClockCircleOutlined, LoginOutlined, LogoutOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { getAuthConfig, saveAuthConfig } from '../utils/authStorage';
import { scanService, type UserAuthConfigData, type WsAuthStatusData } from '../services/scanService';
import { decryptText, encryptText } from '../utils/authCrypto';

const { Text } = Typography;

const formatOnlineDuration = (seconds: number): string => {
  const total = Math.max(0, seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

interface UserAccountMenuProps {
  compact?: boolean;
}

const UserAccountMenu: React.FC<UserAccountMenuProps> = ({ compact = false }) => {
  const { message } = App.useApp();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [form] = Form.useForm();
  const [auth, setAuth] = useState(getAuthConfig());
  const [wsConnected, setWsConnected] = useState<boolean>(true);
  const [wsRetrying, setWsRetrying] = useState<boolean>(false);
  const [wsLastReasonZh, setWsLastReasonZh] = useState<string>('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [hasSavedCredential, setHasSavedCredential] = useState(false);
  const [encryptedAuthConfig, setEncryptedAuthConfig] = useState<UserAuthConfigData>({
    remember_password: false,
    auto_login: false,
    encrypted_account: '',
    encrypted_password: '',
    has_saved_credentials: false
  });

  const avatarText = useMemo(() => {
    const source = auth.account?.trim() || '?';
    return source[0].toUpperCase();
  }, [auth.account]);

  const applyOnlineInfoFromStatus = (status?: WsAuthStatusData) => {
    if (!status) {
      return;
    }
    setWsConnected(Boolean(status.connected));
    setWsRetrying(Boolean(status.retrying));
    setWsLastReasonZh(String(status.reason_zh || ''));
    const next = saveAuthConfig({
      loginCount: Number.isFinite(status.login_count) ? Number(status.login_count) : getAuthConfig().loginCount,
      totalOnlineSeconds: Number.isFinite(status.online_seconds) ? Number(status.online_seconds) : getAuthConfig().totalOnlineSeconds,
      expiresAt: status.member_expires_at || getAuthConfig().expiresAt
    });
    setAuth(next);
  };

  useEffect(() => {
    const loadUserAuthConfig = async () => {
      try {
        const [cfgResp, statusResp] = await Promise.all([
          scanService.getUserAuthConfig(),
          scanService.getWsAuthStatus()
        ]);
        const serverConnected = Boolean(statusResp.status === 'success' && statusResp.data?.connected);
        if (statusResp.status === 'success') {
          applyOnlineInfoFromStatus(statusResp.data);
        }

        // 以后端连接状态为准：后端未连接时，前端必须显示未登录
        if (!serverConnected && auth.isLoggedIn) {
          const next = saveAuthConfig({
            isLoggedIn: false,
            account: '',
            email: '',
            expiresAt: '',
            lastLoginAt: ''
          });
          setAuth(next);
        }

        if (cfgResp.status === 'success' && cfgResp.data) {
          const cfg = cfgResp.data;
          setEncryptedAuthConfig(cfg);
          setRememberPassword(cfg.remember_password);
          setHasSavedCredential(cfg.has_saved_credentials);

          if (serverConnected && !auth.isLoggedIn) {
            const account = cfg.has_saved_credentials ? await decryptText(cfg.encrypted_account) : '';
            const now = new Date();
            const next = saveAuthConfig({
              isLoggedIn: true,
              account: account || auth.account || '已登录用户',
              email: account || auth.email || '',
              expiresAt: statusResp.data?.member_expires_at || auth.expiresAt || '',
              loginCount: Number.isFinite(statusResp.data?.login_count) ? Number(statusResp.data?.login_count) : auth.loginCount,
              totalOnlineSeconds: Number.isFinite(statusResp.data?.online_seconds) ? Number(statusResp.data?.online_seconds) : auth.totalOnlineSeconds,
              lastLoginAt: now.toISOString()
            });
            setAuth(next);
            return;
          }

          if (cfg.auto_login && cfg.has_saved_credentials && !serverConnected && !auth.isLoggedIn) {
            const account = await decryptText(cfg.encrypted_account);
            const password = await decryptText(cfg.encrypted_password);
            if (account && password) {
              const loginResp = await scanService.login({ username: account, password });
              if (loginResp.status === 'success' && loginResp.data?.connected) {
                const now = new Date();
                const expiresAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();
                const next = saveAuthConfig({
                  isLoggedIn: true,
                  account,
                  email: account,
                  expiresAt,
                  loginCount: auth.loginCount + 1,
                  lastLoginAt: now.toISOString()
                });
                setAuth(next);
              }
            }
          }
        }
      } catch (error) {
        console.error('加载用户登录配置失败:', error);
      }
    };
    loadUserAuthConfig();
  }, []);

  // 背景轮询 ws-status：用于掉线提示（如被挤下线）与重连状态展示
  useEffect(() => {
    if (!auth.isLoggedIn) {
      setWsConnected(true);
      setWsRetrying(false);
      setWsLastReasonZh('');
      return;
    }

    let lastNotifiedKey = '';
    let lastRetryNotified = false;

    const tick = async () => {
      try {
        const statusResp = await scanService.getWsAuthStatus();
        if (statusResp.status !== 'success') return;
        const st = statusResp.data;
        applyOnlineInfoFromStatus(st);

        if (st.connected) {
          lastRetryNotified = false;
          return;
        }

        // 断线时先关掉展开层，避免用户继续操作
        setDropdownOpen(false);
        setUserModalOpen(false);

        const reasonZh = String(st.reason_zh || '');
        const reason = String(st.reason || '');
        const lastError = String(st.last_error || '');
        const nonRetryable = Boolean(st.non_retryable);
        const retrying = Boolean(st.retrying);

        if (nonRetryable) {
          const msg = reasonZh || lastError || '连接已断开';
          const key = `${reasonZh}__${reason}__${lastError}`;
          if (key && key !== lastNotifiedKey) {
            lastNotifiedKey = key;
            message.error(msg);
          }

          // 不可重试：强制置为未登录，要求重新登录/检查账号状态
          const next = saveAuthConfig({
            isLoggedIn: false,
            account: '',
            email: '',
            expiresAt: '',
            lastLoginAt: ''
          });
          setAuth(next);
          return;
        }

        // 可重试：提示“正在自动重连”，但不强制登出
        if (retrying && !lastRetryNotified) {
          lastRetryNotified = true;
          message.warning(`连接断开，正在自动重连...${reasonZh ? `（${reasonZh}）` : ''}`);
        }
      } catch {
        // ignore
      }
    };

    tick();
    const timer = window.setInterval(tick, 3000);
    return () => window.clearInterval(timer);
  }, [auth.isLoggedIn]);

  useEffect(() => {
    if (!auth.isLoggedIn) return;
    const timer = window.setInterval(() => {
      const next = saveAuthConfig({ totalOnlineSeconds: getAuthConfig().totalOnlineSeconds + 1 });
      setAuth(next);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [auth.isLoggedIn]);

  const openLoginModal = () => {
    const prepare = async () => {
      const account = encryptedAuthConfig.has_saved_credentials ? await decryptText(encryptedAuthConfig.encrypted_account) : '';
      const password = encryptedAuthConfig.has_saved_credentials ? await decryptText(encryptedAuthConfig.encrypted_password) : '';
      form.setFieldsValue({
        account,
        password,
        rememberPassword: encryptedAuthConfig.remember_password,
        autoLogin: encryptedAuthConfig.auto_login
      });
      setRememberPassword(encryptedAuthConfig.remember_password);
      setLoginModalOpen(true);
    };
    prepare();
  };

  const checkUserEntryReady = async (): Promise<boolean> => {
    try {
      const statusResp = await scanService.getWsAuthStatus();
      const connected = Boolean(statusResp.status === 'success' && statusResp.data?.connected);

      if (!connected) {
        const next = saveAuthConfig({
          isLoggedIn: false,
          account: '',
          email: '',
          expiresAt: '',
          lastLoginAt: ''
        });
        setAuth(next);
        setDropdownOpen(false);
        setUserModalOpen(false);
        openLoginModal();
        return false;
      }

      applyOnlineInfoFromStatus(statusResp.data);
      // 后端已登录，允许展示用户信息
      return true;
    } catch (error) {
      console.warn('检查登录状态失败:', error);
      const next = saveAuthConfig({
        isLoggedIn: false,
        account: '',
        email: '',
        expiresAt: '',
        lastLoginAt: ''
      });
      setAuth(next);
      setDropdownOpen(false);
      setUserModalOpen(false);
      openLoginModal();
      return false;
    }
  };

  const handleLogin = async () => {
    try {
      const values = await form.validateFields();
      setLoginLoading(true);
      if (auth.isLoggedIn) {
        message.success('当前已登录，无需重复登录');
        setLoginModalOpen(false);
        return;
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();
      const rememberPassword = Boolean(values.rememberPassword);
      const autoLogin = Boolean(values.autoLogin);
      const account = String(values.account || '').trim();
      const password = String(values.password || '');

      const loginResp = await scanService.login({ username: account, password });
      if (loginResp.status !== 'success' || !loginResp.data?.connected) {
        const reasonZh = loginResp.data?.reason_zh || '';
        const reason = loginResp.data?.reason || '';
        const nonRetryable = Boolean(loginResp.data?.non_retryable);
        const detail = [reasonZh, reason].filter(Boolean).join(' / ');
        const base = loginResp.message || '登录失败';
        message.error(nonRetryable ? `${base}${detail ? `：${detail}` : ''}（不可重试）` : `${base}${detail ? `：${detail}` : ''}`);
        return;
      }

      let encryptedAccount = '';
      let encryptedPassword = '';
      if (rememberPassword) {
        encryptedAccount = await encryptText(account);
        encryptedPassword = await encryptText(password);
      }

      const saveResp = await scanService.saveUserAuthConfig({
        remember_password: rememberPassword,
        auto_login: rememberPassword ? autoLogin : false,
        encrypted_account: encryptedAccount,
        encrypted_password: encryptedPassword
      });
      if (saveResp.status !== 'success') {
        message.error(saveResp.message || '保存登录配置失败');
        return;
      }

      const nextEncryptedCfg: UserAuthConfigData = {
        remember_password: rememberPassword,
        auto_login: rememberPassword ? autoLogin : false,
        encrypted_account: encryptedAccount,
        encrypted_password: encryptedPassword,
        has_saved_credentials: rememberPassword && Boolean(encryptedAccount && encryptedPassword)
      };
      setEncryptedAuthConfig(nextEncryptedCfg);
      setHasSavedCredential(nextEncryptedCfg.has_saved_credentials);

      const next = saveAuthConfig({
        rememberPassword: nextEncryptedCfg.remember_password,
        autoLogin: nextEncryptedCfg.auto_login,
        savedAccount: rememberPassword ? account : '',
        savedPassword: rememberPassword ? password : '',
        isLoggedIn: true,
        account,
        email: account,
        expiresAt,
        loginCount: auth.loginCount + 1,
        lastLoginAt: now.toISOString()
      });
      setAuth(next);
      const statusResp = await scanService.getWsAuthStatus();
      if (statusResp.status === 'success') {
        applyOnlineInfoFromStatus(statusResp.data);
      }
      setLoginModalOpen(false);
      message.success(loginResp.data.already_logged_in ? '已登录，无需重复登录' : '登录成功');
    } catch (error: any) {
      // 表单校验错误不提示
      if (error?.errorFields) {
        return;
      }

      // axios 在 4xx/5xx 时会抛异常，这里兜底解析后端错误体
      const resp = error?.response?.data;
      if (resp) {
        const reasonZh = resp?.data?.reason_zh || '';
        const reason = resp?.data?.reason || '';
        const nonRetryable = Boolean(resp?.data?.non_retryable);
        const detail = [reasonZh, reason].filter(Boolean).join(' / ');
        const base = resp?.message || '登录失败';
        message.error(nonRetryable ? `${base}${detail ? `：${detail}` : ''}（不可重试）` : `${base}${detail ? `：${detail}` : ''}`);
        return;
      }

      message.error('登录失败，请稍后重试');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await scanService.logout();
      // 手动退出后关闭自动登录，避免刷新页面立刻再次自动登录
      const currentCfg = encryptedAuthConfig;
      await scanService.saveUserAuthConfig({
        remember_password: currentCfg.remember_password,
        auto_login: false,
        encrypted_account: currentCfg.encrypted_account,
        encrypted_password: currentCfg.encrypted_password
      });
      setEncryptedAuthConfig({
        ...currentCfg,
        auto_login: false
      });
    } catch (error) {
      console.warn('调用后端登出接口失败:', error);
    } finally {
      const next = saveAuthConfig({
        autoLogin: false,
        isLoggedIn: false,
        account: '',
        email: '',
        expiresAt: '',
        lastLoginAt: ''
      });
      setAuth(next);
      setDropdownOpen(false);
      setUserModalOpen(false);
      message.success('已退出登录');
    }
  };

  const overlay = (
    <Card className="user-menu-card" variant="borderless">
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Space>
            <Avatar style={{ backgroundColor: '#3b82f6' }}>{avatarText}</Avatar>
            <div>
              <div className="user-menu-name">{auth.account}</div>
              <Text type="secondary">
                <MailOutlined /> {auth.email}
              </Text>
            </div>
          </Space>
          <Badge status={wsConnected ? 'success' : wsRetrying ? 'processing' : 'error'} text={wsConnected ? '在线' : wsRetrying ? '重连中' : '离线'} />
        </Space>

        {!wsConnected && wsLastReasonZh && (
          <Text type="warning" style={{ display: 'block' }}>
            {wsLastReasonZh}
          </Text>
        )}

        <div className="user-menu-item">
          <span>到期时间</span>
          <Tag color="blue">{auth.expiresAt ? new Date(auth.expiresAt).toLocaleString() : '--'}</Tag>
        </div>
        <div className="user-menu-item">
          <span>在线时长</span>
          <Tag color="green" icon={<ClockCircleOutlined />}>
            {formatOnlineDuration(auth.totalOnlineSeconds)}
          </Tag>
        </div>
        <div className="user-menu-item">
          <span>登录次数</span>
          <Tag color="purple">{auth.loginCount}</Tag>
        </div>

        <Button danger icon={<LogoutOutlined />} onClick={handleLogout} block>
          退出登录
        </Button>
      </Space>
    </Card>
  );

  return (
    <>
      {compact ? (
        !auth.isLoggedIn ? (
          <div className="user-nav-trigger" onClick={openLoginModal}>
            <div className="nav-icon">
              <UserOutlined />
            </div>
            <div className="nav-label">用户</div>
          </div>
        ) : (
          <>
            <div
              className="user-nav-trigger"
              onClick={async () => {
                const ok = await checkUserEntryReady();
                if (ok) setUserModalOpen(true);
              }}
            >
              <div className="nav-icon">
                <UserOutlined />
              </div>
              <div className="nav-label">用户</div>
            </div>

            <Modal
              open={userModalOpen}
              onCancel={() => setUserModalOpen(false)}
              footer={null}
              closable
              className="user-mobile-modal"
            >
              {overlay}
            </Modal>
          </>
        )
      ) : !auth.isLoggedIn ? (
        <div className="top-user-trigger" onClick={openLoginModal}>
          <Badge status="default" />
          <Avatar icon={<UserOutlined />} />
          <span>未登录</span>
        </div>
      ) : (
        <Dropdown
          open={dropdownOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setDropdownOpen(false);
              return;
            }
            checkUserEntryReady().then((ok) => setDropdownOpen(ok));
          }}
          trigger={['click']}
          placement="bottomRight"
          overlayClassName="user-menu-dropdown"
          dropdownRender={() => overlay}
        >
          <div className="top-user-trigger">
            <Badge status="success" />
            <Avatar style={{ backgroundColor: '#3b82f6' }}>{avatarText}</Avatar>
            <span>{auth.account}</span>
          </div>
        </Dropdown>
      )}

      <Modal
        title="账号登录"
        open={loginModalOpen}
        onCancel={() => setLoginModalOpen(false)}
        onOk={handleLogin}
        okText="登录"
        confirmLoading={loginLoading}
        okButtonProps={{ icon: <LoginOutlined /> }}
        className="process-modal"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ rememberPassword: false, autoLogin: false }}
          onValuesChange={(changedValues) => {
            if (Object.prototype.hasOwnProperty.call(changedValues, 'rememberPassword')) {
              const checked = Boolean(changedValues.rememberPassword);
              setRememberPassword(checked);
              if (!checked) {
                form.setFieldValue('autoLogin', false);
              }
            }
          }}
        >
          <Form.Item label="账号" name="account" rules={[{ required: true, message: '请输入账号' }]}>
            <Input placeholder="请输入账号"  className="search-transparent-input"  />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="请输入密码" 
                    className="search-transparent-input" />
          </Form.Item>
          <Space direction="horizontal" size={20}>
            <Form.Item name="rememberPassword" valuePropName="checked" noStyle>
              <Checkbox>记住密码</Checkbox>
            </Form.Item>
            {(rememberPassword || hasSavedCredential) && (
              <Form.Item name="autoLogin" valuePropName="checked" noStyle>
                <Checkbox>自动登录</Checkbox>
              </Form.Item>
            )}
          </Space>
        </Form>
      </Modal>
    </>
  );
};

export default UserAccountMenu;
