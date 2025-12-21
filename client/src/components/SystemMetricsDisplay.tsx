import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, HardDrive, Database, Cpu, MemoryStick, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemMetrics {
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercentage: number;
    breakdown: {
      uploads: number;
      database: number;
    };
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercentage: number;
    process: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
  cpu: {
    usage: number;
    loadAverage: number[];
    cpuCount: number;
  };
  uptime: number;
  platform: string;
  nodeVersion: string;
  architecture: string;
  hostname: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

export default function SystemMetricsDisplay() {
  const { toast } = useToast();
  
  const { data: metrics, refetch, isLoading, error } = useQuery<SystemMetrics>({
    queryKey: ['/api/system/metrics'],
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 60000, // Keep in cache for 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Metrics refreshed",
        description: "System metrics have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh system metrics.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Failed to load system metrics</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-2 w-full bg-muted animate-pulse rounded" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>•</span>
          <span>Uptime: {formatUptime(metrics.uptime)}</span>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Disk Usage */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Disk Usage</span>
          </div>
          <Progress 
            value={metrics.disk.usagePercentage} 
            className="h-2"
            style={{
              '--progress-background': metrics.disk.usagePercentage > 80 ? 'hsl(var(--destructive))' : 
                                     metrics.disk.usagePercentage > 60 ? 'hsl(var(--warning))' : 
                                     'hsl(var(--primary))'
            } as React.CSSProperties}
          />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Used:</span>
              <span>{formatBytes(metrics.disk.used)} ({metrics.disk.usagePercentage}%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Free:</span>
              <span>{formatBytes(metrics.disk.free)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span>{formatBytes(metrics.disk.total)}</span>
            </div>
          </div>
        </div>

        {/* Database Size */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-500" />
            <span className="font-medium">Database & Files</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Database:</span>
              <span>{formatBytes(metrics.disk.breakdown.database)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uploads:</span>
              <span>{formatBytes(metrics.disk.breakdown.uploads)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t pt-2">
              <span>Total Files:</span>
              <span>{formatBytes(metrics.disk.breakdown.database + metrics.disk.breakdown.uploads)}</span>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MemoryStick className="h-4 w-4 text-purple-500" />
            <span className="font-medium">Memory Usage</span>
          </div>
          <Progress 
            value={metrics.memory.usagePercentage} 
            className="h-2"
            style={{
              '--progress-background': metrics.memory.usagePercentage > 80 ? 'hsl(var(--destructive))' : 
                                     metrics.memory.usagePercentage > 60 ? 'hsl(var(--warning))' : 
                                     'hsl(var(--primary))'
            } as React.CSSProperties}
          />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Used:</span>
              <span>{formatBytes(metrics.memory.used)} ({metrics.memory.usagePercentage}%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Free:</span>
              <span>{formatBytes(metrics.memory.free)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Process:</span>
              <span>{formatBytes(metrics.memory.process.rss)}</span>
            </div>
          </div>
        </div>

        {/* CPU Usage */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-orange-500" />
            <span className="font-medium">CPU Usage</span>
          </div>
          <Progress 
            value={metrics.cpu.usage} 
            className="h-2"
            style={{
              '--progress-background': metrics.cpu.usage > 80 ? 'hsl(var(--destructive))' : 
                                     metrics.cpu.usage > 60 ? 'hsl(var(--warning))' : 
                                     'hsl(var(--primary))'
            } as React.CSSProperties}
          />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current:</span>
              <span>{metrics.cpu.usage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Load Avg:</span>
              <span>{metrics.cpu.loadAverage[0].toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPU Cores:</span>
              <span>{metrics.cpu.cpuCount}</span>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="space-y-3 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <span className="font-medium">System Info</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform:</span>
              <span className="capitalize">{metrics.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Architecture:</span>
              <span>{metrics.architecture}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPUs:</span>
              <span>{metrics.cpu.cpuCount} cores</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Node.js:</span>
              <span>{metrics.nodeVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hostname:</span>
              <span className="truncate max-w-24" title={metrics.hostname}>{metrics.hostname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uptime:</span>
              <span>{formatUptime(metrics.uptime)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Warning messages */}
      {(metrics.disk.usagePercentage > 80 || metrics.memory.usagePercentage > 80 || metrics.cpu.usage > 80) && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <span className="text-sm font-medium">⚠️ Resource Usage Warning</span>
          </div>
          <div className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            {metrics.disk.usagePercentage > 80 && <div>• Disk usage is high ({metrics.disk.usagePercentage}%)</div>}
            {metrics.memory.usagePercentage > 80 && <div>• Memory usage is high ({metrics.memory.usagePercentage}%)</div>}
            {metrics.cpu.usage > 80 && <div>• CPU usage is high ({metrics.cpu.usage}%)</div>}
          </div>
        </div>
      )}
    </div>
  );
}