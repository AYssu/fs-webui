import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Form, 
  Select, 
  Switch,
  Row,
  Col,

  List,
  Tag,
  Tooltip,
  InputNumber,
  Modal,
  Checkbox,
  Radio,
  App
} from 'antd';
import {
  SearchOutlined,
  InfoCircleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { scanService } from '../services/scanService';
import { getServerUrl } from '../utils/config';
import { renderAnsiText } from '../utils/ansiColors';

const { Text } = Typography;

const BaseSearchPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [searching, setSearching] = useState(false);
  const [results] = useState<any[]>([]);
  const [memoryRanges, setMemoryRanges] = useState<string[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [filteredModules, setFilteredModules] = useState<any[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>(['all']);
  const [moduleMode, setModuleMode] = useState<'all' | 'basic' | 'custom'>('all');
  const [customModulesText, setCustomModulesText] = useState<string>('[]');
  const [moduleModalVisible, setModuleModalVisible] = useState(false);
  const [moduleSearchText, setModuleSearchText] = useState('');
  const [searchAddresses, setSearchAddresses] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [outputFileName, setOutputFileName] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [fileExistsError, setFileExistsError] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [, setAbortController] = useState<AbortController | null>(null);
  const [logPaused, setLogPaused] = useState(false);
  const [autoScrollLogs, setAutoScrollLogs] = useState(true);
  const logBoxRef = useRef<HTMLDivElement | null>(null);
  const logPausedRef = useRef(false);

  // 监听表单中高级选项的值
  const handleB4Value = Form.useWatch('handleB4', form);
  const skipPageFaultValue = Form.useWatch('skipPageFault', form);
  const readUnreadableValue = Form.useWatch('readUnreadable', form);
  const negativeOffsetValue = Form.useWatch('negativeOffset', form);
  const byteAlignmentValue = Form.useWatch('byteAlignment', form);
  const pageAlignmentValue = Form.useWatch('pageAlignment', form);

  useEffect(() => {
    loadMemoryRanges();
    loadModules();
    loadScanLevel();
    loadScanOffset();
    loadProjectModules();
    loadAdvancedOptions();
  }, []);

  useEffect(() => {
    logPausedRef.current = logPaused;
  }, [logPaused]);

  useEffect(() => {
    if (!autoScrollLogs) return;
    const el = logBoxRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [scanLogs, autoScrollLogs]);

  const customModulesDemo = `[
  {
    "name": "libgame.so",
    "index": 1,
    "range": "Cd",
    "startAddress": "0x10000000",
    "endAddress": "0x10010000"
  }
]`;

  // 加载高级选项配置
  const loadAdvancedOptions = async () => {
    try {
      const data = await scanService.getConfig();
      console.log('加载的配置数据:', data);
      if (data.status === 'success') {
        console.log('高级选项原始值:', {
          handle_b4: data.data.handle_b4,
          skip_page_fault: data.data.skip_page_fault,
          read_unreadable: data.data.read_unreadable
        });
        
        const advancedOptions = {
          handleB4: data.data.handle_b4 === true,
          skipPageFault: data.data.skip_page_fault === true,
          readUnreadable: data.data.read_unreadable === true,
          negativeOffset: data.data.negative_offset === true,
          byteAlignment: data.data.byte_alignment === true,
          pageAlignment: data.data.page_alignment === true
        };
        
        console.log('设置到表单的值:', advancedOptions);
        
        form.setFieldsValue(advancedOptions);
      }
    } catch (error) {
      console.error('加载高级选项配置失败:', error);
    }
  };

  // 保存处理B4配置
  const saveHandleB4 = async (enabled: boolean) => {
    try {
      const data = await scanService.saveHandleB4(enabled);
      if (data.status === 'success') {
        console.log('处理B4配置保存成功:', enabled);
      } else {
        console.error('保存处理B4配置失败:', data.message);
      }
    } catch (error) {
      console.error('保存处理B4配置失败:', error);
    }
  };

  // 保存过缺页配置
  const saveSkipPageFault = async (enabled: boolean) => {
    try {
      const data = await scanService.saveSkipPageFault(enabled);
      if (data.status === 'success') {
        console.log('过缺页配置保存成功:', enabled);
      } else {
        console.error('保存过缺页配置失败:', data.message);
      }
    } catch (error) {
      console.error('保存过缺页配置失败:', error);
    }
  };

  // 保存读取不可读内存段配置
  const saveReadUnreadable = async (enabled: boolean) => {
    try {
      const data = await scanService.saveReadUnreadable(enabled);
      if (data.status === 'success') {
        console.log('读取不可读内存段配置保存成功:', enabled);
      } else {
        console.error('保存读取不可读内存段配置失败:', data.message);
      }
    } catch (error) {
      console.error('保存读取不可读内存段配置失败:', error);
    }
  };

  // 保存负偏移配置
  const saveNegativeOffset = async (enabled: boolean) => {
    try {
      const data = await scanService.saveNegativeOffset(enabled);
      if (data.status === 'success') {
        console.log('负偏移配置保存成功:', enabled);
      } else {
        console.error('保存负偏移配置失败:', data.message);
      }
    } catch (error) {
      console.error('保存负偏移配置失败:', error);
    }
  };

  // 保存字节对齐配置
  const saveByteAlignment = async (enabled: boolean) => {
    try {
      const data = await scanService.saveByteAlignment(enabled);
      if (data.status === 'success') {
        console.log('字节对齐配置保存成功:', enabled);
      } else {
        console.error('保存字节对齐配置失败:', data.message);
      }
    } catch (error) {
      console.error('保存字节对齐配置失败:', error);
    }
  };

  // 保存分页对齐配置
  const savePageAlignment = async (enabled: boolean) => {
    try {
      const data = await scanService.savePageAlignment(enabled);
      if (data.status === 'success') {
        console.log('分页对齐配置保存成功:', enabled);
      } else {
        console.error('保存分页对齐配置失败:', data.message);
      }
    } catch (error) {
      console.error('保存分页对齐配置失败:', error);
    }
  };

  // 加载项目模块配置
  const loadProjectModules = async () => {
    try {
      const data = await scanService.getProjectModules();
      if (data.status === 'success') {
        const { packageName, allModules, modules, moduleMode: savedMode, customModules } = data.data;
        const resolvedMode: 'all' | 'basic' | 'custom' = allModules ? 'all' : (savedMode || 'basic');
        setModuleMode(resolvedMode);
        if (customModules && Array.isArray(customModules) && customModules.length > 0) {
          setCustomModulesText(JSON.stringify(customModules, null, 2));
        } else {
          // 自定义模块编辑器不允许为空：给一个 demo 方便用户编辑（不自动保存）
          setCustomModulesText(customModulesDemo);
        }
        if (allModules) {
          setSelectedModules(['all']);
          form.setFieldsValue({ scanModule: ['all'] });
        } else if (modules && modules.length > 0) {
          // modules 现在是模块键数组（name|range|index格式）
          setSelectedModules(modules);
          form.setFieldsValue({ scanModule: modules });
        }
        console.log('项目模块配置加载成功:', packageName, allModules ? '全部模块' : modules);
      } else {
        console.log('加载项目模块配置失败:', data.message);
      }
    } catch (error) {
      console.error('加载项目模块配置失败:', error);
    }
  };

  // 加载扫描层级
  const loadScanLevel = async () => {
    try {
      const data = await scanService.getConfig();
      if (data.status === 'success' && data.data.scan_level) {
        form.setFieldsValue({ scanLevel: data.data.scan_level });
      }
    } catch (error) {
      console.error('加载扫描层级失败:', error);
    }
  };

  // 保存扫描层级
  const saveScanLevel = async (level: number) => {
    try {
      const data = await scanService.saveScanLevel(level);
      if (data.status === 'success') {
        console.log('扫描层级保存成功:', level);
      } else {
        console.error('保存扫描层级失败:', data.message);
      }
    } catch (error) {
      console.error('保存扫描层级失败:', error);
    }
  };

  // 加载扫描偏移
  const loadScanOffset = async () => {
    try {
      const data = await scanService.getConfig();
      if (data.status === 'success' && data.data.scan_offset !== undefined) {
        form.setFieldsValue({ scanOffset: data.data.scan_offset });
      }
    } catch (error) {
      console.error('加载扫描偏移失败:', error);
    }
  };

  // 保存扫描偏移
  const saveScanOffset = async (offset: number) => {
    try {
      const data = await scanService.saveScanOffset(offset);
      if (data.status === 'success') {
        console.log('扫描偏移保存成功:', offset);
      } else {
        console.error('保存扫描偏移失败:', data.message);
      }
    } catch (error) {
      console.error('保存扫描偏移失败:', error);
    }
  };

  // 加载内存范围配置
  const loadMemoryRanges = async () => {
    try {
      const data = await scanService.getConfig();
      if (data.status === 'success') {
        // 从配置中获取已选择的内存类型
        const memoryTypes = [
          'PPSSPP', 'Anonymous', 'Ashmem', 'Code_app', 'Stack', 'C_bss',
          'Code_system', 'C_data', 'C_heap', 'Java', 'Java_heap', 'Other',
          'Video', 'C_alloc', 'All', 'Bad'
        ];
        
        const selectedRanges = memoryTypes.filter(type => data.data[type] === true);
        setMemoryRanges(selectedRanges);
      }
    } catch (error) {
      console.error('加载内存范围失败:', error);
    }
  };

  // 加载模块列表
  const loadModules = async () => {
    try {
      const data = await scanService.getModules();
      if (data.status === 'success') {
        setModules(data.data);
        setFilteredModules(data.data);
        return;
      }
    } catch (error) {
      console.error('加载模块列表失败:', error);
    }
  };

  // 过滤模块列表
  const filterModules = (searchText: string) => {
    setModuleSearchText(searchText);
    if (!searchText.trim()) {
      setFilteredModules(modules);
    } else {
      const filtered = modules.filter(module => 
        module.name.toLowerCase().includes(searchText.toLowerCase()) ||
        module.range.toLowerCase().includes(searchText.toLowerCase()) ||
        module.startAddress.toLowerCase().includes(searchText.toLowerCase()) ||
        module.endAddress.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredModules(filtered);
    }
  };

  // 生成模块唯一键
  const getModuleKey = (module: any): string => {
    return `${module.name}|${module.range}|${module.index}`;
  };

  // 从唯一键解析模块信息
  const parseModuleKey = (key: string): { name: string; range: string; index: number } | null => {
    const parts = key.split('|');
    if (parts.length === 3) {
      return {
        name: parts[0],
        range: parts[1],
        index: parseInt(parts[2])
      };
    }
    return null;
  };

  const handleModuleSelection = (moduleKeys: string[]) => {
    setSelectedModules(moduleKeys);
    form.setFieldsValue({ scanModule: moduleKeys });
    
    // 保存模块配置到项目级别
    saveProjectModules(moduleKeys, moduleMode);
  };

  // 保存项目模块配置
  const saveProjectModules = async (moduleKeys: string[], mode: 'all' | 'basic' | 'custom' = moduleMode) => {
    try {
      const allModules = moduleKeys.includes('all');
      let customModules: any[] = [];
      if (mode === 'custom') {
        try {
          const parsed = JSON.parse(customModulesText || '[]');
          customModules = Array.isArray(parsed) ? parsed : [];
        } catch {
          message.error('自定义模块 JSON 格式错误');
          return;
        }
        if (customModules.length === 0) {
          message.error('自定义模块不能为空，请先编辑 demo 后再保存');
          return;
        }
      }
      const data = await scanService.saveProjectModules({
        allModules,
        moduleMode: allModules ? 'all' : mode,
        modules: allModules ? [] : moduleKeys,
        customModules
      });
      
      if (data.status === 'success') {
        console.log('项目模块配置保存成功:', { mode, moduleKeys, customModules });
      } else {
        console.error('保存项目模块配置失败:', data.message);
      }
    } catch (error) {
      console.error('保存项目模块配置失败:', error);
    }
  };

  const openModuleModal = () => {
    setModuleModalVisible(true);
    setModuleSearchText('');
    setFilteredModules(modules);
  };

  const handleModuleModeChange = (mode: 'all' | 'basic' | 'custom') => {
    setModuleMode(mode);
    if (mode === 'all') {
      handleModuleSelection(['all']);
      return;
    }
    if (mode === 'custom') {
      // 自定义模块不自动落库：只切换 UI，保存由用户手动点击“保存自定义模块”
      const next = selectedModules.includes('all') ? [] : selectedModules;
      setSelectedModules(next);
      form.setFieldsValue({ scanModule: next });
      // 确保编辑器不为空：如果当前是空数组/空字符串，填充 demo
      try {
        const parsed = JSON.parse(customModulesText || '[]');
        if (!Array.isArray(parsed) || parsed.length === 0) {
          setCustomModulesText(customModulesDemo);
        }
      } catch {
        setCustomModulesText(customModulesDemo);
      }
      return;
    }
    const next = selectedModules.includes('all') ? [] : selectedModules;
    setSelectedModules(next);
    form.setFieldsValue({ scanModule: next });
    saveProjectModules(next, 'basic');
  };

  const onFinish = async () => {
    if (searchAddresses.length === 0) {
      return;
    }
    
    // 获取建议的输出文件名
    await loadSuggestedFileName();
    
    // 显示确认弹窗
    setConfirmModalVisible(true);
  };

  // 获取建议的输出文件名
  const loadSuggestedFileName = async () => {
    try {
      const data = await scanService.getSuggestedFilename();
      if (data.status === 'success' && data.data.filename) {
        // 移除.bin后缀
        const filename = data.data.filename.replace('.bin', '');
        setOutputFileName(filename);
        setProjectPath(data.data.projectPath || '');
        setFileExistsError(false);
      } else {
        // 如果后端没有返回文件名，设置默认值
        setOutputFileName('scan1');
        setFileExistsError(false);
      }
    } catch (error) {
      console.error('获取建议文件名失败:', error);
      setOutputFileName('scan1');
      setFileExistsError(false);
    }
  };

  // 检查文件是否存在
  const checkFileExists = async (filename: string) => {
    if (!filename.trim()) {
      setFileExistsError(false);
      return;
    }

    try {
      const fullPath = `${projectPath}/${filename}.bin`;
      const data = await scanService.checkFileExists(fullPath);
      
      if (data.status === 'success') {
        setFileExistsError(data.data.exists);
        if (data.data.exists) {
          message.warning('文件已存在，请更换文件名');
        }
      }
    } catch (error) {
      console.error('检查文件是否存在失败:', error);
      setFileExistsError(false);
    }
  };

  const startScan = async () => {
    // 验证输出文件名
    if (!outputFileName.trim()) {
      message.error('请输入输出文件名');
      return;
    }

    // 检查文件是否存在
    if (fileExistsError) {
      message.error('文件已存在，请更换文件名');
      return;
    }
    
    setConfirmModalVisible(false);
    setSearching(true);
    // 只在开始新扫描时清空日志，不清空 results
    setScanLogs([]);
    
    const values = form.getFieldsValue();
    const fullOutputPath = `${projectPath}/${outputFileName}.bin`;
    
    // 构建扫描请求参数
    const scanParams = {
      addresses: searchAddresses,
      scanLevel: values.scanLevel,
      scanOffset: values.scanOffset || 4000,
      processBits: parseInt(values.processBits),
      scanMode: values.scanMode || 'violent',
      outputFile: fullOutputPath,
      memoryRanges: memoryRanges,
      moduleMode: moduleMode,
      modules: selectedModules,
      handleB4: values.handleB4 || false,
      skipPageFault: values.skipPageFault || false,
      readUnreadable: values.readUnreadable || false,
      negativeOffset: values.negativeOffset || false
    };
    
    console.log('内存搜索参数:', scanParams);
    
    // 创建新的 AbortController
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      // SSE 流式请求仍然使用 fetch（axios 不支持 SSE）
      // 从配置中获取服务端地址
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/scan/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanParams),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('启动扫描失败');
      }

      // 读取SSE流
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      message.success('扫描已启动');

      // 读取SSE数据
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          setSearching(false);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (!logPausedRef.current) {
              setScanLogs(prev => [...prev, data]);
            }
          } else if (line.startsWith('event: scan_complete')) {
            setSearching(false);
            message.success('扫描完成');
          }
        }
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('扫描已取消');
      } else {
        message.error('扫描失败');
        console.error('Scan error:', error);
      }
      setSearching(false);
    }
  };

  // 移除不再需要的SSE连接方法

  // 格式化地址为16进制大写格式
  const formatAddress = (addr: string): string => {
    let trimmed = addr.trim();
    if (!trimmed) return '';
    
    // 移除0x前缀（如果有）
    if (trimmed.toLowerCase().startsWith('0x')) {
      trimmed = trimmed.substring(2);
    }
    
    // 验证是否为有效的16进制
    if (!/^[0-9a-fA-F]+$/.test(trimmed)) {
      return '';
    }
    
    // 转为大写并添加0x前缀
    return '0x' + trimmed.toUpperCase();
  };

  // 处理输入框回车或逗号分隔
  const handleAddressInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addAddresses(inputValue);
    }
  };

  // 添加地址（支持逗号分隔）
  const addAddresses = (value: string) => {
    if (!value.trim()) return;
    
    // 按逗号分隔
    const addresses = value.split(',').map(addr => formatAddress(addr)).filter(addr => addr !== '');
    
    if (addresses.length > 0) {
      const newAddresses = [...searchAddresses, ...addresses];
      setSearchAddresses(newAddresses);
      setInputValue('');
    }
  };

  // 删除地址
  const removeAddress = (addressToRemove: string) => {
    setSearchAddresses(searchAddresses.filter(addr => addr !== addressToRemove));
  };

  // 处理输入框失焦
  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addAddresses(inputValue);
    }
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
      <Card className="glass-card" title="搜索配置">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            scanLevel: 1,
            scanOffset: 4000,
            scanRange: memoryRanges,
            scanModule: ['all'],
            processBits: '64',
            scanMode: 'normal',
            handleB4: false,
            skipPageFault: true,
            readUnreadable: false,
            negativeOffset: false,
            byteAlignment: false,
            pageAlignment: false
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label={
                  <Space>
                    <span>搜索地址</span>
                    <Tooltip title="输入16进制地址，按回车或逗号添加，支持多个地址">
                      <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                    </Tooltip>
                  </Space>
                }
              >
                <div style={{
                  padding: '4px 8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '4px'
                }}>
                  {searchAddresses.map((addr, index) => (
                    <Tag
                      key={index}
                      closable
                      onClose={() => removeAddress(addr)}
                      color="blue"
                      style={{
                        margin: 0,
                        padding: '2px 8px',
                        fontSize: '13px',
                        fontFamily: 'monospace'
                      }}
                    >
                      {addr}
                    </Tag>
                  ))}
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleAddressInput}
                    onBlur={handleInputBlur}
                    placeholder={inputValue.length === 0 ? "输入地址，回车或逗号分隔" : ""}
                    
                    className="search-transparent-input"
                  />
                </div>
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label={
                  <Space>
                    <span>扫描层级</span>
                    <Tooltip title="设置扫描的深度级别，1-50级">
                      <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                    </Tooltip>
                  </Space>
                }
                name="scanLevel"
                rules={[{ required: true, message: '请输入扫描层级' }]}
              >
                <InputNumber 
                  min={1} 
                  max={50} 
                  placeholder="1-50"
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    if (value && value >= 1 && value <= 50) {
                      saveScanLevel(value);
                    }
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label={
                  <Space>
                    <span>扫描偏移</span>
                    <Tooltip title="设置扫描的偏移量，默认4000">
                      <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                    </Tooltip>
                  </Space>
                }
                name="scanOffset"
                rules={[{ required: true, message: '请输入扫描偏移' }]}
              >
                <InputNumber 
                  min={0} 
                  max={100000} 
                  placeholder="默认4000"
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    if (value !== null && value !== undefined) {
                      saveScanOffset(value);
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label={
                  <Space>
                    <span>扫描范围</span>
                    <Tooltip title="从配置文件中获取的内存范围，只读">
                      <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                    </Tooltip>
                  </Space>
                }
                name="scanRange"
              >
                <div style={{ 
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  minHeight: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '4px'
                }}>
                  {memoryRanges.length > 0 ? (
                    memoryRanges.includes('All') ? (
                      <Tag key="All" color="green">
                        All
                      </Tag>
                    ) : (
                      memoryRanges.map(range => (
                        <Tag key={range} color="blue">
                          {range}
                        </Tag>
                      ))
                    )
                  ) : (
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                      未配置内存范围
                    </span>
                  )}
                </div>
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label={
                  <Space>
                    <span>扫描模块</span>
                    <Tooltip title="选择要扫描的模块">
                      <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                    </Tooltip>
                  </Space>
                }
                name="scanModule"
              >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ 
                    flex: 1,
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '6px',
                    minHeight: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '4px'
                  }}>
                    {moduleMode === 'custom' ? (
                      <Tag color="purple">自定义模块(JSON)</Tag>
                    ) : selectedModules.includes('all') ? (
                      <Tag color="green">全部模块</Tag>
                    ) : (
                      selectedModules.map(moduleKey => {
                        const moduleInfo = parseModuleKey(moduleKey);
                        if (!moduleInfo) return null;
                        return (
                          <Tag key={moduleKey} color="blue">
                            {moduleInfo.name}[{moduleInfo.range}][{moduleInfo.index}]
                          </Tag>
                        );
                      })
                    )}
                  </div>
                  <Button 
                    icon={<AppstoreOutlined />}
                    onClick={openModuleModal}
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      color: 'rgba(248, 250, 252, 0.9)'
                    }}
                  >
                    选择
                  </Button>
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label={
                  <Space>
                    <span>进程位数</span>
                    <Tooltip title="目标进程的架构位数">
                      <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                    </Tooltip>
                  </Space>
                }
                name="processBits"
              >
                <Select>
                  <Select.Option value="32">32位</Select.Option>
                  <Select.Option value="64">64位</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label={
                  <Space>
                    <span>扫描模式</span>
                    <Tooltip title="基础扫描(normal) 更稳；暴力扫描(violent) 更全但更慢">
                      <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                    </Tooltip>
                  </Space>
                }
                name="scanMode"
              >
                <Select>
                  <Select.Option value="normal">基础扫描</Select.Option>
                  <Select.Option value="violent">暴力扫描</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Card 
            size="small" 
            title="高级选项" 
            style={{ 
              background: 'rgba(30, 41, 59, 0.4)', 
              border: '1px solid rgba(148, 163, 184, 0.15)',
              marginBottom: 24
            }}
          >
            <Row gutter={[12, 12]}>
              <Col xs={12} sm={12} md={6}>
                <Form.Item
                  name="handleB4"
                  valuePropName="checked"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch 
                      size="small"
                      checked={handleB4Value}
                      onChange={(checked) => {
                        console.log('handleB4 Switch 改变:', checked);
                        form.setFieldValue('handleB4', checked);
                        saveHandleB4(checked);
                      }}
                    />
                    <Space>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                        处理B4
                      </span>
                      <Tooltip title="处理B4字节序相关的数据转换">
                        <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                      </Tooltip>
                    </Space>
                  </div>
                </Form.Item>
              </Col>
              
              <Col xs={12} sm={12} md={6}>
                <Form.Item
                  name="skipPageFault"
                  valuePropName="checked"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch 
                      size="small"
                      checked={skipPageFaultValue}
                      onChange={(checked) => {
                        console.log('skipPageFault Switch 改变:', checked);
                        form.setFieldValue('skipPageFault', checked);
                        saveSkipPageFault(checked);
                      }}
                    />
                    <Space>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                        过缺页
                      </span>
                      <Tooltip title="跳过可能导致缺页异常的内存区域">
                        <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                      </Tooltip>
                    </Space>
                  </div>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="readUnreadable"
                  valuePropName="checked"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch 
                      size="small"
                      checked={readUnreadableValue}
                      onChange={(checked) => {
                        console.log('readUnreadable Switch 改变:', checked);
                        form.setFieldValue('readUnreadable', checked);
                        saveReadUnreadable(checked);
                      }}
                    />
                    <Space>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                        读取不可读内存段
                      </span>
                      <Tooltip title="尝试读取标记为不可读的内存段">
                        <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                      </Tooltip>
                    </Space>
                  </div>
                </Form.Item>
              </Col>
              
              <Col xs={12} sm={12} md={6}>
                <Form.Item
                  name="negativeOffset"
                  valuePropName="checked"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch 
                      size="small"
                      checked={negativeOffsetValue}
                      onChange={(checked) => {
                        console.log('negativeOffset Switch 改变:', checked);
                        form.setFieldValue('negativeOffset', checked);
                        saveNegativeOffset(checked);
                      }}
                    />
                    <Space>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                        负偏移
                      </span>
                      <Tooltip title="启用负偏移地址计算">
                        <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                      </Tooltip>
                    </Space>
                  </div>
                </Form.Item>
              </Col>

              <Col xs={12} sm={12} md={6}>
                <Form.Item
                  name="byteAlignment"
                  valuePropName="checked"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch 
                      size="small"
                      checked={byteAlignmentValue}
                      onChange={(checked) => {
                        console.log('byteAlignment Switch 改变:', checked);
                        form.setFieldValue('byteAlignment', checked);
                        saveByteAlignment(checked);
                      }}
                    />
                    <Space>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                        字节对齐
                      </span>
                      <Tooltip title="启用字节对齐扫描">
                        <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                      </Tooltip>
                    </Space>
                  </div>
                </Form.Item>
              </Col>

              <Col xs={12} sm={12} md={6}>
                <Form.Item
                  name="pageAlignment"
                  valuePropName="checked"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch 
                      size="small"
                      checked={pageAlignmentValue}
                      onChange={(checked) => {
                        console.log('pageAlignment Switch 改变:', checked);
                        form.setFieldValue('pageAlignment', checked);
                        savePageAlignment(checked);
                      }}
                    />
                    <Space>
                      <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                        分页对齐
                      </span>
                      <Tooltip title="启用分页对齐扫描">
                        <InfoCircleOutlined style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                      </Tooltip>
                    </Space>
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item className="scan-submit-item">
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SearchOutlined />}
              loading={searching}
              size="large"
              disabled={searchAddresses.length === 0}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)'
              }}
            >
              {searching ? '搜索中...' : '开始扫描'}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 模块选择弹窗 */}
      <Modal
        title={
          <Space>
            <AppstoreOutlined />
            <span>选择扫描模块</span>
          </Space>
        }
        open={moduleModalVisible}
        onCancel={() => setModuleModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModuleModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            onClick={() => {
              setModuleModalVisible(false);
            }}
          >
            确定
          </Button>
        ]}
        width={800}
        className="process-modal"
      >
        {/* 搜索过滤 */}
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索模块名称、范围、地址..."
            value={moduleSearchText}
            onChange={(e) => filterModules(e.target.value)}
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

        {/* 模块模式 */}
        <div style={{ marginBottom: 16 }}>
          <Radio.Group
            value={moduleMode}
            onChange={(e) => handleModuleModeChange(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="all">全部模块</Radio.Button>
            <Radio.Button value="basic">基础模块</Radio.Button>
            <Radio.Button value="custom">自定义模块</Radio.Button>
          </Radio.Group>
        </div>

        {/* 全选选项 */}
        <div style={{ marginBottom: 16 }}>
          <Checkbox
            checked={selectedModules.includes('all')}
            disabled={moduleMode !== 'basic'}
            onChange={(e) => {
              if (e.target.checked) {
                handleModuleSelection(['all']);
              } else {
                handleModuleSelection([]);
              }
            }}
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            全部模块
          </Checkbox>
        </div>

        {moduleMode === 'custom' && (
          <div style={{ marginBottom: 16 }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              自定义模块 JSON（数组，字段：name/index/range(Cb|Cd|Xa)/startAddress/endAddress）
            </Text>
            <Input.TextArea
              value={customModulesText}
              onChange={(e) => setCustomModulesText(e.target.value)}
              rows={8}
              style={{ marginTop: 8, fontFamily: 'monospace' }}
              placeholder='[{"name":"libgame.so","index":1,"range":"Cd","startAddress":"0x10000000","endAddress":"0x10010000"}]'
            />
            <div style={{ marginTop: 8 }}>
              <Button
                type="primary"
                size="small"
                onClick={() => saveProjectModules(selectedModules.includes('all') ? [] : selectedModules, 'custom')}
              >
                保存自定义模块
              </Button>
            </div>
          </div>
        )}
        
        {/* 模块列表 */}
        <div style={{ maxHeight: '400px', overflowY: 'auto', opacity: moduleMode === 'basic' ? 1 : 0.5 }}>
          <List
            dataSource={filteredModules}
            renderItem={(module) => {
              const moduleKey = getModuleKey(module);
              return (
              <List.Item
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  padding: '16px',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  minHeight: '120px'
                }}
              >
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Checkbox
                    checked={selectedModules.includes('all') || selectedModules.includes(moduleKey)}
                    disabled={selectedModules.includes('all') || moduleMode !== 'basic'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (!selectedModules.includes(moduleKey)) {
                          const newSelection = selectedModules.filter(m => m !== 'all');
                          handleModuleSelection([...newSelection, moduleKey]);
                        }
                      } else {
                        handleModuleSelection(selectedModules.filter(m => m !== moduleKey));
                      }
                    }}
                    style={{ marginTop: '2px' }}
                  />
                  <div style={{ flex: 1 }}>
                    {/* 第一行：模块名称和索引 */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ 
                        color: 'rgba(248, 250, 252, 0.95)', 
                        fontWeight: 600,
                        fontSize: '15px'
                      }}>
                        {module.name}
                      </span>
                      <Tag color="blue" style={{ fontSize: '11px' }}>
                        Index: {module.index}
                      </Tag>
                    </div>
                    
                    {/* 第二行：模块范围 */}
                    <div style={{ marginBottom: '6px' }}>
                      <Space>
                        <span style={{ 
                          color: 'rgba(203, 213, 225, 0.7)', 
                          fontSize: '12px'
                        }}>
                          范围:
                        </span>
                        <Tag 
                          color={
                            module.range === 'Cd' ? 'green' : 
                            module.range === 'Xa' ? 'orange' : 
                            module.range === 'Cb' ? 'purple' : 'default'
                          }
                          style={{ fontSize: '11px' }}
                        >
                          {module.range}
                        </Tag>
                      </Space>
                    </div>
                    
                    {/* 第三行：地址范围 */}
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      fontSize: '12px',
                      color: 'rgba(203, 213, 225, 0.8)'
                    }}>
                      <div>
                        <span style={{ color: 'rgba(203, 213, 225, 0.7)' }}>起始: </span>
                        <span style={{ fontFamily: 'monospace' }}>{module.startAddress}</span>
                      </div>
                      <div>
                        <span style={{ color: 'rgba(203, 213, 225, 0.7)' }}>结束: </span>
                        <span style={{ fontFamily: 'monospace' }}>{module.endAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </List.Item>
              );
            }}
          />
          
          {filteredModules.length === 0 && moduleSearchText && (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              未找到匹配的模块
            </div>
          )}
        </div>
      </Modal>

      {/* 扫描确认弹窗 */}
      <Modal
        title="确认扫描配置"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onOk={startScan}
        okText="开始扫描"
        cancelText="取消"
        okButtonProps={{ disabled: !outputFileName.trim() || fileExistsError }}
        width={650}
        className="process-modal"
      >
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.4)', 
          padding: '24px', 
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.15)'
        }}>
          {/* 地址列表 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ 
              color: 'rgba(248, 250, 252, 0.9)', 
              fontSize: '13px', 
              fontWeight: 500,
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>搜索地址</span>
              <Tag color="blue" style={{ fontSize: '11px', margin: 0 }}>
                {searchAddresses.length} 个
              </Tag>
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              {searchAddresses.map((addr, index) => (
                <Tag key={index} color="blue" style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '13px',
                  padding: '4px 10px',
                  margin: 0
                }}>
                  {addr}
                </Tag>
              ))}
            </div>
          </div>

          {/* 两列布局 */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            {/* 扫描层级 */}
            <Col span={12}>
              <div style={{ 
                color: 'rgba(248, 250, 252, 0.9)', 
                fontSize: '13px', 
                fontWeight: 500,
                marginBottom: 10
              }}>
                扫描层级
              </div>
              <div style={{
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.1)'
              }}>
                <Tag color="cyan" style={{ fontSize: '13px', margin: 0 }}>
                  {form.getFieldValue('scanLevel')} 级
                </Tag>
              </div>
            </Col>

            {/* 进程位数 */}
            <Col span={12}>
              <div style={{ 
                color: 'rgba(248, 250, 252, 0.9)', 
                fontSize: '13px', 
                fontWeight: 500,
                marginBottom: 10
              }}>
                进程位数
              </div>
              <div style={{
                padding: '10px 12px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.1)'
              }}>
                <Tag color="purple" style={{ fontSize: '13px', margin: 0 }}>
                  {form.getFieldValue('processBits')} 位
                </Tag>
              </div>
            </Col>
          </Row>

          {/* 内存范围 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ 
              color: 'rgba(248, 250, 252, 0.9)', 
              fontSize: '13px', 
              fontWeight: 500,
              marginBottom: 10
            }}>
              内存范围
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              {memoryRanges.includes('All') ? (
                <Tag color="green" style={{ fontSize: '13px', margin: 0 }}>全部</Tag>
              ) : (
                memoryRanges.map(range => (
                  <Tag key={range} color="blue" style={{ fontSize: '13px', margin: 0 }}>
                    {range}
                  </Tag>
                ))
              )}
            </div>
          </div>

          {/* 扫描模块 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ 
              color: 'rgba(248, 250, 252, 0.9)', 
              fontSize: '13px', 
              fontWeight: 500,
              marginBottom: 10
            }}>
              扫描模块
            </div>
            <div style={{
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              {moduleMode === 'custom' ? (
                (() => {
                  let customCount = 0;
                  let customNames: string[] = [];
                  try {
                    const parsed = JSON.parse(customModulesText || '[]');
                    if (Array.isArray(parsed)) {
                      customCount = parsed.length;
                      customNames = parsed
                        .map((m) => (m && typeof m === 'object' ? (m.name as string) : ''))
                        .filter((n) => typeof n === 'string' && n.trim().length > 0);
                    }
                  } catch {
                    // ignore
                  }
                  return (
                    <div>
                      <Tag color="purple" style={{ fontSize: '13px', marginBottom: 10 }}>
                        已选择 {customCount} 个自定义模块
                      </Tag>
                      {customNames.length > 0 && (
                        <div style={{
                          maxHeight: '100px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}>
                          {customNames.map((n, idx) => (
                            <Tag key={`${n}-${idx}`} color="geekblue" style={{ fontSize: '12px', margin: 0 }}>
                              {n}
                            </Tag>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : selectedModules.includes('all') ? (
                <Tag color="green" style={{ fontSize: '13px', margin: 0 }}>全部模块</Tag>
              ) : (
                <div>
                  <Tag color="orange" style={{ fontSize: '13px', marginBottom: 10 }}>
                    已选择 {selectedModules.length} 个模块
                  </Tag>
                  <div style={{ 
                    maxHeight: '100px', 
                    overflowY: 'auto',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {selectedModules.map(moduleKey => {
                      const moduleInfo = parseModuleKey(moduleKey);
                      if (!moduleInfo) return null;
                      return (
                        <Tag key={moduleKey} color="blue" style={{ fontSize: '12px', margin: 0 }}>
                          {moduleInfo.name}[{moduleInfo.range}][{moduleInfo.index}]
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 高级选项 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ 
              color: 'rgba(248, 250, 252, 0.9)', 
              fontSize: '13px', 
              fontWeight: 500,
              marginBottom: 10
            }}>
              高级选项
            </div>
            <div style={{
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <Space wrap size={[8, 8]}>
                {form.getFieldValue('handleB4') && (
                  <Tag color="geekblue" style={{ fontSize: '13px', margin: 0 }}>处理B4</Tag>
                )}
                {form.getFieldValue('skipPageFault') && (
                  <Tag color="geekblue" style={{ fontSize: '13px', margin: 0 }}>过缺页</Tag>
                )}
                {form.getFieldValue('readUnreadable') && (
                  <Tag color="geekblue" style={{ fontSize: '13px', margin: 0 }}>读取不可读内存段</Tag>
                )}
                {form.getFieldValue('negativeOffset') && (
                  <Tag color="geekblue" style={{ fontSize: '13px', margin: 0 }}>负偏移</Tag>
                )}
                {!form.getFieldValue('handleB4') && 
                 !form.getFieldValue('skipPageFault') && 
                 !form.getFieldValue('readUnreadable') && 
                 !form.getFieldValue('negativeOffset') && (
                  <Tag color="default" style={{ fontSize: '13px', margin: 0 }}>无</Tag>
                )}
              </Space>
            </div>
          </div>

          {/* 输出文件路径 */}
          <div>
            <div style={{ 
              color: 'rgba(248, 250, 252, 0.9)', 
              fontSize: '13px', 
              fontWeight: 500,
              marginBottom: 10
            }}>
              输出文件名 <span style={{ color: '#ff4d4f', fontSize: '12px' }}>*</span>
            </div>
            <Input
              value={outputFileName}
              onChange={(e) => {
                setOutputFileName(e.target.value);
                setFileExistsError(false);
              }}
              onBlur={(e) => checkFileExists(e.target.value)}
              placeholder="例如: scan1"
              allowClear
              status={fileExistsError ? 'error' : ''}
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: fileExistsError ? '1px solid #ff4d4f' : '1px solid rgba(148, 163, 184, 0.2)',
                color: 'rgba(248, 250, 252, 0.9)',
                fontFamily: 'monospace',
                fontSize: '14px',
                padding: '8px 12px'
              }}
              className="search-transparent-input"
            />
            {fileExistsError && (
              <div style={{ 
                marginTop: 8, 
                fontSize: '12px', 
                color: '#ff4d4f',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>⚠️</span>
                <span>文件已存在，请更换文件名</span>
              </div>
            )}
            <div style={{ 
              marginTop: 8, 
              fontSize: '12px', 
              color: 'rgba(203, 213, 225, 0.7)',
              wordBreak: 'break-all'
            }}>
              保存路径: {projectPath || '/storage/emulated/0/fscanV3'}/{outputFileName || 'scan1'}.bin
            </div>
          </div>
        </div>
      </Modal>

      {(searching || scanLogs.length > 0) && (
        <Card
          className="glass-card"
          title="扫描日志"
          extra={
            <Space>
              <Switch
                checked={!logPaused}
                onChange={(v) => setLogPaused(!v)}
                checkedChildren="实时"
                unCheckedChildren="暂停"
              />
              <Switch
                checked={autoScrollLogs}
                onChange={setAutoScrollLogs}
                checkedChildren="自动滚动"
                unCheckedChildren="不滚动"
              />
              <Button size="small" onClick={() => setScanLogs([])}>
                清空
              </Button>
            </Space>
          }
        >
          <div
            ref={logBoxRef}
            style={{
            background: 'rgba(30, 41, 59, 0.45)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            maxHeight: '300px',
            overflowY: 'auto',
            overflowX: 'hidden',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: 'rgba(248, 250, 252, 0.9)',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            textAlign: 'left',
            lineHeight: 1.5
          }}
          >
            {scanLogs.length > 0 ? (
              scanLogs.map((log, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  {renderAnsiText(log)}
                </div>
              ))
            ) : (
              <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                正在初始化扫描...
              </div>
            )}
          </div>
        </Card>
      )}

      {!searching && results.length > 0 && (
        <Card 
          className="glass-card" 
          title={`搜索结果 (${results.length} 个匹配)`}
        >
          <List
            dataSource={results}
            renderItem={(item) => (
              <List.Item 
                className="result-item"
                style={{
                  background: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  padding: '16px',
                  border: '1px solid rgba(148, 163, 184, 0.15)'
                }}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong style={{ color: 'rgba(248, 250, 252, 0.95)' }}>
                        地址: {item.address}
                      </Text>
                      <Tag color="blue">{item.type}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <div>
                        <Text style={{ color: 'rgba(203, 213, 225, 0.9)' }}>
                          数值: {item.value}
                        </Text>
                      </div>
                      <div>
                        <Text style={{ color: 'rgba(203, 213, 225, 0.9)' }}>
                          模块: {item.module}
                        </Text>
                      </div>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default BaseSearchPage;