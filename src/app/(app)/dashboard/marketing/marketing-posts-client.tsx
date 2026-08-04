"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  RiAddLine,
  RiCalendarScheduleLine,
  RiCheckboxCircleLine,
  RiDraftLine,
  RiExternalLinkLine,
  RiLoader4Line,
  RiMegaphoneLine,
  RiPauseCircleLine,
  RiPlayCircleLine,
  RiRefreshLine,
  RiSendPlaneLine,
  RiUserAddLine,
} from "@remixicon/react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SocialPlatformIcon } from "@/components/marketing/social-platform-icons";
import { cn } from "@/lib/utils";
import {
  INITIAL_LOGS,
  LEAD_GEN_PATH,
  PLATFORM_LABELS,
  SAMPLE_LEADS,
  SAMPLE_POSTS,
  type AutomationLog,
  type MarketingPost,
  type PostStatus,
  type SampleLead,
  type SocialPlatform,
} from "./dummy-data";

const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  posting: "Posting",
  posted: "Posted",
  failed: "Failed",
};

const STATUS_BADGE: Record<PostStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-[var(--stat-info-bg)] text-[var(--stat-info)]",
  posting: "bg-[var(--stat-orange-bg)] text-[var(--stat-orange)]",
  posted: "bg-[var(--stat-health-bg)] text-[var(--stat-health)]",
  failed: "bg-destructive/10 text-destructive",
};

const LEAD_STATUS_BADGE: Record<SampleLead["status"], string> = {
  new: "bg-[var(--stat-info-bg)] text-[var(--stat-info)]",
  contacted: "bg-[var(--stat-orange-bg)] text-[var(--stat-orange)]",
  qualified: "bg-[var(--stat-health-bg)] text-[var(--stat-health)]",
};

