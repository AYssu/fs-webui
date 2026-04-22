export interface AuthStorageConfig {
  rememberPassword: boolean;
  autoLogin: boolean;
  savedAccount: string;
  savedPassword: string;
  isLoggedIn: boolean;
  account: string;
  email: string;
  expiresAt: string;
  loginCount: number;
  totalOnlineSeconds: number;
  lastLoginAt: string;
}

const AUTH_STORAGE_KEY = 'fscan_auth_config';

const DEFAULT_AUTH_CONFIG: AuthStorageConfig = {
  rememberPassword: false,
  autoLogin: false,
  savedAccount: '',
  savedPassword: '',
  isLoggedIn: false,
  account: '',
  email: '',
  expiresAt: '',
  loginCount: 0,
  totalOnlineSeconds: 0,
  lastLoginAt: ''
};

export const getAuthConfig = (): AuthStorageConfig => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return DEFAULT_AUTH_CONFIG;
    return { ...DEFAULT_AUTH_CONFIG, ...(JSON.parse(raw) as Partial<AuthStorageConfig>) };
  } catch (error) {
    console.error('读取账号配置失败:', error);
    return DEFAULT_AUTH_CONFIG;
  }
};

export const saveAuthConfig = (patch: Partial<AuthStorageConfig>): AuthStorageConfig => {
  const next = { ...getAuthConfig(), ...patch };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
  return next;
};
