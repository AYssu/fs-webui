// 配置管理工具
const CONFIG_KEY = 'fscan_config';

export interface AppConfig {
  serverUrl: string;
}

// 默认配置
const DEFAULT_CONFIG: AppConfig = {
  serverUrl: 'http://localhost:8080',
};

// 获取配置
export const getConfig = (): AppConfig => {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('读取配置失败:', error);
  }
  return DEFAULT_CONFIG;
};

// 保存配置
export const saveConfig = (config: Partial<AppConfig>): void => {
  try {
    const current = getConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('保存配置失败:', error);
  }
};

// 获取服务端 URL
export const getServerUrl = (): string => {
  return getConfig().serverUrl;
};

// 设置服务端 URL
export const setServerUrl = (url: string): void => {
  saveConfig({ serverUrl: url });
};
