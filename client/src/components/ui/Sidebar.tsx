import React, { useState } from 'react';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
  badge?: string | number;
}

interface SidebarProps {
  items: SidebarItem[];
  activePath: string;
  onNavigate: (path: string) => void;
  userRole?: string;
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  logo?: React.ReactNode;
  appName?: string;
  onLogout?: () => void;
}

// Desktop/Tablet Sidebar Component
const DesktopSidebar: React.FC<SidebarProps> = ({
  items,
  activePath,
  onNavigate,
  userRole,
  collapsed: controlledCollapsed,
  onCollapse,
  logo,
  appName = 'Medical SaaS',
  onLogout,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleCollapse = () => {
    const newState = !isCollapsed;
    if (onCollapse) {
      onCollapse(newState);
    } else {
      setInternalCollapsed(newState);
    }
  };

  const filteredItems = items.filter(
    (item) => !item.roles || !userRole || item.roles.includes(userRole)
  );

  return (
    <aside
      className={`
        flex
        flex-col 
        bg-white 
        border-r border-gray-200 
        transition-all duration-300 
        h-screen 
        sticky top-0 
        overflow-hidden 
        flex-shrink-0
        ${isCollapsed ? 'w-20 min-w-[80px] max-w-[80px]' : 'w-64 min-w-[256px] max-w-[256px]'}
      `}
    >
      {/* Logo Section */}
      <div className={`flex items-center p-4 border-b border-gray-200 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        {logo}
        {!isCollapsed && (
          <span className="text-xl font-bold text-gray-900">{appName}</span>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = activePath === item.path;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center rounded-lg transition-colors relative ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {isCollapsed && item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {/* Collapse Toggle Button */}
        {onCollapse && (
          <button
            onClick={handleCollapse}
            className={`w-full flex items-center rounded-lg transition-colors text-gray-700 hover:bg-gray-100 ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </span>
            {!isCollapsed && (
              <span className="flex-1 text-left font-medium">Collapse</span>
            )}
          </button>
        )}

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className={`w-full flex items-center rounded-lg transition-colors text-red-600 hover:bg-red-50 ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
            }`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <span className="flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            {!isCollapsed && (
              <span className="flex-1 text-left font-medium">Logout</span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

// Mobile Sidebar Component
const MobileSidebar: React.FC<SidebarProps> = ({
  items,
  activePath,
  onNavigate,
  userRole,
  logo,
  appName = 'Medical SaaS',
  onLogout,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredItems = items.filter(
    (item) => !item.roles || !userRole || item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-lg"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`
          fixed top-0 left-0 z-50 
          h-full w-64 
          bg-white 
          border-r border-gray-200 
          transform transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section with Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {logo}
              <span className="text-xl font-bold text-gray-900">{appName}</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredItems.map((item) => {
              const isActive = activePath === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.path);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          {onLogout && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-red-600 hover:bg-red-50"
              >
                <span className="flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </span>
                <span className="flex-1 text-left font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

// Main Sidebar Component that renders both
export const Sidebar: React.FC<SidebarProps> = (props) => {
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkScreenSize();

    // Listen for window resize
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <>
      {isMobile ? <MobileSidebar {...props} /> : <DesktopSidebar {...props} />}
    </>
  );
};
