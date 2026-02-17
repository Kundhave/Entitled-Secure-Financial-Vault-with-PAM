'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  listVaultItems,
  listAdmins,
  createAccessRequest,
  getMyRequests,
  accessVaultItem,
  getQRCode,
  endSession,
  createVaultRecord,
} from '@/lib/api';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
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
import { AlertCircle, QrCode, Shield, Timer, Plus } from 'lucide-react';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [reason, setReason] = useState('');
  const [accessType, setAccessType] = useState('read'); // 'read' or 'write'

  // MFA modal
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [totpToken, setTotpToken] = useState('');
  const [vaultForAccess, setVaultForAccess] = useState('');

  // Vault data view
  const [showVaultData, setShowVaultData] = useState(false);
  const [vaultData, setVaultData] = useState<any>(null);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionAccessType, setSessionAccessType] = useState<string>('read'); // Track session access type
  const [timeLeft, setTimeLeft] = useState(0);

  // QR Code modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQRCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');

  // Add Record modal
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    investment_name: '',
    invested_amount: '',
    investment_date: new Date().toISOString().split('T')[0],
    instrument_type: '',
    remarks: ''
  });

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'employee') {
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

  useEffect(() => {
    if (!showVaultData && sessionId) {
      endSession(sessionId).catch(err => {
        console.error("Failed to end session:", err);
      });
      setSessionId(null);
    }
  }, [showVaultData, sessionId]);

  const loadData = async () => {
    try {
      const [items, adminList, requests] = await Promise.all([
        listVaultItems(),
        listAdmins(),
        getMyRequests(),
      ]);
      setVaultItems(items);
      setAdmins(adminList);
      setMyRequests(requests);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = (vaultId: string) => {
    setSelectedVaultId(vaultId);
    setAccessType('read'); // Reset to default
    setShowRequestModal(true);
  };

  const submitRequest = async () => {
    try {
      await createAccessRequest(selectedVaultId, selectedAdminId, reason, accessType);
      toast.success('Access request submitted successfully!');
      setShowRequestModal(false);
      setReason('');
      setSelectedAdminId('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit request');
    }
  };

  const initiateAccess = (vaultId: string) => {
    setVaultForAccess(vaultId);
    setShowMFAModal(true);
  };

  const submitMFA = async () => {
    try {
      const data = await accessVaultItem(vaultForAccess, totpToken);

      // Look up the approved request to get access_type
      const approvedRequest = myRequests.find(
        r => r.vault_item_id === vaultForAccess && r.status === 'approved'
      );
      const accessType = approvedRequest?.access_type || 'read';

      setVaultData(data);
      setSessionId(data.session_id);
      setSessionAccessType(accessType); // Store the access type
      setSessionExpiry(new Date(Date.now() + 3 * 60 * 1000)); // 3 minutes
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

  const handleCreateRecord = async () => {
    try {
      // Validate
      if (!newRecord.investment_name || !newRecord.invested_amount || !newRecord.investment_date || !newRecord.instrument_type) {
        toast.error('Please fill in all required fields');
        return;
      }

      const payload = {
        ...newRecord,
        invested_amount: parseFloat(newRecord.invested_amount)
      };

      if (isNaN(payload.invested_amount) || payload.invested_amount <= 0) {
        toast.error('Amount must be a positive number');
        return;
      }

      await createVaultRecord(vaultData.vault_item.id, payload);
      toast.success('Record added successfully');
      setShowAddRecordModal(false);

      // Reset form
      setNewRecord({
        investment_name: '',
        invested_amount: '',
        investment_date: new Date().toISOString().split('T')[0],
        instrument_type: '',
        remarks: ''
      });

    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add record');
    }
  };

  const handleCloseVault = () => {
    setShowVaultData(false);
    setVaultData(null);
    setSessionExpiry(null);
    setSessionAccessType('read'); // Reset access type
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      case 'pending': return 'warning';
      default: return 'default';
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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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

            <div className="flex items-center gap-4">
              {/* Check if current session has write access */}
              {sessionAccessType === 'write' && (
                <Button onClick={() => setShowAddRecordModal(true)} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Record
                </Button>
              )}

              {sessionExpiry && (
                <Badge variant="warning" className="text-sm px-3 py-1 flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  {timeLeft}s remaining
                </Badge>
              )}
            </div>
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
              <Button onClick={handleCloseVault} variant="secondary">
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Available Vault Items */}
        <Card>
          <CardHeader>
            <CardTitle>Available Vault Items</CardTitle>
            <CardDescription>Secure data vaults you can request access to.</CardDescription>
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
                {vaultItems.map((item) => {
                  const approvedRequest = myRequests.find(
                    (req) => req.vault_item_id === item.id && req.status === 'approved'
                  );
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          {item.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {approvedRequest ? (
                          <Button
                            onClick={() => initiateAccess(item.id)}
                            variant="success"
                            size="sm"
                            title={approvedRequest.access_type === 'write' ? 'Write Access Approved' : 'Read Access Approved'}
                          >
                            Access Data
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleRequestAccess(item.id)}
                            variant="default"
                            size="sm"
                          >
                            Request Access
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* My Requests */}
        <Card>
          <CardHeader>
            <CardTitle>My Access Requests</CardTitle>
            <CardDescription>Status of your recent access requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vault</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{req.vault_item_title}</span>
                        {req.access_type === 'write' && (
                          <span className="text-xs text-amber-600 font-semibold">Write Access</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(req.status)}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {myRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                      No requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogHeader>
          <DialogTitle>Request Access</DialogTitle>
          <DialogDescription>
            Submit a request to an administrator for access to this vault.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Select Admin</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
            >
              <option value="">Select an admin...</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.username}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Access Type</label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted w-full">
                <input
                  type="radio"
                  name="accessType"
                  value="read"
                  checked={accessType === 'read'}
                  onChange={(e) => setAccessType(e.target.value)}
                  className="accent-primary h-4 w-4"
                />
                <span className="text-sm">Read Only</span>
              </label>
              <label className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted w-full">
                <input
                  type="radio"
                  name="accessType"
                  value="write"
                  checked={accessType === 'write'}
                  onChange={(e) => setAccessType(e.target.value)}
                  className="accent-primary h-4 w-4"
                />
                <span className="text-sm">Write (Add Records)</span>
              </label>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Reason</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need access?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowRequestModal(false)}>Cancel</Button>
          <Button onClick={submitRequest} disabled={!selectedAdminId || !reason}>Submit Request</Button>
        </DialogFooter>
      </Dialog>

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

      {/* Add Record Modal */}
      <Dialog open={showAddRecordModal} onOpenChange={setShowAddRecordModal}>
        <DialogHeader>
          <DialogTitle>Add Vault Record</DialogTitle>
          <DialogDescription>
            Add a new encrypted record to this vault.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Investment Name</label>
              <Input
                value={newRecord.investment_name}
                onChange={(e) => setNewRecord({ ...newRecord, investment_name: e.target.value })}
                placeholder="e.g. Apple Stock"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                value={newRecord.invested_amount}
                onChange={(e) => setNewRecord({ ...newRecord, invested_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={newRecord.investment_date}
                onChange={(e) => setNewRecord({ ...newRecord, investment_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Type</label>
              <Input
                value={newRecord.instrument_type}
                onChange={(e) => setNewRecord({ ...newRecord, instrument_type: e.target.value })}
                placeholder="e.g. Equity, Bond"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Remarks</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={newRecord.remarks}
              onChange={(e) => setNewRecord({ ...newRecord, remarks: e.target.value })}
              placeholder="Additional details..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowAddRecordModal(false)}>Cancel</Button>
          <Button onClick={handleCreateRecord}>Add Record</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}