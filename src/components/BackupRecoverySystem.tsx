/**
 * Backup & Recovery System
 * Sistema de backup e recuperação de dados
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Download,
  Upload,
  Database,
  Shield,
  Clock,
  HardDrive,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Archive,
  Settings,
  Cloud,
  Server
} from 'lucide-react';

interface BackupJob {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'config';
  status: 'running' | 'completed' | 'failed' | 'scheduled';
  created_at: string;
  completed_at?: string;
  size_bytes?: number;
  download_url?: string;
  error_message?: string;
}

interface BackupSchedule {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'config';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  enabled: boolean;
  last_run?: string;
  next_run?: string;
}

interface RecoveryPoint {
  id: string;
  timestamp: string;
  type: 'manual' | 'scheduled' | 'auto';
  size_bytes: number;
  status: 'available' | 'corrupted' | 'expired';
  description: string;
}

const BackupRecoverySystem = () => {
  const [backups, setBackups] = useState<BackupJob[]>([]);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [recoveryPoints, setRecoveryPoints] = useState<RecoveryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState<string | null>(null);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      setLoading(true);

      // Load backup jobs
      const mockBackups: BackupJob[] = [
        {
          id: 'backup_001',
          name: 'Daily Full Backup',
          type: 'full',
          status: 'completed',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
          size_bytes: 524288000, // 500MB
          download_url: 'https://example.com/backup-001.zip'
        },
        {
          id: 'backup_002',
          name: 'Config Backup',
          type: 'config',
          status: 'completed',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          size_bytes: 1048576, // 1MB
          download_url: 'https://example.com/config-backup.zip'
        },
        {
          id: 'backup_003',
          name: 'Weekly Incremental',
          type: 'incremental',
          status: 'running',
          created_at: new Date().toISOString()
        }
      ];

      // Load backup schedules
      const mockSchedules: BackupSchedule[] = [
        {
          id: 'schedule_001',
          name: 'Daily Full Backup',
          type: 'full',
          frequency: 'daily',
          time: '02:00',
          enabled: true,
          last_run: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'schedule_002',
          name: 'Weekly Config Backup',
          type: 'config',
          frequency: 'weekly',
          time: '03:00',
          enabled: true,
          last_run: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          next_run: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      // Load recovery points
      const mockRecoveryPoints: RecoveryPoint[] = [
        {
          id: 'recovery_001',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          type: 'scheduled',
          size_bytes: 524288000,
          status: 'available',
          description: 'Daily full backup - all data preserved'
        },
        {
          id: 'recovery_002',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'manual',
          size_bytes: 262144000,
          status: 'available',
          description: 'Manual backup before major changes'
        },
        {
          id: 'recovery_003',
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'scheduled',
          size_bytes: 524288000,
          status: 'expired',
          description: 'Monthly backup - expired after 30 days'
        }
      ];

      setBackups(mockBackups);
      setSchedules(mockSchedules);
      setRecoveryPoints(mockRecoveryPoints);

    } catch (error) {
      console.error('Error loading backup data:', error);
      toast({
        title: "Error",
        description: "Failed to load backup data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (type: 'full' | 'incremental' | 'config') => {
    const backupId = `backup_${Date.now()}`;
    setBackupInProgress(backupId);

    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newBackup: BackupJob = {
        id: backupId,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Backup`,
        type,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        size_bytes: type === 'config' ? 1048576 : 524288000,
        download_url: `https://example.com/${backupId}.zip`
      };

      setBackups(prev => [newBackup, ...prev]);

      toast({
        title: "Backup Created",
        description: `${type} backup completed successfully`
      });
    } catch (error) {
      const failedBackup: BackupJob = {
        id: backupId,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Backup`,
        type,
        status: 'failed',
        created_at: new Date().toISOString(),
        error_message: 'Backup creation failed'
      };

      setBackups(prev => [failedBackup, ...prev]);

      toast({
        title: "Backup Failed",
        description: "Failed to create backup",
        variant: "destructive"
      });
    } finally {
      setBackupInProgress(null);
    }
  };

  const restoreFromBackup = async (backupId: string) => {
    setRestoreInProgress(true);
    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 5000));

      toast({
        title: "Restore Completed",
        description: "Data has been successfully restored"
      });
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Failed to restore data",
        variant: "destructive"
      });
    } finally {
      setRestoreInProgress(false);
    }
  };

  const downloadBackup = (backup: BackupJob) => {
    if (backup.download_url) {
      // In a real implementation, this would trigger the actual download
      toast({
        title: "Download Started",
        description: `Downloading ${backup.name}`
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'scheduled':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
      case 'available':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Available</Badge>;
      case 'corrupted':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Corrupted</Badge>;
      case 'expired':
        return <Badge variant="secondary"><Archive className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalStorageUsed = backups.reduce((sum, backup) => sum + (backup.size_bytes || 0), 0);
  const activeBackups = backups.filter(b => b.status === 'completed').length;
  const failedBackups = backups.filter(b => b.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Backup & Recovery</h2>
          <p className="text-muted-foreground">Secure your data with automated backups and easy recovery</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadBackupData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalStorageUsed)}</div>
            <p className="text-xs text-muted-foreground">Across all backups</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Backups</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBackups}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Backups</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedBackups}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Backup</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoBackupEnabled}
                onCheckedChange={setAutoBackupEnabled}
              />
              <span className="text-sm font-medium">
                {autoBackupEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="backups">Backup Jobs</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="recovery">Recovery Points</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Backup Jobs</h3>
            <div className="flex gap-2">
              <Button
                onClick={() => createBackup('config')}
                disabled={!!backupInProgress}
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                Config Backup
              </Button>
              <Button
                onClick={() => createBackup('incremental')}
                disabled={!!backupInProgress}
                variant="outline"
              >
                <Database className="h-4 w-4 mr-2" />
                Incremental
              </Button>
              <Button
                onClick={() => createBackup('full')}
                disabled={!!backupInProgress}
              >
                <Shield className="h-4 w-4 mr-2" />
                Full Backup
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {backups.map((backup) => (
              <Card key={backup.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      <CardTitle className="text-lg">{backup.name}</CardTitle>
                    </div>
                    {getStatusBadge(backup.status)}
                  </div>
                  <CardDescription>
                    Created: {new Date(backup.created_at).toLocaleString()}
                    {backup.completed_at && ` • Completed: ${new Date(backup.completed_at).toLocaleString()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{backup.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-medium">
                        {backup.size_bytes ? formatBytes(backup.size_bytes) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {backup.completed_at
                          ? `${Math.round((new Date(backup.completed_at).getTime() - new Date(backup.created_at).getTime()) / 1000)}s`
                          : backup.status === 'running' ? 'In progress...' : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Actions</p>
                      <div className="flex gap-2 mt-1">
                        {backup.status === 'completed' && backup.download_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBackup(backup)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}
                        {backup.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restoreFromBackup(backup.id)}
                            disabled={restoreInProgress}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {backup.error_message && (
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{backup.error_message}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Backup Schedules</h3>
            <Button>
              <Clock className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>

          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <CardTitle className="text-lg">{schedule.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={schedule.enabled} />
                      <Badge variant={schedule.enabled ? "default" : "secondary"}>
                        {schedule.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {schedule.frequency} at {schedule.time}
                    {schedule.next_run && ` • Next run: ${new Date(schedule.next_run).toLocaleString()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{schedule.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frequency</p>
                      <p className="font-medium capitalize">{schedule.frequency}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Run</p>
                      <p className="font-medium">
                        {schedule.last_run ? new Date(schedule.last_run).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Actions</p>
                      <Button size="sm" variant="outline" className="mt-1">
                        <Settings className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recovery Points</h3>
            <Button variant="outline">
              <Archive className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Recovery points allow you to restore your system to a previous state.
              Always test recovery procedures in a safe environment before applying to production.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {recoveryPoints.map((point) => (
              <Card key={point.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Archive className="h-5 w-5" />
                      <CardTitle className="text-lg">
                        {new Date(point.timestamp).toLocaleString()}
                      </CardTitle>
                    </div>
                    {getStatusBadge(point.status)}
                  </div>
                  <CardDescription>{point.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{point.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-medium">{formatBytes(point.size_bytes)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Age</p>
                      <p className="font-medium">
                        {Math.round((Date.now() - new Date(point.timestamp).getTime()) / (1000 * 60 * 60 * 24))} days ago
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Actions</p>
                      <div className="flex gap-2 mt-1">
                        {point.status === 'available' && (
                          <>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => restoreFromBackup(point.id)}
                              disabled={restoreInProgress}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Restore
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
              <CardDescription>Configure backup behavior and storage options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="retention-days">Backup Retention (Days)</Label>
                  <Input id="retention-days" type="number" defaultValue="30" />
                  <p className="text-sm text-muted-foreground">
                    How long to keep backup files
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage-location">Storage Location</Label>
                  <Select defaultValue="local">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local Storage</SelectItem>
                      <SelectItem value="cloud">Cloud Storage</SelectItem>
                      <SelectItem value="hybrid">Hybrid (Local + Cloud)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compression">Compression Level</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Compression</SelectItem>
                      <SelectItem value="low">Low Compression</SelectItem>
                      <SelectItem value="medium">Medium Compression</SelectItem>
                      <SelectItem value="high">High Compression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="encryption">Encryption</Label>
                  <Select defaultValue="aes256">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Encryption</SelectItem>
                      <SelectItem value="aes256">AES-256 Encryption</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="auto-cleanup" defaultChecked />
                <Label htmlFor="auto-cleanup">Automatically clean up old backups</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="email-notifications" defaultChecked />
                <Label htmlFor="email-notifications">Email notifications for backup failures</Label>
              </div>

              <Button className="w-full">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Restore Warning */}
      {restoreInProgress && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <strong>Restore in Progress:</strong> System data is being restored.
            This process may take several minutes. Do not close this page.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export { BackupRecoverySystem };