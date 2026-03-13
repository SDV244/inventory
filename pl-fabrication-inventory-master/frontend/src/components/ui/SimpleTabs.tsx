interface Tab {
  id: string;
  label: string;
}

interface SimpleTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function SimpleTabs({ tabs, activeTab, onChange, className = '' }: SimpleTabsProps) {
  return (
    <div className={`flex space-x-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                       ${isActive
                         ? 'bg-slate-700 text-slate-100 shadow-sm'
                         : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                       }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
