"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import {
  RiArrowDownLine,
  RiArrowDownSLine,
  RiArrowLeftDownLine,
  RiArrowRightUpLine,
  RiArrowUpDownLine,
  RiArrowUpLine,
  RiDeleteBack2Line,
  RiHeadphoneLine,
  RiLoader4Line,
  RiPauseCircleLine,
  RiPhoneFill,
  RiPhoneLine,
  RiPlayCircleLine,
  RiRefreshLine,
  RiRobot2Line,
  RiTimeLine,
  RiUserVoiceLine,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  AGENT_STATUS_LABELS,
  INITIAL_LOGS,
  SAMPLE_AGENTS,
  SAMPLE_CALLS,
  SAMPLE_CAMPAIGNS,
  STATUS_LABELS,
  type CallDirection,
  type CallStatus,
  type DialingAgent,
  type DialingCall,
  type DialingCampaign,
  type DialingLog,
} from "./dummy-data";

const STATUS_BADGE: Record<CallStatus, string> = {
  queued: "bg-muted text-muted-foreground",
  ringing: "bg-[var(--stat-orange-bg)] text-[var(--stat-orange)]",
  connected: "bg-[var(--stat-info-bg)] text-[var(--stat-info)]",
  completed: "bg-[var(--stat-health-bg)] text-[var(--stat-health)]",
  missed: "bg-destructive/10 text-destructive",
  failed: "bg-destructive/10 text-destructive",
};

const AGENT_BADGE: Record<DialingAgent["status"], string> = {
  available: "bg-[var(--stat-health-bg)] text-[var(--stat-health)]",
  "on-call": "bg-[var(--stat-info-bg)] text-[var(--stat-info)]",
  "wrap-up": "bg-[var(--stat-orange-bg)] text-[var(--stat-orange)]",
  offline: "bg-muted text-muted-foreground",
};

const columnHelper = createColumnHelper<DialingCall>();

