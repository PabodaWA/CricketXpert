import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Brand = {
  primary: '#072679',
  secondary: '#42ADF5',
  heading: '#000000',
  body: '#36516C',
  light: '#F1F2F7',
  accent: '#D88717',
};

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '🏏 CricketXpert', isBrand: true },
    { path: '/repair', label: '🛠️ New Repair Request' },
    { path: '/manager', label: '👨‍💼 Service Manager' },
    { path: '/technician', label: '🔧 Technician' },
  ];

  return (
    <nav className="bg-white shadow-lg border-b-2" style={{ borderColor: Brand.secondary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'text-white'
                    : 'text-gray-700 hover:text-white'
                } ${
                  item.isBrand
                    ? 'text-2xl font-bold'
                    : location.pathname === item.path
                    ? 'bg-blue-600'
                    : 'hover:bg-blue-500'
                }`}
                style={{
                  color: item.isBrand ? Brand.primary : undefined,
                  backgroundColor: location.pathname === item.path && !item.isBrand ? Brand.secondary : undefined,
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm" style={{ color: Brand.body }}>System Online</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
