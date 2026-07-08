'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

type OrganizationType = 'hospital' | 'facility';

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'type' | 'action'>('type');
  const [selectedType, setSelectedType] = useState<OrganizationType | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // For Create Org
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');

  // For Join Org
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data && data.organizationId) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Failed to check user status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [router]);

  const handleTypeSelect = (type: OrganizationType) => {
    setSelectedType(type);
    setActiveTab('action');
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/onboarding/create-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName, slug: orgSlug, type: selectedType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create organization');

      setMessage({ text: 'Organization created successfully!', type: 'success' });
      // Refresh to get updated user data
      setTimeout(() => window.location.href = '/dashboard', 1000);
    } catch (err: unknown) {
      setMessage({ text: err.message, type: 'error' });
      setIsLoading(false);
    }
  };

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // First validate the invite code
      const validateRes = await fetch(`/api/invite-codes/validate?code=${inviteCode}`);
      const validateData = await validateRes.json();
      if (!validateRes.ok) throw new Error(validateData.error || 'Failed to validate code');

      if (!validateData.valid) throw new Error(validateData.reason);

      // Now create the join request
      const joinRes = await fetch('/api/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: validateData.organization.id,
          inviteCodeId: validateData.inviteCode.id,
        }),
      });

      const joinData = await joinRes.json();
      if (!joinRes.ok) throw new Error(joinData.error || 'Failed to submit request');

      setMessage({ text: 'Join request submitted! Waiting for approval.', type: 'success' });
    } catch (err: unknown) {
      setMessage({ text: err.message, type: 'error' });
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Welcome to CareBridge</CardTitle>
        <CardDescription>Let&apos;s get you set up</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {activeTab === 'type' && (
          <div className="space-y-4">
            <Label className="text-lg">What type of organization are you with?</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="secondary"
                className="h-24 flex flex-col gap-2"
                onClick={() => handleTypeSelect('hospital')}
              >
                <span className="text-2xl">🏥</span>
                <span>Hospital</span>
              </Button>
              <Button
                variant="secondary"
                className="h-24 flex flex-col gap-2"
                onClick={() => handleTypeSelect('facility')}
              >
                <span className="text-2xl">🏠</span>
                <span>Facility</span>
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'action' && selectedType && (
          <Tabs defaultValue="create">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="join">Join Existing</TabsTrigger>
            </TabsList>
            <TabsContent value="create" className="space-y-4 mt-4">
              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g., Mercy General Hospital"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-slug">Short Name (URL-friendly)</Label>
                  <Input
                    id="org-slug"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'))}
                    placeholder="e.g., mercy-general"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Organization
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="join" className="space-y-4 mt-4">
              <form onSubmit={handleJoinOrg} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter invite code"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Join Organization
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
