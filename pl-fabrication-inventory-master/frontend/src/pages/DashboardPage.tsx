import { 
  Package, 
  Factory, 
  Cpu, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react';
import { Card, MetricCard, Badge, ProgressBar } from '../components/ui';
import { useDashboardMetrics, useProductionStats, useActivityFeed, useLowStockAlerts } from '../hooks';
import { formatCurrency, formatPercent, formatRelativeTime, getStockLevel } from '../utils/helpers';

export function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: productionStats } = useProductionStats();
  const { data: activityFeed } = useActivityFeed();
  const { data: lowStockItems } = useLowStockAlerts();

  const activityIcons: Record<string, typeof Activity> = {
    production: Factory,
    inventory: Package,
    quality: Cpu,
    system: Activity,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-slate-400 mt-1">Overview of production and inventory status</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Inventory Value"
          value={metricsLoading ? '...' : formatCurrency(metrics?.totalInventoryValue || 0)}
          icon={<Package className="w-6 h-6" />}
          trend={{ value: 5.2 }}
          subtitle="Total component value"
        />
        <MetricCard
          title="Work in Progress"
          value={metricsLoading ? '...' : String(metrics?.wipCount || 0)}
          icon={<Factory className="w-6 h-6" />}
          subtitle="Active work orders"
        />
        <MetricCard
          title="Produced Today"
          value={metricsLoading ? '...' : String(metrics?.devicesProducedToday || 0)}
          icon={<Cpu className="w-6 h-6" />}
          trend={{ value: 12 }}
          subtitle="Devices completed"
        />
        <MetricCard
          title="Yield Rate"
          value={metricsLoading ? '...' : formatPercent(metrics?.yieldRate || 0)}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 2.1 }}
          subtitle="7-day average"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Chart */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Production (Last 7 Days)</h2>
            <div className="space-y-3">
              {productionStats?.map((stat) => (
                <div key={stat.date} className="flex items-center gap-4">
                  <span className="text-sm text-slate-400 w-20">
                    {new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1">
                    <ProgressBar 
                      value={stat.passed} 
                      max={stat.produced} 
                      size="sm"
                    />
                  </div>
                  <span className="text-sm text-slate-300 w-16 text-right">
                    {stat.passed}/{stat.produced}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Activity Feed */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {activityFeed?.slice(0, 5).map((item) => {
                const Icon = activityIcons[item.type] || Activity;
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-pl-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-200 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 truncate">{item.description}</p>
                      <p className="text-xs text-slate-600 mt-1">{formatRelativeTime(item.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Third Row - Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-slate-100">Low Stock Alerts</h2>
              {lowStockItems && lowStockItems.length > 0 && (
                <Badge variant="warning">{lowStockItems.length}</Badge>
              )}
            </div>
            {lowStockItems && lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item) => {
                  const stockLevel = getStockLevel(item);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.sku}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={stockLevel === 'critical' ? 'danger' : 'warning'}>
                          {item.currentStock} / {item.minStock}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No low stock alerts</p>
            )}
          </div>
        </Card>

        {/* Pending QC */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-slate-100">Pending Quality Checks</h2>
              {metrics?.pendingQC && metrics.pendingQC > 0 && (
                <Badge variant="info">{metrics.pendingQC}</Badge>
              )}
            </div>
            <p className="text-slate-400 text-sm">
              {metrics?.pendingQC || 0} devices awaiting quality inspection
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
