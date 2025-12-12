import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Upload, 
  Database, 
  Music, 
  Image, 
  Users, 
  ShoppingCart,
  CreditCard,
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";

interface BackupProgress {
  step: string;
  message: string;
}

interface RestoreOptions {
  beats: boolean;
  genres: boolean;
  users: boolean;
  purchases: boolean;
  customers: boolean;
  payments: boolean;
  settings: boolean;
  files: boolean;
  overwriteExisting: boolean;
}

export default function BackupRestoreManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(null);
  const [restoreProgress, setRestoreProgress] = useState<BackupProgress | null>(null);
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    beats: true,
    genres: true,
    users: false, // Default to false for security
    purchases: true,
    customers: true,
    payments: true,
    settings: true,
    files: true,
    overwriteExisting: false
  });

  // Get database statistics
  const { data: dbStats } = useQuery({
    queryKey: ['/api/admin/backup/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/backup/stats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch database stats');
      return response.json();
    }
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/backup/create', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to create backup');
      
      // Handle streaming progress updates
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const progress = JSON.parse(line);
              setBackupProgress(progress);
            } catch (e) {
              // Ignore non-JSON lines
            }
          }
        }
      }
      
      // Get final download URL
      const finalResponse = await fetch('/api/admin/backup/download', {
        credentials: 'include'
      });
      
      if (!finalResponse.ok) throw new Error('Failed to get download URL');
      
      return finalResponse.blob();
    },
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `beatbazaar-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setBackupProgress(null);
      toast({
        title: "Backup Complete",
        description: "Your backup has been downloaded successfully",
      });
    },
    onError: (error) => {
      setBackupProgress(null);
      toast({
        title: "Backup Failed",
        description: error instanceof Error ? error.message : "Failed to create backup",
        variant: "destructive",
      });
    }
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('backup', file);
      formData.append('options', JSON.stringify({
        clearExisting: restoreOptions.overwriteExisting,
        restoreFiles: restoreOptions.files
      }));
      
      const response = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to restore backup');
      
      // Handle streaming progress updates
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const progress = JSON.parse(line);
              setRestoreProgress(progress);
            } catch (e) {
              // Ignore non-JSON lines
            }
          }
        }
      }
    },
    onSuccess: () => {
      setRestoreProgress(null);
      queryClient.invalidateQueries(); // Refresh all data
      toast({
        title: "Restore Complete",
        description: "Your backup has been restored successfully",
      });
    },
    onError: (error) => {
      setRestoreProgress(null);
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "Failed to restore backup",
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        toast({
          title: "Invalid File",
          description: "Please select a valid backup ZIP file",
          variant: "destructive",
        });
        return;
      }
      
      restoreBackupMutation.mutate(file);
    }
  };

  const updateRestoreOption = (key: keyof RestoreOptions, value: boolean) => {
    setRestoreOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Statistics
          </CardTitle>
          <CardDescription>
            Current data in your BeatBazaar database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dbStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Music className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{dbStats.database?.beats || 0}</div>
                <div className="text-sm text-muted-foreground">Beats</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{dbStats.database?.users || 0}</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{dbStats.database?.purchases || 0}</div>
                <div className="text-sm text-muted-foreground">Purchases</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Image className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{dbStats.files?.totalFiles || 0}</div>
                <div className="text-sm text-muted-foreground">Files ({dbStats.files?.totalSizeMB || 0} MB)</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading statistics...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Create Backup
          </CardTitle>
          <CardDescription>
            Download a complete backup of your music, images, and database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {backupProgress ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{backupProgress.step}</span>
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  {backupProgress.message}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">What's included in the backup:</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                      <li>• All music files and images</li>
                      <li>• Complete database (beats, users, purchases, etc.)</li>
                      <li>• App settings and configurations</li>
                      <li>• File structure and metadata</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => createBackupMutation.mutate()}
                disabled={createBackupMutation.isPending}
                className="w-full"
                size="lg"
              >
                {createBackupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Backup...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Create & Download Backup
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restore Backup
          </CardTitle>
          <CardDescription>
            Upload and restore a backup file to recover your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Restore Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Select what to restore:</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="beats"
                    checked={restoreOptions.beats}
                    onCheckedChange={(checked) => updateRestoreOption('beats', !!checked)}
                  />
                  <Label htmlFor="beats" className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Beats & Music Files
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="genres"
                    checked={restoreOptions.genres}
                    onCheckedChange={(checked) => updateRestoreOption('genres', !!checked)}
                  />
                  <Label htmlFor="genres" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Genres
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="purchases"
                    checked={restoreOptions.purchases}
                    onCheckedChange={(checked) => updateRestoreOption('purchases', !!checked)}
                  />
                  <Label htmlFor="purchases" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Purchases
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="customers"
                    checked={restoreOptions.customers}
                    onCheckedChange={(checked) => updateRestoreOption('customers', !!checked)}
                  />
                  <Label htmlFor="customers" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Customers
                  </Label>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="payments"
                    checked={restoreOptions.payments}
                    onCheckedChange={(checked) => updateRestoreOption('payments', !!checked)}
                  />
                  <Label htmlFor="payments" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payments
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="settings"
                    checked={restoreOptions.settings}
                    onCheckedChange={(checked) => updateRestoreOption('settings', !!checked)}
                  />
                  <Label htmlFor="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    App Settings
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="files"
                    checked={restoreOptions.files}
                    onCheckedChange={(checked) => updateRestoreOption('files', !!checked)}
                  />
                  <Label htmlFor="files" className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Files & Images
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="users"
                    checked={restoreOptions.users}
                    onCheckedChange={(checked) => updateRestoreOption('users', !!checked)}
                  />
                  <Label htmlFor="users" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Users (Admin Only)
                  </Label>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="overwrite"
                checked={restoreOptions.overwriteExisting}
                onCheckedChange={(checked) => updateRestoreOption('overwriteExisting', !!checked)}
              />
              <Label htmlFor="overwrite" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Overwrite existing data
              </Label>
            </div>
            
            {!restoreOptions.overwriteExisting && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Safe mode: Only missing data will be restored. Existing data will be preserved.
                </p>
              </div>
            )}
          </div>

          {/* Progress Display */}
          {restoreProgress ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{restoreProgress.step}</span>
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  {restoreProgress.message}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".zip"
                className="hidden"
              />
              
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={restoreBackupMutation.isPending}
                className="w-full"
                size="lg"
                variant="outline"
              >
                {restoreBackupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Select Backup File to Restore
                  </>
                )}
              </Button>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Important:</h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                      <li>• Only upload backup files created by this system</li>
                      <li>• Large backups may take several minutes to restore</li>
                      <li>• Ensure you have sufficient storage space</li>
                      <li>• Consider creating a backup before restoring</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}