const SAMPLE_IMAGES = SAMPLE_POSTS.map((p) => p.imageUrl);

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatRelative(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const seconds = Math.round(delta / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatWhen(iso);
}

function randomEngagement() {
  return {
    likes: 20 + Math.floor(Math.random() * 90),
    comments: 2 + Math.floor(Math.random() * 12),
    shares: 3 + Math.floor(Math.random() * 20),
  };
}

export function MarketingPostsClient() {
  const [posts, setPosts] = useState<MarketingPost[]>(SAMPLE_POSTS);
  const [logs, setLogs] = useState<AutomationLog[]>(INITIAL_LOGS);
  const [leads] = useState<SampleLead[]>(SAMPLE_LEADS);
  const [automationOn, setAutomationOn] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PostStatus | "all">("all");
  const [tick, setTick] = useState(0);
  const postsRef = useRef(posts);
  postsRef.current = posts;

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!automationOn) return;

    const now = Date.now();
    const current = postsRef.current;
    const transitions: AutomationLog[] = [];
    let changed = false;

    const next = current.map((post) => {
      if (post.status === "scheduled" && new Date(post.scheduledAt).getTime() <= now) {
        changed = true;
        return { ...post, status: "posting" as const };
      }
      if (post.status === "posting") {
        const started = new Date(post.scheduledAt).getTime();
        if (now - started >= 2500) {
          changed = true;
          const postedAt = new Date().toISOString();
          transitions.push({
            id: `log-${postedAt}-${post.id}`,
            postId: post.id,
            message: `Auto-posted to ${post.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")} · ${post.campaign}`,
            timestamp: postedAt,
            tone: "success",
          });
          return {
            ...post,
            status: "posted" as const,
            postedAt,
            engagement: randomEngagement(),
          };
        }
      }
      return post;
    });

    if (!changed) return;
    setPosts(next);
    if (transitions.length > 0) {
      setLogs((prev) => [...transitions, ...prev]);
    }
  }, [automationOn, tick]);

  const stats = useMemo(() => {
    const posted = posts.filter((p) => p.status === "posted").length;
    const scheduled = posts.filter((p) => p.status === "scheduled" || p.status === "posting").length;
    const drafts = posts.filter((p) => p.status === "draft").length;
    const reach = posts.reduce(
      (sum, p) => sum + (p.engagement?.likes ?? 0) + (p.engagement?.shares ?? 0) * 3,
      0,
    );
    return { posted, scheduled, drafts, reach, leads: leads.length };
  }, [posts, leads.length]);

  const filtered = useMemo(() => {
    const list =
      statusFilter === "all"
        ? posts
        : posts.filter((p) => p.status === statusFilter);
    return [...list].sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    );
  }, [posts, statusFilter]);

  function scheduleDraft(postId: string) {
    const scheduledAt = new Date(Date.now() + 12_000).toISOString();
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, status: "scheduled", scheduledAt, postedAt: null, engagement: null }
          : post,
      ),
    );
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-schedule`,
        postId,
        message: "Draft queued for auto-publish in ~12s",
        timestamp: new Date().toISOString(),
        tone: "info",
      },
      ...prev,
    ]);
  }

  function addSamplePost() {
    const id = `mp-${Date.now()}`;
    const scheduledAt = new Date(Date.now() + 15_000).toISOString();
    const post: MarketingPost = {
      id,
      title: "New sample post",
      body: "Dummy content ready for social automation — CareBridge keeps referrals moving while your team focuses on patients.",
      imageUrl: SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)] ?? "/social-media/01_connected_care.png",
      platforms: ["linkedin", "x"],
      status: "scheduled",
      scheduledAt,
      postedAt: null,
      engagement: null,
      campaign: "Demo Queue",
      leadGenUrl: LEAD_GEN_PATH,
    };
    setPosts((current) => [post, ...current]);
    setLogs((prev) => [
      {
        id: `log-${Date.now()}-add`,
        postId: id,
        message: "Sample post added to the automation queue",
        timestamp: new Date().toISOString(),
        tone: "info",
      },
      ...prev,
    ]);
  }

  function resetDemo() {
    setPosts(
      SAMPLE_POSTS.map((post) => {
        if (post.id === "mp-003") {
          return { ...post, status: "scheduled", scheduledAt: new Date(Date.now() + 8_000).toISOString(), postedAt: null, engagement: null };
        }
        if (post.id === "mp-004") {
          return { ...post, status: "scheduled", scheduledAt: new Date(Date.now() + 18_000).toISOString(), postedAt: null, engagement: null };
        }
        if (post.id === "mp-005") {
          return { ...post, status: "scheduled", scheduledAt: new Date(Date.now() + 28_000).toISOString(), postedAt: null, engagement: null };
        }
        if (post.id === "mp-006") {
          return { ...post, status: "scheduled", scheduledAt: new Date(Date.now() + 40_000).toISOString(), postedAt: null, engagement: null };
        }
        return { ...post };
      }),
    );
    setLogs([...INITIAL_LOGS]);
    setAutomationOn(true);
    setStatusFilter("all");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marketing Posts"
        description="Dummy automation queue — sample creatives from /public/social-media publish to social on a simulated schedule."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Marketing Posts" },
        ]}
      >
        <Button variant="outline" size="sm" render={<Link href={LEAD_GEN_PATH} target="_blank" />}>
          <RiExternalLinkLine data-icon className="size-4" />
          Lead page
        </Button>
        <Button variant="outline" size="sm" onClick={resetDemo}>
          <RiRefreshLine data-icon className="size-4" />
          Reset demo
        </Button>
        <Button size="sm" onClick={addSamplePost}>
          <RiAddLine data-icon className="size-4" />
          Add sample post
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Posted" value={stats.posted} icon={RiCheckboxCircleLine} hint="Live on social" />
        <StatTile label="In queue" value={stats.scheduled} icon={RiCalendarScheduleLine} hint="Scheduled / posting" />
        <StatTile label="Drafts" value={stats.drafts} icon={RiDraftLine} hint="Not yet queued" />
        <StatTile label="Est. reach" value={stats.reach} icon={RiMegaphoneLine} hint="Dummy engagement" />
        <StatTile label="Leads" value={stats.leads} icon={RiUserAddLine} hint="From social + /lead" />
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 flex flex-col gap-6">
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">Automation</CardTitle>
                  <CardDescription>
                    When enabled, scheduled posts move to posting, then posted — no backend required.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="automation-toggle"
                    checked={automationOn}
                    onCheckedChange={setAutomationOn}
                  />
                  <Label htmlFor="automation-toggle" className="text-sm font-medium">
                    {automationOn ? "Running" : "Paused"}
                  </Label>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-(--card-spacing)">
                <div className="flex flex-wrap items-center gap-2">
                  {(Object.keys(PLATFORM_LABELS) as SocialPlatform[]).map((platform) => (
                    <Badge key={platform} variant="outline" className="gap-1.5 px-2.5 py-1">
                      <SocialPlatformIcon platform={platform} className="size-5 rounded-md p-1" />
                      {PLATFORM_LABELS[platform]}
                      <span className="text-[10px] uppercase tracking-wide text-[var(--stat-health)]">
                        connected
                      </span>
                    </Badge>
                  ))}
                </div>
                <Separator />
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                  {automationOn ? (
                    <RiPlayCircleLine className="size-5 shrink-0 text-[var(--stat-health)]" />
                  ) : (
                    <RiPauseCircleLine className="size-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {automationOn ? "Auto-publish is live (demo)" : "Auto-publish paused"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cadence: every few seconds for queued sample posts · CTA links to {LEAD_GEN_PATH}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity</CardTitle>
                <CardDescription>Recent automation events</CardDescription>
              </CardHeader>
              <CardContent className="pb-(--card-spacing)">
                <ul className="space-y-3">
                  {logs.slice(0, 6).map((log) => (
                    <li key={log.id} className="flex gap-3">
                      <div
                        className={cn(
                          "mt-1 size-2 shrink-0 rounded-full",
                          log.tone === "success" && "bg-[var(--stat-health)]",
                          log.tone === "info" && "bg-[var(--stat-info)]",
                          log.tone === "warning" && "bg-[var(--stat-orange)]",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{log.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelative(log.timestamp)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Post queue</h3>
              <p className="text-xs text-muted-foreground">
                Sample creatives from public/social-media
              </p>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter((value ?? "all") as PostStatus | "all")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="posting">Posting</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onSchedule={() => scheduleDraft(post.id)}
              />
            ))}
            {filtered.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <RiMegaphoneLine className="size-8 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">No posts in this filter</p>
                  <p className="text-xs text-muted-foreground">
                    Try another status or reset the demo.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leads" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">Lead pipeline</CardTitle>
                <CardDescription>
                  Dummy inquiries from social CTAs and the public lead page.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" render={<Link href={LEAD_GEN_PATH} target="_blank" />}>
                <RiExternalLinkLine data-icon className="size-4" />
                Open lead page
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 pb-(--card-spacing)">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{lead.name}</p>
                      <Badge className={cn("border-0 capitalize", LEAD_STATUS_BADGE[lead.status])}>
                        {lead.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {lead.orgType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lead.role} · {lead.organization}
                    </p>
                    <p className="text-sm text-foreground">{lead.interest}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.email} · {lead.source} · {formatWhen(lead.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
          <div className="flex size-9 items-center justify-center rounded-full bg-muted">
            <Icon className="size-4 text-foreground" />
          </div>
        </div>
        <div>
          <p className="text-[28px] font-medium tracking-tight tabular-nums text-foreground">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PostCard({
  post,
  onSchedule,
}: {
  post: MarketingPost;
  onSchedule: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:aspect-square sm:w-36">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 144px"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("border-0", STATUS_BADGE[post.status])}>
              {post.status === "posting" && (
                <RiLoader4Line className="size-3 animate-spin" />
              )}
              {STATUS_LABELS[post.status]}
            </Badge>
            <Badge variant="outline">{post.campaign}</Badge>
            <div className="flex items-center gap-1.5">
              {post.platforms.map((platform) => (
                <SocialPlatformIcon
                  key={platform}
                  platform={platform}
                  className="size-6"
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">{post.title}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{post.body}</p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              {post.status === "posted" && post.postedAt
                ? `Posted ${formatWhen(post.postedAt)}`
                : `Scheduled ${formatWhen(post.scheduledAt)}`}
            </span>
            {post.engagement && (
              <span>
                {post.engagement.likes} likes · {post.engagement.comments} comments ·{" "}
                {post.engagement.shares} shares
              </span>
            )}
            {post.leadGenUrl && (
              <Link
                href={post.leadGenUrl}
                target="_blank"
                className="inline-flex items-center gap-1 text-[var(--stat-info)] hover:underline"
              >
                CTA → lead page
                <RiExternalLinkLine className="size-3" />
              </Link>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:pt-1">
          {post.status === "draft" && (
            <Button size="sm" variant="outline" onClick={onSchedule}>
              <RiSendPlaneLine data-icon className="size-4" />
              Queue for auto-post
            </Button>
          )}
          {post.status === "posting" && (
            <Badge variant="secondary" className="gap-1.5">
              <RiLoader4Line className="size-3.5 animate-spin" />
              Publishing…
            </Badge>
          )}
          {post.status === "posted" && (
            <Badge variant="secondary" className="gap-1.5">
              <RiCheckboxCircleLine className="size-3.5" />
              Live
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
