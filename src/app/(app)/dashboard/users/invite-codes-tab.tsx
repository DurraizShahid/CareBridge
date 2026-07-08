'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface InviteCode {
  id: string;
  code: string;
  role?: string | null;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date | null;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export function InviteCodesTab({ inviteCodes, canManage }: { inviteCodes: InviteCode[]; canManage: boolean }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          maxUses: maxUses ? parseInt(maxUses) : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create invite code');

      toast.success('Invite code created successfully!');
      setIsCreateOpen(false);
      // Refresh the page to show new code
      window.location.reload();
    } catch (err) {
      toast.error('Failed to create invite code');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Invite Codes</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Invite Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invite Code</DialogTitle>
                <DialogDescription>
                  Generate an invite code to let others join your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Role (Optional)</Label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="social-worker">Social Worker</SelectItem>
                      <SelectItem value="discharge-planner">Discharge Planner</SelectItem>
                      <SelectItem value="facility-coordinator">Facility Coordinator</SelectItem>
                      <SelectItem value="administrator">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Uses (Optional)</Label>
                  <Input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Invite Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inviteCodes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono">
                    {code.code}
                  </TableCell>
                  <TableCell>
                    {code.role ? code.role.replace(/_/g, '-') : 'Default'}
                  </TableCell>
                  <TableCell>
                    {code.usedCount}
                    {code.maxUses ? ` / ${code.maxUses}` : ''}
                  </TableCell>
                  <TableCell>
                    {code.createdBy.firstName} {code.createdBy.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={code.isActive ? 'default' : 'destructive'}>
                      {code.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="secondary" onClick={() => handleCopy(code.code)}>
                      {copiedCode === code.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {inviteCodes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No invite codes yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
