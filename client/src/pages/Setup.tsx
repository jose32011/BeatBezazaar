import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';

type Status = {
  configured: boolean;
  canConnect: boolean;
  adminExists: boolean;
};

export default function SetupPage() {
  const { toast } = useToast();
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<any>({
    dbHost: 'localhost',
    dbPort: 3306,
    dbUser: 'root',
    dbPassword: '',
    dbName: 'beatbazaar',
    adminUsername: 'admin',
    adminEmail: '',
    adminPassword: ''
  });

  const [auth, setAuth] = useState<any>({ existingAdminUsername: '', existingAdminPassword: '' });

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      setLoading(true);
      const res = await fetch('/api/setup/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      setError('Failed to check setup status');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrors({});
    // client-side validation
    const newErrors: Record<string, string> = {};
    if (!form.dbHost) newErrors.dbHost = 'Host is required';
    if (!form.dbUser) newErrors.dbUser = 'User is required';
    if (!form.dbName) newErrors.dbName = 'Database name is required';
    if (!form.adminUsername) newErrors.adminUsername = 'Admin username is required';
    if (!form.adminPassword) newErrors.adminPassword = 'Admin password is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const payload: any = { ...form };
      if (status?.configured) {
        payload.existingAdminUsername = auth.existingAdminUsername;
        payload.existingAdminPassword = auth.existingAdminPassword;
      }

      const res = await fetch('/api/setup/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to configure');
        toast({ title: 'Setup Error', description: data.error || 'Failed to configure', variant: 'destructive' });
      } else {
        toast({ title: 'Saved', description: data.adminCreated ? 'Admin user created. Restart server to apply DB changes.' : 'Settings updated. Restart server to apply changes.' });
        // reload so server picks up .env changes (user may need to restart)
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (e) {
      setError('Failed to configure setup');
      toast({ title: 'Setup Error', description: 'Failed to configure setup', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  // basic local validation: require host, user, dbname and admin creds for initial setup
  const canSubmit = Boolean(
    form.dbHost && form.dbUser && form.dbName && form.adminUsername && form.adminPassword
  );

  async function handleTestStatus() {
    // Call server endpoint to test provided DB credentials
    setErrors({});
    try {
      setLoading(true);
      const res = await fetch('/api/setup/check-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbHost: form.dbHost, dbPort: form.dbPort, dbUser: form.dbUser, dbPassword: form.dbPassword, dbName: form.dbName })
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Connection Test Failed', description: data.error || 'Failed to connect', variant: 'destructive' });
        // map common errors to fields
        if (data.error && /host|user|database|access/i.test(data.error)) {
          setErrors({ dbHost: data.error });
        }
      } else {
        if (data.canConnect) {
          if (data.databaseExists) {
            toast({ title: 'Connection OK', description: 'Connected and database exists.' });
          } else {
            toast({ title: 'Connected', description: 'Server reachable and credentials valid, database does not exist.' });
          }
        } else {
          toast({ title: 'Connection Failed', description: 'Could not connect with provided credentials', variant: 'destructive' });
        }
        // also refresh status card
        await fetchStatus();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to test connection', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (loading && !status) return <div className="p-6">Checking setup status...</div>;

  return (
    <div className="min-h-screen" style={{ background: themeColors.background }}>
      <div className="w-full px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display">Setup</h1>
            <p className="text-sm text-muted-foreground">Quickly configure MySQL and create an initial admin account.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Form (left) */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>{status?.configured ? 'Update Database Settings' : 'Initial Setup'}</CardTitle>
                <CardDescription>{status?.configured ? 'Authenticate as admin to update connection settings.' : 'Provide connection details and an initial admin account.'}</CardDescription>
              </CardHeader>
              <CardContent>
                {error && <div className="mb-4 text-red-600">{error}</div>}

                {status?.configured && (
                  <div className="mb-4">
                    <p className="mb-2">To change DB settings authenticate as an existing admin:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <Label>Admin username</Label>
                        <Input value={auth.existingAdminUsername} onChange={e => setAuth({ ...auth, existingAdminUsername: e.target.value })} />
                      </div>
                      <div>
                        <Label>Admin password</Label>
                        <Input type="password" value={auth.existingAdminPassword} onChange={e => setAuth({ ...auth, existingAdminPassword: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Database Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Host</Label>
                        <Input value={form.dbHost} onChange={e => setForm({ ...form, dbHost: e.target.value })} />
                        <p className="text-xs text-muted-foreground mt-1">Example: localhost or your-railway-host.internal</p>
                        {errors.dbHost && <p className="text-sm text-red-500 mt-1">{errors.dbHost}</p>}
                      </div>
                      <div>
                        <Label>Port</Label>
                        <Input value={String(form.dbPort)} onChange={e => setForm({ ...form, dbPort: Number(e.target.value) })} />
                      </div>
                      <div>
                        <Label>User</Label>
                        <Input value={form.dbUser} onChange={e => setForm({ ...form, dbUser: e.target.value })} />
                        {errors.dbUser && <p className="text-sm text-red-500 mt-1">{errors.dbUser}</p>}
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input type="password" value={form.dbPassword} onChange={e => setForm({ ...form, dbPassword: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Database name</Label>
                        <Input value={form.dbName} onChange={e => setForm({ ...form, dbName: e.target.value })} />
                        {errors.dbName && <p className="text-sm text-red-500 mt-1">{errors.dbName}</p>}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Button variant="outline" onClick={handleTestStatus} disabled={loading}>Test status</Button>
                      <div className="text-sm text-muted-foreground">Click to refresh the current setup status. A full connection test runs on server when saving settings.</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Admin Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Admin username</Label>
                        <Input value={form.adminUsername} onChange={e => setForm({ ...form, adminUsername: e.target.value })} />
                        {errors.adminUsername && <p className="text-sm text-red-500 mt-1">{errors.adminUsername}</p>}
                      </div>
                      <div>
                        <Label>Admin email</Label>
                        <Input value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Admin password</Label>
                        <Input type="password" value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} />
                        {errors.adminPassword && <p className="text-sm text-red-500 mt-1">{errors.adminPassword}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Button type="submit" disabled={loading || !canSubmit}>{loading ? 'Saving...' : (status?.configured ? 'Update settings' : 'Create settings & admin')}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            {/* Status (right) */}
            <Card className="mb-6 w-full">
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
                <CardDescription>Server setup and database connection information</CardDescription>
              </CardHeader>
              <CardContent>
                {status ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded bg-white/60 dark:bg-slate-800/60">
                      <div className="text-sm text-muted-foreground">MySQL configured</div>
                      <div className="font-medium">{String(status.configured)}</div>
                    </div>
                    <div className="p-4 rounded bg-white/60 dark:bg-slate-800/60">
                      <div className="text-sm text-muted-foreground">Can connect</div>
                      <div className="font-medium">{String(status.canConnect)}</div>
                    </div>
                    <div className="p-4 rounded bg-white/60 dark:bg-slate-800/60">
                      <div className="text-sm text-muted-foreground">Admin exists</div>
                      <div className="font-medium">{String(status.adminExists)}</div>
                    </div>
                  </div>
                ) : (
                  <div>Not available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
