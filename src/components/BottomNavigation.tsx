import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  SearchOutlined,
  SettingOutlined,
  DiffOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import UserAccountMenu from './UserAccountMenu';
import './BottomNavigation.css';

const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: '扫描',
      path: '/search'
    },
    {
      key: '/compare',
      icon: <DiffOutlined />,
      label: '对比',
      path: '/compare'
    },
    {
      key: '/plugins',
      icon: <AppstoreOutlined />,
      label: '插件',
      path: '/plugins'
    },
    {
      key: '/user',
      icon: null,
      label: '用户',
      path: '/user',
      custom: true
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
      path: '/settings'
    }
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="bottom-navigation">
      <div className="nav-container">
        {navItems.map((item) => (
          <div
            key={item.key}
            className={`nav-item ${(location.pathname === item.path || (location.pathname === '/' && item.path === '/search')) ? 'active' : ''}`}
            onClick={() => {
              if (!item.custom) {
                handleNavClick(item.path);
              }
            }}
          >
            {item.custom ? (
              <UserAccountMenu compact />
            ) : (
              <>
                <div className="nav-icon">
                  {item.icon}
                </div>
                <div className="nav-label">
                  {item.label}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;