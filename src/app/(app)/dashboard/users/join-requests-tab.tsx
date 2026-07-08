'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface JoinRequest {
  id: string;
  status: string;
  createdAt: Date;
  reviewedAt?: Date | null;
  notes?: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  inviteCode?: {
    code: string;
    role?: string | null;
  } | null;
  reviewedBy?: {
    firstName: string;
    lastName: string;
  } | null;
}

export function JoinRequestsTab({ joinRequests, canManage }: { joinRequests: JoinRequest[]; canManage: boolean }) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'approve' | 'deny') => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/join-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) throw new Error(`Failed to ${action} request`);
      toast.success(`Request ${action}d successfully!`);
      window.location.reload();
    } catch {
      toast.error(`Failed to ${action} request`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'approved':
        return <Badge>Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Join Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Invite Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {joinRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {request.user.firstName} {request.user.lastName}
                  </TableCell>
                  <TableCell>{request.user.email}</TableCell>
                  <TableCell>
                    {request.inviteCode ? (
                      <span className="font-mono text-sm">{request.inviteCode.code}</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status)}
                  </TableCell>
                  <TableCell>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' && canManage && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction(request.id, 'approve')}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAction(request.id, 'deny')}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Deny
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {joinRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No join requests yet
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
