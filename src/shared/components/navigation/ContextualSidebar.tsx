import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

interface SidebarSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  items: SidebarItem[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

interface SidebarItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  isActive?: boolean;
  onClick?: () => void;
  children?: SidebarItem[];
}

interface ContextualSidebarProps {
  sections: SidebarSection[];
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  position?: 'left' | 'right';
  width?: string;
  searchable?: boolean;
  filterable?: boolean;
  onItemClick?: (item: SidebarItem) => void;
}

export function ContextualSidebar({
  sections,
  className,
  collapsible = true,
  defaultCollapsed = false,
  position = 'left',
  width = '280px',
  searchable = true,
  filterable = false,
  onItemClick
}: ContextualSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [expandedSections, setExpandedSections] = useState<string[]>(
    sections
      .filter(section => section.defaultExpanded !== false)
      .map(section => section.id)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Filter sections and items based on search and filters
  const filteredSections = React.useMemo(() => {
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        const matchesSearch = !searchQuery || 
          item.label.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesFilter = activeFilters.length === 0 || 
          activeFilters.some(filter => item.id.includes(filter));
        
        return matchesSearch && matchesFilter;
      })
    })).filter(section => section.items.length > 0);
  }, [sections, searchQuery, activeFilters]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      window.location.href = item.href;
    }
    
    if (onItemClick) {
      onItemClick(item);
    }
  };

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <aside
      className={cn(
        'fixed top-0 h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-out z-40',
        position === 'left' ? 'left-0' : 'right-0',
        isCollapsed ? 'w-16' : `w-[${width}]`,
        className
      )}
      style={{
        width: isCollapsed ? '64px' : width,
        transform: isCollapsed && window.innerWidth < 768 ? 'translateX(-100%)' : 'translateX(0)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="font-semibold text-gray-900 truncate">
            Navigation
          </h2>
        )}
        
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex-shrink-0"
          >
            {position === 'left' ? (
              isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
            ) : (
              isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      {!isCollapsed && (searchable || filterable) && (
        <div className="p-4 border-b border-gray-200 space-y-3">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}

          {filterable && (
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Filters</span>
              {activeFilters.length > 0 && (
                <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                  {activeFilters.length}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2">
          {filteredSections.map((section) => (
            <div key={section.id} className="mb-4">
              {/* Section Header */}
              {!isCollapsed && (
                <div
                  className={cn(
                    'flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide',
                    section.collapsible !== false && 'cursor-pointer hover:text-gray-700'
                  )}
                  onClick={() => section.collapsible !== false && toggleSection(section.id)}
                >
                  <div className="flex items-center space-x-2">
                    {section.icon}
                    <span>{section.title}</span>
                  </div>
                  {section.collapsible !== false && (
                    <ChevronRight
                      className={cn(
                        'w-3 h-3 transition-transform duration-200',
                        expandedSections.includes(section.id) && 'rotate-90'
                      )}
                    />
                  )}
                </div>
              )}

              {/* Section Items */}
              <div
                className={cn(
                  'space-y-1',
                  !isCollapsed && section.collapsible !== false && !expandedSections.includes(section.id) && 'hidden'
                )}
              >
                {section.items.map((item) => (
                  <SidebarItemComponent
                    key={item.id}
                    item={item}
                    isCollapsed={isCollapsed}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500 text-center">
            {filteredSections.reduce((acc, section) => acc + section.items.length, 0)} items
          </div>
        </div>
      )}
    </aside>
  );
}

// Individual sidebar item component
function SidebarItemComponent({
  item,
  isCollapsed,
  onClick,
  level = 0
}: {
  item: SidebarItem;
  isCollapsed: boolean;
  onClick: () => void;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          } else {
            onClick();
          }
        }}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-sm text-left rounded-md transition-all duration-150',
          'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20',
          item.isActive && 'bg-primary/10 text-primary font-medium',
          isCollapsed && 'justify-center px-2'
        )}
        style={{ paddingLeft: isCollapsed ? undefined : `${12 + level * 16}px` }}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="flex items-center space-x-3 min-w-0">
          {item.icon && (
            <span className="flex-shrink-0 w-4 h-4">
              {item.icon}
            </span>
          )}
          {!isCollapsed && (
            <span className="truncate">{item.label}</span>
          )}
        </div>

        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            {item.badge && (
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronRight
                className={cn(
                  'w-3 h-3 transition-transform duration-200',
                  isExpanded && 'rotate-90'
                )}
              />
            )}
          </div>
        )}
      </button>

      {/* Child Items */}
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-1">
          {item.children!.map((child) => (
            <SidebarItemComponent
              key={child.id}
              item={child}
              isCollapsed={isCollapsed}
              onClick={onClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}