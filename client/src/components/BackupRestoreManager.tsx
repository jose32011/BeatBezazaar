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
  Loader2,
  FolderOpen,
  FileArchive
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
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(null);
  const [restoreProgress, setRestoreProgress] = useState<BackupProgress | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [restoreMode, setRestoreMode] = useState<'single' | 'multi'>('single');
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
      
      // Check if it's a multi-part backup
      const contentType = finalResponse.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const result = await finalResponse.json();
        if (result.type === 'multipart') {
          return result; // Return the multi-part info
        }
      }
      
      return finalResponse.blob();
    },
    onSuccess: (result) => {
      setBackupProgress(null);
      
      // Handle multi-part backup
      if (result && typeof result === 'object' && result.type === 'multipart') {
        toast({
          title: "Multi-Part Backup Created",
          description: `Backup created in ${result.parts.length} parts. Download each part separately.`,
        });
        
        // Automatically download all parts
        result.parts.forEach((part: any, index: number) => {
          setTimeout(() => {
            const link = document.createElement('a');
            link.href = `/api/admin/backup/download-part/${part.part}`;
            link.download = part.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, index * 1000); // Stagger downloads by 1 second
        });
        
        return;
      }
      
      // Handle single file backup
      if (result instanceof Blob) {
        const url = window.URL.createObjectURL(result);
        const link = document.createElement('a');
        link.href = url;
        link.download = `beatbazaar-backup-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Backup Complete",
          description: "Your backup has been downloaded successfully",
        });
      }
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

  // Restore backup mutation (single file)
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
      setSelectedFiles([]);
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

  // Restore multi-part backup mutation
  const restoreMultiPartMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      
      // Add all backup parts
      files.forEach((file, index) => {
        formData.append(`backupPart${index + 1}`, file);
      });
      
      formData.append('totalParts', files.length.toString());
      formData.append('options', JSON.stringify({
        clearExisting: restoreOptions.overwriteExisting,
        restoreFiles: restoreOptions.files
      }));
      
      const response = await fetch('/api/admin/backup/restore-multipart', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to restore multi-part backup');
      
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
      setSelectedFiles([]);
      queryClient.invalidateQueries(); // Refresh all data
      toast({
        title: "Multi-Part Restore Complete",
        description: "Your multi-part backup has been restored successfully",
      });
    },
    onError: (error) => {
      setRestoreProgress(null);
      toast({
        title: "Multi-Part Restore Failed",
        description: error instanceof Error ? error.message : "Failed to restore multi-part backup",
        variant: "destructive",
      });
    }
  });

  const handleSingleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Check file size (20MB limit)
      const maxSize = 20 * 1024 * 1024; // 20MB in bytes
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `Backup file must be smaller than 20MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
          variant: "destructive",
        });
        return;
      }
      
      restoreBackupMutation.mutate(file);
    }
  };

  const handleMultiFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    // Validate all files are ZIP files
    const invalidFiles = files.filter(file => !file.name.endsWith('.zip'));
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid Files",
        description: "All files must be ZIP files",
        variant: "destructive",
      });
      return;
    }
    
    // Check individual file sizes (20MB limit each)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Files Too Large",
        description: `Each backup part must be smaller than 20MB. Found ${oversizedFiles.length} oversized file(s).`,
        variant: "destructive",
      });
      return;
    }
    
    // Sort files by name to ensure proper order (part1, part2, etc.)
    const sortedFiles = files.sort((a, b) => {
      const aMatch = a.name.match(/part(\d+)/i);
      const bMatch = b.name.match(/part(\d+)/i);
      
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }
      
      return a.name.localeCompare(b.name);
    });
    
    setSelectedFiles(sortedFiles);
    
    toast({
      title: "Files Selected",
      description: `Selected ${sortedFiles.length} backup parts. Ready to restore.`,
    });
  };

  const handleStartMultiPartRestore = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select backup files first",
        variant: "destructive",
      });
      return;
    }
    
    restoreMultiPartMutation.mutate(selectedFiles);
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    if (multiFileInputRef.current) {
      multiFileInputRef.current.value = '';
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

          {/* Restore Mode Selection */}
          <div className="space-y-4">
            <h4 className="font-medium">Restore Mode:</h4>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="single-mode"
                  name="restore-mode"
                  checked={restoreMode === 'single'}
                  onChange={() => {
                    setRestoreMode('single');
                    clearSelectedFiles();
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="single-mode" className="flex items-center gap-2">
                  <FileArchive className="h-4 w-4" />
                  Single Backup File
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="multi-mode"
                  name="restore-mode"
                  checked={restoreMode === 'multi'}
                  onChange={() => {
                    setRestoreMode('multi');
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="multi-mode" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Multi-Part Backup (Large Files)
                </Label>
              </div>
            </div>
          </div>

          <Separator />

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
              {/* Single File Mode */}
              {restoreMode === 'single' && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleSingleFileSelect}
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
                        Select Single Backup File
                      </>
                    )}
                  </Button>
                </>
              )}

              {/* Multi-Part Mode */}
              {restoreMode === 'multi' && (
                <>
                  <input
                    type="file"
                    ref={multiFileInputRef}
                    onChange={handleMultiFileSelect}
                    accept=".zip"
                    multiple
                    className="hidden"
                  />
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => multiFileInputRef.current?.click()}
                      disabled={restoreMultiPartMutation.isPending}
                      className="w-full"
                      size="lg"
                      variant="outline"
                    >
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Select Multiple Backup Parts
                    </Button>
                    
                    {selectedFiles.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100">
                              Selected Files ({selectedFiles.length} parts):
                            </h4>
                            <div className="mt-2 space-y-1">
                              {selectedFiles.map((file, index) => (
                                <div key={index} className="text-sm text-blue-700 dark:text-blue-300 flex justify-between">
                                  <span>• {file.name}</span>
                                  <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 flex gap-2">
                              <Button
                                onClick={handleStartMultiPartRestore}
                                disabled={restoreMultiPartMutation.isPending}
                                size="sm"
                              >
                                {restoreMultiPartMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Restoring...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Start Restore
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={clearSelectedFiles}
                                disabled={restoreMultiPartMutation.isPending}
                                size="sm"
                                variant="outline"
                              >
                                Clear Selection
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Important:</h4>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                      <li>• Only upload backup files created by this system</li>
                      <li>• Each backup part must be smaller than 20MB</li>
                      {restoreMode === 'multi' && (
                        <>
                          <li>• For multi-part: Select all parts (backup-part1.zip, backup-part2.zip, etc.)</li>
                          <li>• Parts will be automatically sorted and combined</li>
                        </>
                      )}
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