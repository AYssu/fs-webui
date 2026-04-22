
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';

// 页面组件
import BaseSearchPage from './pages/BaseSearchPage';
import BaseFilterPage from './pages/BaseFilterPage';
import TextConvertPage from './pages/TextConvertPage';
import ScriptConvertPage from './pages/ScriptConvertPage';
import SettingsPage from './pages/SettingsPage';
import UserPage from './pages/UserPage';
import PointerComparePage from './pages/PointerComparePage';
import PointerLoaderPage from './pages/PointerLoaderPage';
import FormatConvertPage from './pages/FormatConvertPage';
import PluginPage from './pages/PluginPage';

// 组件
import BottomNavigation from './components/BottomNavigation';

import './App.css';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          colorBgContainer: 'rgba(30, 41, 59, 0.7)',
          colorBgElevated: 'rgba(30, 41, 59, 0.8)',
          colorText: 'rgba(248, 250, 252, 0.9)',
          colorTextSecondary: 'rgba(203, 213, 225, 0.8)',
          colorBorder: 'rgba(148, 163, 184, 0.2)',
          colorBgBase: '#1a1d29',
          borderRadius: 12,
        },
      }}
    >
      <AntdApp>
        <Router>
          <div className="app">
            <div className="main-content">
              <Routes>
                <Route path="/" element={<BaseSearchPage />} />
                <Route path="/search" element={<BaseSearchPage />} />
                <Route path="/filter" element={<BaseFilterPage />} />
                <Route path="/compare" element={<PointerComparePage />} />
                <Route path="/loader" element={<PointerLoaderPage />} />
                <Route path="/format" element={<FormatConvertPage />} />
                <Route path="/plugins" element={<PluginPage />} />
                <Route path="/text" element={<TextConvertPage />} />
                <Route path="/script" element={<ScriptConvertPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/user" element={<UserPage />} />
              </Routes>
            </div>
            <BottomNavigation />
          </div>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;