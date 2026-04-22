import { useMemo, useRef, useState, useEffect } from 'react';
import { Card, Button, Select, Input, InputNumber, Switch, Space, Typography, Divider, Tag, Progress, Transfer, App, Tooltip, Checkbox, Empty } from 'antd';
import { PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TransferItem } from 'antd/es/transfer';
import { scanService, type OutputFileInfo } from '../services/scanService';
import { getServerUrl } from '../utils/config';
import { renderAnsiText } from '../utils/ansiColors';

const { Title, Text } = Typography;
const { Option } = Select;

export default function PointerComparePage() {
  const { message } = App.useApp();

  const MAX_COMPARE_LOG_LINES = 1000;

  const [files, setFiles] = useState<OutputFileInfo[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [mobileListSearch, setMobileListSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compareLogs, setCompareLogs] = useState<string[]>([]);
  const [logPaused, setLogPaused] = useState(false);
  const [autoScrollLogs, setAutoScrollLogs] = useState(true);
  const logBoxRef = useRef<HTMLDivElement | null>(null);
  
  // 对比配置
  // 优先级：binary(多线程) > multi(单线程) > text(文本)
  const [compareMode, setCompareMode] = useState<'text' | 'binary' | 'multi'>('binary');
  const [levelLimit, setLevelLimit] = useState<number>(0);
  const [levelRange, setLevelRange] = useState<[number, number]>([0, 0]);
  const [maxResults, setMaxResults] = useState<number>(0);
  const [threadCount, setThreadCount] = useState<number>(4);
  const [compareIndex, setCompareIndex] = useState<boolean>(true);
  const [removeLevel, setRemoveLevel] = useState<number>(0);
  const compareSelectionLimit = compareMode === 'binary' ? 8 : 2;
  const supportsTextOnlyCompareArgs = compareMode === 'text';

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (selectedKeys.length > compareSelectionLimit) {
      setSelectedKeys((prev) => prev.slice(0, compareSelectionLimit));
      message.warning(
        compareMode === 'binary'
          ? '二进制对比最多选择 8 个文件'
          : '单线程/文本对比仅支持 2 个文件，已自动保留前 2 个'
      );
    }
  }, [compareMode, compareSelectionLimit, selectedKeys.length, message]);

  // 订阅后端 SSE 事件流，接收对比日志（不会因为对比结束而清空）
  useEffect(() => {
    const url = `${getServerUrl()}/api/events`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      const data = event.data ?? '';
      if (typeof data !== 'string') return;

      // 过滤掉心跳/连接通知
      if (data.startsWith('{') && data.endsWith('}')) {
        try {
          const obj = JSON.parse(data);
          if (obj?.type === 'heartbeat' || obj?.type === 'connected') return;
        } catch {
          // ignore
        }
      }

      if (data.includes('[COMPARE]')) {
        if (logPaused) return;
        setCompareLogs((prev) => {
          const next = [...prev, data];
          return next.length > MAX_COMPARE_LOG_LINES ? next.slice(-MAX_COMPARE_LOG_LINES) : next;
        });
      }
    };

    es.onerror = () => {
      // 不刷屏，只在首次失败给个提示
      // eslint-disable-next-line @typescript-eslint/no-empty-function
    };

    return () => {
      es.close();
    };
  }, [logPaused]);

  useEffect(() => {
    if (!autoScrollLogs) return;
    const el = logBoxRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [compareLogs, autoScrollLogs]);

  const loadFiles = async () => {
    try {
      const resp = await scanService.listOutputFiles(['bin']);
      const onlyBinFiles = (resp.files || []).filter((f) =>
        f.filename.toLowerCase().endsWith('.bin')
      );
      setFiles(onlyBinFiles);
    } catch (error) {
      message.error('加载文件列表失败');
    }
  };

  const transferDataSource: TransferItem[] = useMemo(() => {
    const reachedLimit = selectedKeys.length >= compareSelectionLimit;
    const limitReason =
      compareMode === 'binary'
        ? '二进制对比最多选择 8 个文件'
        : '当前模式仅支持选择 2 个文件';
    return files.map((f) => {
      const sizeMB = (f.size / 1024 / 1024).toFixed(2);
      const bitTag =
        f.bitSize === 32 ? '32位' : f.bitSize === 64 ? '64位' : '未知位数';
      const isSelected = selectedKeys.includes(f.path);
      const disabled = reachedLimit && !isSelected;
      return {
        key: f.path,
        title: f.filename,
        description: disabled
          ? `${bitTag} · ${sizeMB} MB · ${f.modifiedTime} · ${limitReason}`
          : `${bitTag} · ${sizeMB} MB · ${f.modifiedTime}`,
        disabled,
      };
    });
  }, [files, selectedKeys, compareMode, compareSelectionLimit]);

  const mobileFilteredFiles = useMemo(() => {
    const q = mobileListSearch.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.filename.toLowerCase().includes(q));
  }, [files, mobileListSearch]);

  const selectedFiles = useMemo(() => {
    return selectedKeys
      .map((k) => files.find((f) => f.path === k))
      .filter(Boolean) as OutputFileInfo[];
  }, [selectedKeys, files]);

  const handleCompare = async () => {
    if (compareMode === 'binary' && selectedKeys.length < 2) {
      message.warning('二进制对比请至少选择2个文件');
      return;
    }

    if (compareMode !== 'binary' && selectedKeys.length !== 2) {
      message.warning('单线程/文本对比必须且只能选择2个文件');
      return;
    }

    // 检查文件位数是否一致
    const bitSizes = selectedFiles.map(f => f.bitSize).filter((v) => v !== -1);
    if (new Set(bitSizes).size > 1) {
      message.error('所选文件位数不一致，请选择相同位数的文件');
      return;
    }

    setComparing(true);
    setProgress(0);
    setCompareLogs((prev) => {
      const next = [...prev, '[COMPARE] 已提交对比请求...'];
      return next.length > MAX_COMPARE_LOG_LINES ? next.slice(-MAX_COMPARE_LOG_LINES) : next;
    });

    try {
      const outputBinary = compareMode !== 'text';
      const compareParams: {
        files: string[];
        mode: 'text' | 'binary' | 'multi';
        levelLimit: [number, number] | null;
        maxResults: number;
        threadCount: number;
        outputBinary: boolean;
        compareIndex?: boolean;
        removeLevel?: number;
      } = {
        files: selectedKeys,
        mode: compareMode,
        levelLimit: levelRange[0] > 0 ? levelRange : (levelLimit > 0 ? [levelLimit, levelLimit] : null),
        maxResults,
        threadCount,
        outputBinary
      };
      if (supportsTextOnlyCompareArgs) {
        compareParams.compareIndex = compareIndex;
        compareParams.removeLevel = removeLevel;
      }
      await scanService.startCompare({
        ...compareParams
      });

      message.success('对比完成');
    } catch (error) {
      const status = (error as any)?.response?.status;
      message.error(status === 401 ? '未登录或登录已过期（401）' : '对比失败');
      setCompareLogs((prev) => {
        const next = [...prev, '[COMPARE] 对比失败（请检查后端日志/接口返回）'];
        return next.length > MAX_COMPARE_LOG_LINES ? next.slice(-MAX_COMPARE_LOG_LINES) : next;
      });
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="page-container search-page-wide" style={{ width: '100%', maxWidth: 'none', margin: '0 auto' }}>
      <Card className="glass-card">
        <Title level={3}>指针对比</Title>
        <Text type="secondary">从当前项目目录选择输出文件，使用穿梭框挑选需要对比的文件</Text>
      </Card>
      
      <div className="pointer-compare-grid">
        <Card
          className="glass-card"
          title={
            <Space>
              <span>文件选择</span>
              <Button size="small" icon={<ReloadOutlined />} onClick={loadFiles}>
                刷新
              </Button>
            </Space>
          }
        >
          {isMobile ? (
            <div className="pointer-compare-mobile-file-picker">
              <Input
                value={mobileListSearch}
                onChange={(e) => setMobileListSearch(e.target.value)}
                placeholder="搜索文件名..."
                allowClear
                className="search-transparent-input"
              />

              <Divider style={{ margin: '12px 0' }} />

              <div className="pointer-compare-mobile-file-list">
                {mobileFilteredFiles.length === 0 ? (
                  <Empty description="暂无文件" />
                ) : (
                  <div>
                    {mobileFilteredFiles.map((f) => {
                      const isSelected = selectedKeys.includes(f.path);
                      const reachedLimit = selectedKeys.length >= compareSelectionLimit;
                      const disabled = reachedLimit && !isSelected;
                      const sizeMB = (f.size / 1024 / 1024).toFixed(2);
                      const bitTag = f.bitSize === 32 ? '32位' : f.bitSize === 64 ? '64位' : '未知位数';
                      return (
                        <div
                          key={f.path}
                          className={`pointer-compare-mobile-file-item ${disabled ? 'is-disabled' : ''}`}
                          onClick={() => {
                            if (disabled) return;
                            setSelectedKeys((prev) => (isSelected ? prev.filter((k) => k !== f.path) : [...prev, f.path]));
                          }}
                        >
                          <div style={{ display: 'flex', gap: 12, width: '100%', alignItems: 'flex-start' }}>
                            <Checkbox checked={isSelected} disabled={disabled} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <Text style={{ fontWeight: 600, color: 'rgba(248, 250, 252, 0.95)' }}>{f.filename}</Text>
                                <Tag color="blue" style={{ margin: 0 }}>{bitTag}</Tag>
                              </div>
                              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                                {sizeMB} MB · {f.modifiedTime}
                              </Text>
                              {disabled && (
                                <Text type="warning" style={{ fontSize: 12, display: 'block' }}>
                                  已达到上限 {compareSelectionLimit} 个
                                </Text>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Divider style={{ margin: '12px 0' }} />

              <div className="pointer-compare-mobile-selected">
                <Text>
                  已选择: {selectedKeys.length} 个文件（当前上限 {compareSelectionLimit} 个）
                </Text>
                {selectedKeys.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedFiles.map((f) => (
                      <Tag
                        key={f.path}
                        closable
                        onClose={(e) => {
                          e.preventDefault();
                          setSelectedKeys((prev) => prev.filter((k) => k !== f.path));
                        }}
                        color="geekblue"
                        style={{ margin: 0, maxWidth: '100%' }}
                      >
                        {f.filename}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Transfer
              dataSource={transferDataSource}
              titles={['可选文件', '已选择']}
              targetKeys={selectedKeys}
              onChange={(nextTargetKeys) => setSelectedKeys(nextTargetKeys.map((k) => String(k)))}
              render={(item) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, color: 'rgba(248, 250, 252, 0.95)' }}>{item.title}</span>
                    <Tag color="blue" style={{ margin: 0 }}>{files.find(f => f.path === item.key)?.bitSize ?? 'N/A'}</Tag>
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(203, 213, 225, 0.8)' }}>{item.description}</span>
                </div>
              )}
              showSearch
              className="search-transparent-input pointer-compare-transfer"
              oneWay
            />
          )}
          <Divider />
          <Text>
            已选择: {selectedKeys.length} 个文件（当前上限 {compareSelectionLimit} 个）
          </Text>
          {selectedKeys.length >= compareSelectionLimit && (
            <div style={{ marginTop: 8 }}>
              <Text type="warning">
                {compareMode === 'binary'
                  ? '已达到上限 8 个，如需继续请选择先移除右侧文件。'
                  : '当前模式仅支持 2 个文件，请先移除右侧文件。'}
              </Text>
            </div>
          )}
        </Card>

        <Card className="glass-card" title="对比配置">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div className="pointer-compare-config-row">
            <Text>对比模式</Text>
            <Select
              value={compareMode}
              onChange={setCompareMode}
              style={{ width: 'min(360px, 100%)' }}
            >
              <Option value="binary">二进制对比(多线程)</Option>
              <Option value="multi">单线程对比</Option>
              <Option value="text">普通对比(输出文本)</Option>
            </Select>
          </div>

          <div className="pointer-compare-config-row">
            <Text>层级限制</Text>
            <InputNumber
              value={levelLimit}
              onChange={(val) => setLevelLimit(val || 0)}
              min={0}
              placeholder="0=不限制"
              style={{ width: 'min(180px, 100%)' }}
            />
            <Text type="secondary">或范围</Text>
            <div className="pointer-compare-range">
              <InputNumber
                value={levelRange[0]}
                onChange={(val) => setLevelRange([val || 0, levelRange[1]])}
                min={0}
                placeholder="起始"
                style={{ width: 'min(160px, 100%)' }}
              />
              <Text type="secondary">-</Text>
              <InputNumber
                value={levelRange[1]}
                onChange={(val) => setLevelRange([levelRange[0], val || 0])}
                min={0}
                placeholder="结束"
                style={{ width: 'min(160px, 100%)' }}
              />
            </div>
          </div>

          <div className="pointer-compare-config-row">
            <Text>限制数量</Text>
            <InputNumber
              value={maxResults}
              onChange={(val) => setMaxResults(val || 0)}
              min={0}
              placeholder="0=不限制"
              style={{ width: 'min(360px, 100%)' }}
            />
          </div>

          {compareMode === 'binary' && (
            <div className="pointer-compare-config-row">
              <Text>线程数量</Text>
              <InputNumber
                value={threadCount}
                onChange={(val) => setThreadCount(val || 4)}
                min={1}
                max={16}
                style={{ width: 'min(260px, 100%)' }}
              />
            </div>
          )}

          {supportsTextOnlyCompareArgs && (
            <div className="pointer-compare-config-row">
              <Space wrap>
                <Text>下标判断:</Text>
                <Switch checked={compareIndex} onChange={setCompareIndex} />
                <Text type="secondary">(关闭后不对比模块下标和范围)</Text>
              </Space>
            </div>
          )}

          {supportsTextOnlyCompareArgs && (
            <div className="pointer-compare-config-row">
              <Text>去除层级(倒数)</Text>
              <InputNumber
                value={removeLevel}
                onChange={(val) => setRemoveLevel(val || 0)}
                min={0}
                placeholder="0=不去除"
                style={{ width: 'min(260px, 100%)' }}
              />
            </div>
          )}

          <div>
            <Space>
              <Text>输出格式:</Text>
              <Tag color={compareMode === 'text' ? 'default' : 'blue'} style={{ margin: 0 }}>
                {compareMode === 'text' ? '文本（固定）' : '二进制（固定）'}
              </Tag>
              <Text type="secondary">
                {compareMode === 'text' ? '文本模式固定输出文本' : '二进制/单线程模式固定输出二进制'}
              </Text>
            </Space>
          </div>
        </Space>
        </Card>
      </div>

      {comparing && (
        <Card className="glass-card" style={{ marginTop: 24 }}>
          <Progress percent={progress} status="active" />
          <Text>对比进行中...</Text>
        </Card>
      )}

      {(comparing || compareLogs.length > 0) && (
        <Card
          className="glass-card"
          title={
            <Space>
              <span>对比日志</span>
              <Tag color="blue" style={{ margin: 0 }}>
                最近 {compareLogs.length} 行
              </Tag>
            </Space>
          }
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
              <Button size="small" onClick={() => setCompareLogs([])}>
                清空
              </Button>
            </Space>
          }
          style={{ marginTop: 24 }}
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
              lineHeight: 1.5,
            }}
          >
            {compareLogs.length > 0 ? (
              compareLogs.map((log, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>
                  {renderAnsiText(log)}
                </div>
              ))
            ) : (
              <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>等待对比日志...</div>
            )}
          </div>
        </Card>
      )}

      <Space style={{ marginTop: 24 }}>
        <Tooltip
          title={
            comparing
              ? '对比进行中'
              : compareMode === 'binary'
                ? (selectedKeys.length < 2 ? '二进制对比至少选择2个文件' : '')
                : (selectedKeys.length !== 2 ? '单线程/文本对比必须选择2个文件' : '')
          }
        >
          <span>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleCompare}
              disabled={
                comparing ||
                (compareMode === 'binary' ? selectedKeys.length < 2 : selectedKeys.length !== 2)
              }
              size="large"
            >
              开始对比
            </Button>
          </span>
        </Tooltip>
      </Space>
    </div>
  );
}