function formatDuration(sec: number | null) {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

let logIdCounter = 0;
function createLogId(kind: string) {
  logIdCounter += 1;
  return `dlog-${Date.now()}-${logIdCounter}-${kind}`;
}

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

function liveDuration(startedAt: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
}

export function AiDialingClient() {
  const [calls, setCalls] = useState<DialingCall[]>(SAMPLE_CALLS);
  const [agents, setAgents] = useState<DialingAgent[]>(SAMPLE_AGENTS);
  const [campaigns, setCampaigns] = useState<DialingCampaign[]>(SAMPLE_CAMPAIGNS);
  const [logs, setLogs] = useState<DialingLog[]>(INITIAL_LOGS);
  const [inboundOn, setInboundOn] = useState(true);
  const [outboundOn, setOutboundOn] = useState(true);
  const [recordCalls, setRecordCalls] = useState(true);
  const [aiGreeting, setAiGreeting] = useState(true);
  const [query, setQuery] = useState("");
  const [directionTab, setDirectionTab] = useState<CallDirection | "all">("all");
  const [sorting, setSorting] = useState<SortingState>([{ id: "startedAt", desc: true }]);
  const [tick, setTick] = useState(0);
  const [dialNumber, setDialNumber] = useState("");
  const [dialStatus, setDialStatus] = useState<"idle" | "dialing" | "in-call">("idle");

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const now = Date.now();

    let callsChanged = false;
    let agentsChanged = false;
    let workingAgents = agents;
    const pendingLogs: DialingLog[] = [];
    const campaignIncrements = new Map<string, number>();

    const nextCalls = calls.map((call) => {
      const startMs = new Date(call.startedAt).getTime();

      if (
        call.direction === "outbound" &&
        outboundOn &&
        call.status === "queued" &&
        startMs <= now
      ) {
        callsChanged = true;
        const agent = workingAgents.find((a) => a.status === "available") ?? null;
        if (agent) {
          agentsChanged = true;
          workingAgents = workingAgents.map((a) =>
            a.id === agent.id
              ? { ...a, status: "on-call" as const, activeCallId: call.id }
              : a,
          );
        }
        pendingLogs.push({
          id: createLogId("ring"),
          callId: call.id,
          message: `Outbound ringing · ${call.contactName}`,
          timestamp: new Date().toISOString(),
          tone: "info",
        });
        return {
          ...call,
          status: "ringing" as const,
          startedAt: new Date().toISOString(),
          agentId: agent ? agent.id : call.agentId,
        };
      }

      if (
        call.direction === "inbound" &&
        inboundOn &&
        call.status === "queued" &&
        now - startMs >= 5_000
      ) {
        callsChanged = true;
        const agent = workingAgents.find((a) => a.status === "available") ?? null;
        if (agent) {
          agentsChanged = true;
          workingAgents = workingAgents.map((a) =>
            a.id === agent.id
              ? { ...a, status: "on-call" as const, activeCallId: call.id }
              : a,
          );
          pendingLogs.push({
            id: createLogId("answer"),
            callId: call.id,
            message: `Inbound answered · ${agent.name} · ${call.contactName}`,
            timestamp: new Date().toISOString(),
            tone: "success",
          });
          return {
            ...call,
            status: "connected" as const,
            agentId: agent.id,
            sentiment: "neutral" as const,
            transcriptPreview:
              "AI: Thanks for calling CareBridge placement support.",
          };
        }
        pendingLogs.push({
          id: createLogId("answer"),
          callId: call.id,
          message: `Inbound ringing · waiting for agent · ${call.contactName}`,
          timestamp: new Date().toISOString(),
          tone: "warning",
        });
        return { ...call, status: "ringing" as const };
      }

      if (call.status === "ringing" && now - startMs >= 4_000) {
        callsChanged = true;
        let assignedAgent: DialingAgent | null = null;
        if (!call.agentId) {
          const available = workingAgents.find((a) => a.status === "available") ?? null;
          if (available) {
            assignedAgent = available;
            agentsChanged = true;
            workingAgents = workingAgents.map((a) =>
              a.id === available.id
                ? { ...a, status: "on-call" as const, activeCallId: call.id }
                : a,
            );
          }
        }
        pendingLogs.push({
          id: createLogId("connect"),
          callId: call.id,
          message: `${call.direction === "inbound" ? "Inbound" : "Outbound"} connected · ${call.contactName}`,
          timestamp: new Date().toISOString(),
          tone: "success",
        });
        return {
          ...call,
          status: "connected" as const,
          agentId: call.agentId ?? assignedAgent?.id ?? null,
          sentiment: "neutral" as const,
          transcriptPreview:
            call.transcriptPreview ??
            "AI: Confirming availability and next steps for this referral.",
        };
      }

      if (call.status === "connected" && now - startMs >= 28_000) {
        callsChanged = true;
        const durationSec = Math.floor((now - startMs) / 1000);
        const endedAt = new Date().toISOString();
        const finishedAgentId = call.agentId;
        pendingLogs.push({
          id: createLogId("done"),
          callId: call.id,
          message: `Call completed · ${call.contactName} · ${formatDuration(durationSec)}`,
          timestamp: endedAt,
          tone: "success",
        });
        if (finishedAgentId) {
          agentsChanged = true;
          workingAgents = workingAgents.map((a) =>
            a.id === finishedAgentId
              ? {
                  ...a,
                  status: "wrap-up" as const,
                  activeCallId: null,
                  callsToday: a.callsToday + 1,
                }
              : a,
          );
          window.setTimeout(() => {
            setAgents((prev) =>
              prev.map((a) =>
                a.id === finishedAgentId && a.status === "wrap-up"
                  ? { ...a, status: "available" as const }
                  : a,
              ),
            );
          }, 4_000);
        }
        campaignIncrements.set(
          call.campaign,
          (campaignIncrements.get(call.campaign) ?? 0) + 1,
        );
        return {
          ...call,
          status: "completed" as const,
          endedAt,
          durationSec,
          sentiment: "positive" as const,
        };
      }

      return call;
    });

    if (callsChanged) setCalls(nextCalls);
    if (agentsChanged) setAgents(workingAgents);
    if (pendingLogs.length > 0) {
      setLogs((prev) => [...pendingLogs, ...prev]);
    }
    if (campaignIncrements.size > 0) {
      setCampaigns((prev) => {
        let campaignChanged = false;
        const next = prev.map((c) => {
          const count = campaignIncrements.get(c.name);
          if (!count) return c;
          campaignChanged = true;
          if (c.direction === "outbound") {
            return {
              ...c,
              dialed: c.dialed + count,
              connected: c.connected + count,
              progress: Math.min(100, c.progress + count * 2),
            };
          }
          return { ...c, connected: c.connected + count };
        });
        return campaignChanged ? next : prev;
      });
    }
  }, [calls, agents, tick, inboundOn, outboundOn]);

  const stats = useMemo(() => {
    const active = calls.filter(
      (c) => c.status === "connected" || c.status === "ringing",
    ).length;
    const queued = calls.filter((c) => c.status === "queued").length;
    const completed = calls.filter((c) => c.status === "completed");
    const answered = completed.length + calls.filter((c) => c.status === "connected").length;
    const attempted =
      answered +
      calls.filter((c) => c.status === "missed" || c.status === "failed").length;
    const answerRate = attempted === 0 ? 0 : Math.round((answered / attempted) * 100);
    const avgDuration = completed.length
      ? Math.round(
          completed.reduce((sum, c) => sum + (c.durationSec ?? 0), 0) / completed.length,
        )
      : 0;
    return { active, queued, answerRate, avgDuration };
  }, [calls]);

  const filteredCalls = useMemo(() => {
    const q = query.trim().toLowerCase();
    return calls.filter((call) => {
      if (directionTab !== "all" && call.direction !== directionTab) return false;
      if (!q) return true;
      return (
        call.contactName.toLowerCase().includes(q) ||
        call.phone.toLowerCase().includes(q) ||
        call.campaign.toLowerCase().includes(q) ||
        call.purpose.toLowerCase().includes(q)
      );
    });
  }, [calls, directionTab, query]);

  const agentNameById = useMemo(() => {
    const map = new Map(agents.map((a) => [a.id, a.name]));
    return map;
  }, [agents]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("direction", {
        header: "Dir",
        cell: (info) => (
          <Badge variant="outline" className="gap-1 capitalize">
            {info.getValue() === "inbound" ? (
              <RiArrowLeftDownLine className="size-3" />
            ) : (
              <RiArrowRightUpLine className="size-3" />
            )}
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("contactName", {
        header: "Contact",
        cell: (info) => (
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-sm font-medium text-foreground">
              {info.getValue()}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {info.row.original.phone}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("purpose", {
        header: "Purpose",
        cell: (info) => (
          <div className="min-w-[180px] space-y-0.5">
            <p className="text-sm text-foreground line-clamp-1">{info.getValue()}</p>
            <p className="text-xs text-muted-foreground">{info.row.original.campaign}</p>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          return (
            <Badge className={cn("border-0 gap-1", STATUS_BADGE[status])}>
              {(status === "ringing" || status === "connected") && (
                <RiLoader4Line className="size-3 animate-spin" />
              )}
              {STATUS_LABELS[status]}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("agentId", {
        header: "Agent",
        cell: (info) => {
          const id = info.getValue();
          return (
            <span className="text-sm text-muted-foreground">
              {id ? agentNameById.get(id) ?? "—" : "Unassigned"}
            </span>
          );
        },
      }),
      columnHelper.accessor("startedAt", {
        header: "Started",
        cell: (info) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatWhen(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "duration",
        header: "Duration",
        cell: ({ row }) => {
          const call = row.original;
          const sec =
            call.status === "connected" || call.status === "ringing"
              ? liveDuration(call.startedAt)
              : call.durationSec;
          return (
            <span className="text-sm tabular-nums text-foreground">
              {formatDuration(sec)}
            </span>
          );
        },
      }),
    ],
    [agentNameById, tick],
  );

  const table = useReactTable({
    data: filteredCalls,
    columns,
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 6 } },
  });

  function enqueueOutbound(phone?: string) {
    const id = `call-out-${Date.now()}`;
    const dialed = (phone ?? "").replace(/\D/g, "");
    const formatted =
      phone && dialed.length > 0
        ? formatPhoneDisplay(phone)
        : "+1 (555) 010-2200";
    const call: DialingCall = {
      id,
      direction: "outbound",
      contactName: phone ? "Manual dial" : "Demo Facility Intake",
      phone: formatted,
      purpose: phone ? "Manual keypad dial (demo)" : "Dummy capacity confirmation",
      campaign: "Facility capacity check-ins",
      status: "queued",
      agentId: null,
      startedAt: new Date(Date.now() + (phone ? 1_000 : 5_000)).toISOString(),
      endedAt: null,
      durationSec: null,
      sentiment: null,
      transcriptPreview: null,
    };
    setCalls((prev) => [call, ...prev]);
    setLogs((prev) => [
      {
        id: createLogId("enqueue"),
        callId: id,
        message: phone
          ? `Manual dial queued · ${formatted}`
          : "Outbound queued · Demo Facility Intake (dial in ~5s)",
        timestamp: new Date().toISOString(),
        tone: "info",
      },
      ...prev,
    ]);
    return id;
  }

  function enqueueInbound() {
    const id = `call-in-${Date.now()}`;
    const call: DialingCall = {
      id,
      direction: "inbound",
      contactName: "Demo Hospital Case Mgmt",
      phone: "+1 (555) 010-3300",
      purpose: "Dummy referral inquiry",
      campaign: "Referral follow-up hotline",
      status: "queued",
      agentId: null,
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationSec: null,
      sentiment: null,
      transcriptPreview: null,
    };
    setCalls((prev) => [call, ...prev]);
    setLogs((prev) => [
      {
        id: createLogId("inbound"),
        callId: id,
        message: "Inbound received · Demo Hospital Case Mgmt",
        timestamp: new Date().toISOString(),
        tone: "info",
      },
      ...prev,
    ]);
  }

  function toggleCampaign(campaignId: string) {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId || c.status === "draft") return c;
        return {
          ...c,
          status: c.status === "running" ? "paused" : "running",
        };
      }),
    );
  }

  function resetDemo() {
    setCalls(SAMPLE_CALLS.map((c) => ({ ...c })));
    setAgents(SAMPLE_AGENTS.map((a) => ({ ...a })));
    setCampaigns(SAMPLE_CAMPAIGNS.map((c) => ({ ...c })));
    setLogs([...INITIAL_LOGS]);
    setInboundOn(true);
    setOutboundOn(true);
    setRecordCalls(true);
    setAiGreeting(true);
    setQuery("");
    setDirectionTab("all");
    setDialNumber("");
    setDialStatus("idle");
  }

  function appendDialDigit(digit: string) {
    if (dialStatus === "in-call") return;
    setDialNumber((prev) => {
      if (prev.replace(/\D/g, "").length >= 15) return prev;
      return prev + digit;
    });
    if (dialStatus === "dialing") setDialStatus("idle");
  }

  function backspaceDial() {
    if (dialStatus === "in-call") return;
    setDialNumber((prev) => prev.slice(0, -1));
  }

  function clearDial() {
    if (dialStatus === "in-call") return;
    setDialNumber("");
    setDialStatus("idle");
  }

  function placeManualCall() {
    const digits = dialNumber.replace(/\D/g, "");
    if (digits.length < 3 || dialStatus !== "idle") return;
    setDialStatus("dialing");
    enqueueOutbound(dialNumber);
    window.setTimeout(() => setDialStatus("in-call"), 900);
  }

  function hangUpManual() {
    setDialStatus("idle");
    setLogs((prev) => [
      {
        id: createLogId("hangup"),
        callId: null,
        message: `Manual dialer hung up · ${formatPhoneDisplay(dialNumber) || "no number"}`,
        timestamp: new Date().toISOString(),
        tone: "warning",
      },
      ...prev,
    ]);
  }

  const liveCalls = calls.filter(
    (c) => c.status === "connected" || c.status === "ringing",
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="AI Automated Dialing"
        description="Dummy inbound and outbound dialer — campaigns, agents, and call queues simulate live without a telephony backend."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "AI Dialing" },
        ]}
      >
        <Button variant="outline" size="sm" onClick={resetDemo}>
          <RiRefreshLine data-icon className="size-4" />
          Reset demo
        </Button>
        <Button variant="outline" size="sm" onClick={enqueueInbound}>
          <RiArrowLeftDownLine data-icon className="size-4" />
          Simulate inbound
        </Button>
        <Button size="sm" onClick={() => enqueueOutbound()}>
          <RiArrowRightUpLine data-icon className="size-4" />
          Queue outbound
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Live calls"
          value={stats.active}
          icon={RiPhoneLine}
          hint="Ringing or connected"
        />
        <StatTile
          label="In queue"
          value={stats.queued}
          icon={RiTimeLine}
          hint="Waiting to dial / answer"
        />
        <StatTile
          label="Answer rate"
          value={`${stats.answerRate}%`}
          icon={RiHeadphoneLine}
          hint="Dummy connect ratio"
        />
        <StatTile
          label="Avg handle"
          value={formatDuration(stats.avgDuration)}
          icon={RiUserVoiceLine}
          hint="Completed calls only"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr_0.95fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Dialer automation</CardTitle>
              <CardDescription>
                Toggle inbound answering and outbound progressive dialing. No real calls are placed.
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1.5">
              <RiRobot2Line className="size-3.5" />
              Demo mode
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="inbound-toggle" className="text-sm font-medium">
                    Inbound AI answering
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Auto-answer queued inbound after ~5s
                  </p>
                </div>
                <Switch
                  id="inbound-toggle"
                  checked={inboundOn}
                  onCheckedChange={setInboundOn}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="outbound-toggle" className="text-sm font-medium">
                    Outbound progressive dial
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Dial queued outbound when due
                  </p>
                </div>
                <Switch
                  id="outbound-toggle"
                  checked={outboundOn}
                  onCheckedChange={setOutboundOn}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="record-toggle" className="text-sm font-medium">
                    Call recording
                  </Label>
                  <p className="text-xs text-muted-foreground">UI-only preference</p>
                </div>
                <Switch
                  id="record-toggle"
                  checked={recordCalls}
                  onCheckedChange={setRecordCalls}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="greeting-toggle" className="text-sm font-medium">
                    AI greeting script
                  </Label>
                  <p className="text-xs text-muted-foreground">UI-only preference</p>
                </div>
                <Switch
                  id="greeting-toggle"
                  checked={aiGreeting}
                  onCheckedChange={setAiGreeting}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              {inboundOn || outboundOn ? (
                <RiPlayCircleLine className="size-5 shrink-0 text-[var(--stat-health)]" />
              ) : (
                <RiPauseCircleLine className="size-5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {inboundOn || outboundOn
                    ? "AI dialer is live (demo)"
                    : "AI dialer paused"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Inbound {inboundOn ? "on" : "off"} · Outbound {outboundOn ? "on" : "off"} ·
                  Recording {recordCalls ? "on" : "off"} · Greeting{" "}
                  {aiGreeting ? "on" : "off"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DummyDialPad
          number={dialNumber}
          status={dialStatus}
          onDigit={appendDialDigit}
          onBackspace={backspaceDial}
          onClear={clearDial}
          onCall={placeManualCall}
          onHangUp={hangUpManual}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live monitor</CardTitle>
            <CardDescription>Active conversations right now</CardDescription>
          </CardHeader>
          <CardContent>
            {liveCalls.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No live calls — use the keypad or queue an outbound.
              </p>
            ) : (
              <ul className="space-y-3">
                {liveCalls.map((call) => (
                  <li
                    key={call.id}
                    className="rounded-xl border border-border/60 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {call.direction}
                          </Badge>
                          <Badge className={cn("border-0", STATUS_BADGE[call.status])}>
                            {STATUS_LABELS[call.status]}
                          </Badge>
                        </div>
                        <p className="truncate text-sm font-medium">{call.contactName}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {call.transcriptPreview ?? call.purpose}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatDuration(liveDuration(call.startedAt))}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaigns</CardTitle>
            <CardDescription>
              Inbound IVR and outbound capacity outreach (dummy)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="space-y-3 rounded-xl border border-border/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {campaign.name}
                      </p>
                      <Badge variant="outline" className="capitalize">
                        {campaign.direction}
                      </Badge>
                      <Badge
                        className={cn(
                          "border-0 capitalize",
                          campaign.status === "running" &&
                            "bg-[var(--stat-health-bg)] text-[var(--stat-health)]",
                          campaign.status === "paused" &&
                            "bg-[var(--stat-orange-bg)] text-[var(--stat-orange)]",
                          campaign.status === "draft" &&
                            "bg-muted text-muted-foreground",
                        )}
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {campaign.script}
                    </p>
                  </div>
                  {campaign.status !== "draft" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleCampaign(campaign.id)}
                    >
                      {campaign.status === "running" ? "Pause" : "Resume"}
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {campaign.direction === "outbound"
                        ? `${campaign.connected}/${campaign.dialed} connected`
                        : `${campaign.connected} answered`}
                    </span>
                    <span>{campaign.progress}%</span>
                  </div>
                  <Progress value={campaign.progress} className="w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Agents</CardTitle>
              <CardDescription>AI-assisted human agents (dummy)</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {agents.map((agent) => (
                  <li
                    key={agent.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.callsToday} calls today · avg{" "}
                        {formatDuration(agent.avgHandleSec)}
                      </p>
                    </div>
                    <Badge className={cn("border-0", AGENT_BADGE[agent.status])}>
                      {AGENT_STATUS_LABELS[agent.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
              <CardDescription>Recent dialer events</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {logs.slice(0, 7).map((log) => (
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
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Call queue</h3>
          <p className="text-xs text-muted-foreground">
            Inbound and outbound sample calls with simulated state changes
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contact, phone, campaign…"
            className="sm:w-[260px]"
          />
          <Tabs
            value={directionTab}
            onValueChange={(value) =>
              setDirectionTab((value ?? "all") as CallDirection | "all")
            }
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="inbound">Inbound</TabsTrigger>
              <TabsTrigger value="outbound">Outbound</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-2 h-8 px-2 font-medium"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {sorted === "asc" ? (
                              <RiArrowUpLine className="size-3.5" />
                            ) : sorted === "desc" ? (
                              <RiArrowDownLine className="size-3.5" />
                            ) : (
                              <RiArrowUpDownLine className="size-3.5 opacity-40" />
                            )}
                          </Button>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-28 text-center text-sm text-muted-foreground"
                  >
                    No calls match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {filteredCalls.length} call{filteredCalls.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground">
              {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <RiArrowDownSLine className="size-3.5 -rotate-90" />
            </Button>
          </div>
        </div>
      </Card>
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
  value: string | number;
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

const DIAL_KEYS: { digit: string; letters?: string }[] = [
  { digit: "1" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*" },
  { digit: "0", letters: "+" },
  { digit: "#" },
];

function formatPhoneDisplay(raw: string) {
  const hasPlus = raw.trim().startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;
  if (digits.length <= 3) return `${hasPlus ? "+" : ""}${digits}`;
  if (digits.length <= 6) {
    return `${hasPlus ? "+" : ""}(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  if (digits.length <= 10) {
    return `${hasPlus ? "+" : ""}(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  const country = digits.slice(0, digits.length - 10);
  const local = digits.slice(-10);
  return `+${country} (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

function DummyDialPad({
  number,
  status,
  onDigit,
  onBackspace,
  onClear,
  onCall,
  onHangUp,
}: {
  number: string;
  status: "idle" | "dialing" | "in-call";
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onCall: () => void;
  onHangUp: () => void;
}) {
  const canCall = number.replace(/\D/g, "").length >= 3 && status === "idle";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (/^[0-9*#]$/.test(event.key)) {
        event.preventDefault();
        onDigit(event.key);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        onBackspace();
        return;
      }
      if (event.key === "Enter" && canCall) {
        event.preventDefault();
        onCall();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (status === "in-call") onHangUp();
        else onClear();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canCall, onBackspace, onCall, onClear, onDigit, onHangUp, status]);

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">Manual dialer</CardTitle>
        <CardDescription>
          Dummy keypad — enter a number and press Call. No real telephony.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="flex w-full flex-col items-center gap-1 rounded-xl border border-border/60 bg-muted/30 px-4 py-4">
          <p
            className={cn(
              "min-h-8 w-full text-center text-2xl font-medium tracking-wide tabular-nums text-foreground",
              !number && "text-muted-foreground",
            )}
            aria-live="polite"
          >
            {number ? formatPhoneDisplay(number) : "Enter number"}
          </p>
          <p className="text-xs text-muted-foreground">
            {status === "dialing" && "Dialing…"}
            {status === "in-call" && "Connected (demo)"}
            {status === "idle" && "Ready"}
          </p>
        </div>

        <div className="grid w-full max-w-[260px] grid-cols-3 gap-2">
          {DIAL_KEYS.map((key) => (
            <Button
              key={key.digit}
              type="button"
              variant="outline"
              disabled={status === "in-call"}
              className="h-14 flex-col gap-0 rounded-2xl text-lg font-semibold"
              onClick={() => onDigit(key.digit)}
              aria-label={`Dial ${key.digit}`}
            >
              <span>{key.digit}</span>
              {key.letters ? (
                <span className="text-[9px] font-medium tracking-[0.14em] text-muted-foreground">
                  {key.letters}
                </span>
              ) : (
                <span className="h-3" />
              )}
            </Button>
          ))}
        </div>

        <div className="flex w-full max-w-[260px] items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!number || status === "in-call"}
            onClick={onClear}
          >
            Clear
          </Button>

          {status === "in-call" ? (
            <Button
              type="button"
              variant="destructive"
              className="size-14 rounded-full"
              onClick={onHangUp}
              aria-label="Hang up"
            >
              <RiPhoneFill className="size-6 rotate-[135deg]" />
            </Button>
          ) : (
            <Button
              type="button"
              className="size-14 rounded-full bg-[var(--stat-health)] text-white hover:bg-[var(--stat-health)]/90"
              disabled={!canCall && status !== "dialing"}
              onClick={onCall}
              aria-label="Call"
            >
              {status === "dialing" ? (
                <RiLoader4Line className="size-6 animate-spin" />
              ) : (
                <RiPhoneFill className="size-6" />
              )}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!number || status === "in-call"}
            onClick={onBackspace}
            aria-label="Backspace"
          >
            <RiDeleteBack2Line className="size-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
