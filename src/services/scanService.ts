import api from './api';

// 类型定义
export interface ConfigData {
  name: string;
  default_path: string;
  package_name: string;
  app_name: string;
  scan_level: number;
  scan_offset: number;
  handle_b4: boolean;
  skip_page_fault: boolean;
  read_unreadable: boolean;
  negative_offset: boolean;
  byte_alignment: boolean;
  page_alignment: boolean;
  rw_type?: number;
  rw_plugin_path?: string;
  [key: string]: any; // 内存类型配置
}

export interface ProcessInfo {
  pid: number;
  name: string;
  package: string;
}

export interface ModuleInfo {
  name: string;
  index: number;
  range: string;
  startAddress: string;
  endAddress: string;
}

export interface OutputFileInfo {
  index: number;
  filename: string;
  path: string;
  size: number;
  bitSize: number; // 32 or 64 (unknown: -1)
  modifiedTime: string;
}

export interface CompareParams {
  files: string[];
  mode?: 'text' | 'binary' | 'multi';
  levelLimit?: [number, number] | null;
  maxResults?: number;
  threadCount?: number;
  compareIndex?: boolean;
  removeLevel?: number;
  outputBinary?: boolean;
}

export interface UserAuthConfigData {
  remember_password: boolean;
  auto_login: boolean;
  encrypted_account: string;
  encrypted_password: string;
  has_saved_credentials: boolean;
}

export interface WsAuthStatusData {
  connected: boolean;
  logged_in?: boolean;
  login_count?: number;
  member_expires_at?: string;
  online_seconds?: number;
  timestamp?: number;
  back_seconds?: number;
  last_error?: string;
  reason?: string;
  reason_zh?: string;
  non_retryable?: boolean;
  retrying?: boolean;
  retry_count?: number;
}

export interface RwPluginTestReport {
  path: string;
  path_exists: boolean;
  load_success: boolean;
  init_pid_success: boolean;
  read_success: boolean;
  overall_success: boolean;
  self_pid?: number;
  test_address?: number;
  expected_value?: number;
  actual_value?: number;
  value_match?: boolean;
  error?: string;
}

export interface AuthLoginData {
  connected: boolean;
  already_logged_in?: boolean;
  reason?: string;
  reason_zh?: string;
  non_retryable?: boolean;
}

export interface CustomModuleItem {
  name: string;
  index: number;
  range: 'Cb' | 'Cd' | 'Xa';
  startAddress: string;
  endAddress: string;
}

export interface ScanParams {
  addresses: string[];
  scanLevel: number;
  scanOffset: number;
  processBits: number;
  outputFile: string;
  memoryRanges: string[];
  modules: string[];
  handleB4: boolean;
  skipPageFault: boolean;
  readUnreadable: boolean;
  negativeOffset: boolean;
}

