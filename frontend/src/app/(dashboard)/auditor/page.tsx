'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuditLogs } from '@/lib/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Search, ShieldAlert } from 'lucide-react';

export default function AuditorDashboard() {
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'auditor') {
      router.push('/');
      return;
    }
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const logs = await getAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (!filter) return true;
    const searchStr = filter.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchStr) ||
      log.actor_username.toLowerCase().includes(searchStr) ||
      (log.vault_item_title && log.vault_item_title.toLowerCase().includes(searchStr)) ||
      (log.target_username && log.target_username.toLowerCase().includes(searchStr))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Auditor Dashboard</h1>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Stats Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">Logged system actions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Actors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(auditLogs.map(l => l.actor_username)).size}
            </div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Risk Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter(l => l.action.includes('access') || l.action.includes('fail')).length}
            </div>
            <p className="text-xs text-muted-foreground">Access attempts & failures</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Comprehensive log of all system activities.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Vault Item</TableHead>
                  <TableHead>Target User</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-nowrap text-muted-foreground text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{log.actor_username}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.vault_item_title || '-'}</TableCell>
                    <TableCell>{log.target_username || '-'}</TableCell>
                    <TableCell>
                      {log.metadata ? (
                        <details className="group">
                          <summary className="cursor-pointer text-xs text-primary hover:underline list-none">
                            View JSON
                          </summary>
                          <pre className="mt-2 w-[200px] overflow-auto rounded bg-muted p-2 text-[10px] hidden group-open:block">
                            {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                          </pre>
                        </details>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                      No logs found matching your filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Showing {filteredLogs.length} of {auditLogs.length} events
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
