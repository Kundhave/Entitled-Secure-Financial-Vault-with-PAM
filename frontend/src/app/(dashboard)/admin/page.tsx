'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  listVaultItems,
  getPendingRequests,
  decideRequest,
  accessVaultItem,
  getQRCode,
} from '@/lib/api';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Shield, QrCode, AlertCircle, Timer, Check, X } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // MFA modal
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [totpToken, setTotpToken] = useState('');
  const [vaultForAccess, setVaultForAccess] = useState('');

  // Vault data view
  const [showVaultData, setShowVaultData] = useState(false);
  const [vaultData, setVaultData] = useState<any>(null);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // QR Code modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQRCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.push('/');
      return;
    }
    loadData();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sessionExpiry) {
      timer = setInterval(() => {
        const now = new Date();
        const left = Math.max(0, Math.floor((sessionExpiry.getTime() - now.getTime()) / 1000));
        setTimeLeft(left);

        if (now >= sessionExpiry) {
          setShowVaultData(false);
          setVaultData(null);
          setSessionExpiry(null);
          toast.warning('Your privileged session has expired.');
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sessionExpiry]);

  const loadData = async () => {
    try {
      const [items, requests] = await Promise.all([
        listVaultItems(),
        getPendingRequests(),
      ]);
      setVaultItems(items);
      setPendingRequests(requests);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (requestId: string, decision: string) => {
    try {
      await decideRequest(requestId, decision);
      toast.success(`Request ${decision}d successfully!`);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to process request');
    }
  };

  const initiateAccess = (vaultId: string) => {
    setVaultForAccess(vaultId);
    setShowMFAModal(true);
  };

  const submitMFA = async () => {
    try {
      const data = await accessVaultItem(vaultForAccess, totpToken);
      setVaultData(data);
      setSessionExpiry(new Date(Date.now() + 3 * 60 * 1000)); // 3 minutes from now
      setShowMFAModal(false);
      setShowVaultData(true);
      setTotpToken('');
      toast.success('Access granted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'MFA verification failed');
    }
  };

  const loadQRCode = async () => {
    try {
      const data = await getQRCode();
      setQRCode(data.qr_code_base64);
      setTotpSecret(data.secret);
      setShowQRModal(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load QR code');
    }
  };

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
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <Button onClick={loadQRCode} variant="outline" size="sm" className="gap-2">
          <QrCode className="h-4 w-4" />
          Setup MFA
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Privileged Access View */}
      {showVaultData && vaultData && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-amber-700 dark:text-amber-500">Privileged Session Active</CardTitle>
              <CardDescription>
                Viewing sensitive data for <span className="font-semibold">{vaultData.vault_item.title}</span>
              </CardDescription>
            </div>
            {sessionExpiry && (
              <Badge variant="warning" className="text-sm px-3 py-1 flex items-center gap-2">
                <Timer className="h-4 w-4" />
                {timeLeft}s remaining
              </Badge>
            )}
          </CardHeader>
          <CardContent className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investment Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vaultData.records.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.investment_name}</TableCell>
                    <TableCell>${record.invested_amount.toLocaleString()}</TableCell>
                    <TableCell>{record.investment_date}</TableCell>
                    <TableCell>{record.instrument_type}</TableCell>
                    <TableCell>{record.remarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => {
                  setShowVaultData(false);
                  setVaultData(null);
                  setSessionExpiry(null);
                }}
                variant="secondary"
              >
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Access Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Access Requests</CardTitle>
          <CardDescription>Review and manage access requests from employees.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Vault</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.employee_username}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      {req.vault_item_title}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={req.reason}>
                    {req.reason}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => handleDecision(req.id, 'approve')}
                        variant="success"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDecision(req.id, 'reject')}
                        variant="destructive"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Reject"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pendingRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                    No pending requests at this time.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* All Vault Items (Admin Access) */}
      <Card>
        <CardHeader>
          <CardTitle>Vault Access</CardTitle>
          <CardDescription>
            Direct access to all vault items. Activity is audit logged.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vault Title</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vaultItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      {item.title}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => initiateAccess(item.id)}
                      variant="success"
                      size="sm"
                    >
                      Access Data
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MFA Modal */}
      <Dialog open={showMFAModal} onOpenChange={setShowMFAModal}>
        <DialogHeader>
          <DialogTitle>MFA Verification</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code from your authenticator app.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex justify-center my-4">
              <Shield className="h-12 w-12 text-primary/20" />
            </div>
            <Input
              className="text-center text-2xl tracking-widest"
              value={totpToken}
              onChange={(e) => setTotpToken(e.target.value)}
              placeholder="000000"
              maxLength={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowMFAModal(false)}>Cancel</Button>
          <Button onClick={submitMFA} disabled={totpToken.length !== 6}>Verify & Access</Button>
        </DialogFooter>
      </Dialog>

      {/* QR Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogHeader>
          <DialogTitle>Setup MFA</DialogTitle>
          <DialogDescription>
            Scan this QR code with Microsoft Authenticator.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-white p-4 rounded-lg">
            {qrCode && <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="max-w-[200px]" />}
          </div>
          <div className="text-center w-full">
            <p className="text-xs text-muted-foreground mb-2">Manual entry code</p>
            <code className="block w-full bg-muted p-2 rounded text-xs break-all">
              {totpSecret}
            </code>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setShowQRModal(false)}>Done</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