// API 服务
export const scanService = {
  // 获取配置
  getConfig: () => api.get<any, { status: string; data: ConfigData }>('/config'),

  // 获取进程列表
  getProcesses: () => api.get<any, { status: string; data: ProcessInfo[] }>('/processes'),

  // 选择进程
  selectProcess: (data: { pid: number; name: string; package: string }) =>
    api.post<any, { status: string; message?: string }>('/process/select', data),

  // 获取包信息
  getPackageInfo: (packageName: string) =>
    api.get<any, { status: string; data: { app_name: string }; message?: string }>(`/package/info?name=${encodeURIComponent(packageName)}`),

  // 获取包的 PID
  getPackagePid: (packageName: string) =>
    api.get<any, { status: string; data: { pid: number }; message?: string }>(`/package/pid?name=${encodeURIComponent(packageName)}`),

  // 保存内存配置
  saveMemoryConfig: (config: Record<string, boolean>) =>
    api.post<any, { status: string; message?: string }>('/config/memory', config),

  // 获取模块列表
  getModules: () => api.get<any, { status: string; data: ModuleInfo[] }>('/modules'),

  // 获取建议的输出文件名
  getSuggestedFilename: () =>
    api.get<any, { status: string; data: { filename: string; projectPath: string } }>('/output/suggest-filename'),

  // 检查文件是否存在
  checkFileExists: (filePath: string) =>
    api.get<any, { status: string; data: { exists: boolean }; message?: string }>(`/output/check-file?path=${encodeURIComponent(filePath)}`),

  // 保存扫描层级
  saveScanLevel: (level: number) =>
    api.post<any, { status: string; message?: string }>('/config/scan-level', { level }),

  // 保存扫描偏移
  saveScanOffset: (offset: number) =>
    api.post<any, { status: string; message?: string }>('/config/scan-offset', { offset }),

  // 保存项目模块配置
  saveProjectModules: (data: { allModules: boolean; moduleMode?: 'all' | 'basic' | 'custom'; modules: string[]; customModules?: CustomModuleItem[] }) =>
    api.post<any, { status: string; message?: string }>('/config/project-modules', data),

  // 获取项目模块配置
  getProjectModules: () =>
    api.get<any, { status: string; data?: any; message?: string }>('/config/project-modules'),

  // 保存处理B4配置
  saveHandleB4: (enabled: boolean) =>
    api.post<any, { status: string; message?: string }>('/config/handle-b4', { enabled }),

  // 保存过缺页配置
  saveSkipPageFault: (enabled: boolean) =>
    api.post<any, { status: string; message?: string }>('/config/skip-page-fault', { enabled }),

  // 保存读取不可读内存段配置
  saveReadUnreadable: (enabled: boolean) =>
    api.post<any, { status: string; message?: string }>('/config/read-unreadable', { enabled }),

  // 保存负偏移配置
  saveNegativeOffset: (enabled: boolean) =>
    api.post<any, { status: string; message?: string }>('/config/negative-offset', { enabled }),

  // 保存字节对齐配置
  saveByteAlignment: (enabled: boolean) =>
    api.post<any, { status: string; message?: string }>('/config/byte-alignment', { enabled }),

  // 保存分页对齐配置
  savePageAlignment: (enabled: boolean) =>
    api.post<any, { status: string; message?: string }>('/config/page-alignment', { enabled }),

  // 保存读写模式配置
  saveRwType: (type: number) =>
    api.post<any, { status: string; message?: string }>('/config/rw-type', { type }),

  // 保存读写插件路径
  saveRwPluginPath: (path: string) =>
    api.post<any, { status: string; data?: { path: string }; message?: string }>('/config/rw-plugin-path', { path }),

  // 测试读写插件
  testRwPlugin: (path: string) =>
    api.post<any, { status: string; data?: RwPluginTestReport; message?: string }>(
      '/plugin/rw/test',
      { path }
    ),

  // 获取用户登录配置（加密密文）
  getUserAuthConfig: () =>
    api.get<any, { status: string; data: UserAuthConfigData; message?: string }>('/config/user-auth'),

  // 保存用户登录配置（加密密文）
  saveUserAuthConfig: (data: Partial<UserAuthConfigData>) =>
    api.post<any, { status: string; data?: UserAuthConfigData; message?: string }>('/config/user-auth', data),

  // 获取 WS 认证连接状态
  getWsAuthStatus: () =>
    api.get<any, { status: string; data: WsAuthStatusData; message?: string }>('/auth/ws-status'),

  // 登录并建立 WS 连接
  login: (data: { username?: string; account?: string; password: string }) =>
    api.post<any, { status: string; data?: AuthLoginData; message?: string }>('/auth/login', data),

  // 登出并断开 WS 连接
  logout: () =>
    api.post<any, { status: string; data?: { connected: boolean }; message?: string }>('/auth/logout'),

  // 停止扫描
  stopScan: () => api.post('/scan/stop'),

  // 获取扫描状态
  getScanStatus: () => api.get('/scan/status'),

  // 健康检查
  healthCheck: () => api.get('/health'),

  // 列出项目目录下的输出文件（按后缀过滤）
  listOutputFiles: (types: string[] = ['bin']) =>
    api.get<any, { status: string; files: OutputFileInfo[]; message?: string }>(
      `/files/list?type=${encodeURIComponent(types.join(','))}`
    ),

  // 启动对比
  startCompare: (params: CompareParams) =>
    api.post<any, { status: string; data?: any; message?: string }>('/compare/start', params),
};
