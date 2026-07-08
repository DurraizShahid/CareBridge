import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  Pencil,
  Users,
  ClipboardList,
  ImageIcon,
  Video,
  Box,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getFacility, getPlacements, getFacilityUsers } from "@/lib/data-access";
import { getServerOrganization } from "@/lib/server-organization";
import { roleHasPermission } from "@/lib/permissions";
import { DeleteFacilityDialog } from "./delete-dialog";

const facilityTypeLabels: Record<string, string> = {
  "skilled-nursing-facility": "Skilled Nursing Facility",
  "skilled_nursing_facility": "Skilled Nursing Facility",
  "rehabilitation-center": "Rehabilitation Center",
  "rehabilitation_center": "Rehabilitation Center",
  "assisted-living": "Assisted Living",
  "assisted_living": "Assisted Living",
  "long-term-care": "Long-Term Care",
  "long_term_care": "Long-Term Care",
  "home-health-agency": "Home Health Agency",
  "home_health_agency": "Home Health Agency",
  hospice: "Hospice",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  assessment: {
    label: "Assessment",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  searching: {
    label: "Searching",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  },
  matching: {
    label: "Matching",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  "pending-approval": {
    label: "Pending Approval",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  "pending_approval": {
    label: "Pending Approval",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  },
  "in_progress": {
    label: "In Progress",
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  },
  completed: {
    label: "Completed",
    color: "bg-muted text-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacilityDetailPage({ params }: Props) {
  const { id } = await params;
  const org = await getServerOrganization();
  const organizationId = org?.organizationId ?? "org-001";
  const role = org?.role ?? "customer";

  const facility = await getFacility(id, organizationId, role);
  if (!facility) notFound();

  const [placements, facilityUsers] = await Promise.all([
    getPlacements(organizationId, role),
    getFacilityUsers(organizationId, role),
  ]);

  const facilityPlacements = placements.filter(
    (p) => p.selectedFacilityId === id || p.facilityId === id,
  );

  const staff = facilityUsers.filter((u) => u.hospitalId === id);

  const canEdit = roleHasPermission(role, "facilities:update");
  const canDelete = roleHasPermission(role, "facilities:delete");

  return (
    <div className="space-y-8">
      <PageHeader
        title={facility.name}
        description={facilityTypeLabels[facility.type] ?? facility.type}
      >
        {canEdit && (
          <Button variant="outline" render={<Link href={`/facilities/${id}/edit`} />}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        )}
        {canDelete && <DeleteFacilityDialog facilityId={id} facilityName={facility.name} />}
      </PageHeader>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left column: Profile info */}
        <div className="space-y-6 xl:col-span-2">
          {/* Profile info card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>
                      {facility.address.street}, {facility.address.city},{" "}
                      {facility.address.state} {facility.address.zipCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{facility.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{facility.email}</span>
                  </div>
                  {facility.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <a
                        href={facility.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-health underline-offset-4 hover:underline"
                      >
                        {facility.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>
                      {facility.rating} ({facility.reviewsCount} reviews)
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Medicare:
                    </span>
                    <Badge
                      variant={facility.acceptsMedicare ? "default" : "secondary"}
                    >
                      {facility.acceptsMedicare ? "Accepted" : "Not Accepted"}
                    </Badge>
                    <span className="ml-2 text-xs font-medium text-muted-foreground">
                      Medicaid:
                    </span>
                    <Badge
                      variant={facility.acceptsMedicaid ? "default" : "secondary"}
                    >
                      {facility.acceptsMedicaid ? "Accepted" : "Not Accepted"}
                    </Badge>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                      Licensure
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {facility.licensure.map((l) => (
                        <Badge key={l} variant="outline">
                          {l}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                      Accreditations
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {facility.accreditations.map((a) => (
                        <Badge key={a} variant="outline">
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="mb-2 text-sm font-medium">Care Levels</h4>
                <div className="flex flex-wrap gap-1.5">
                  {facility.careLevelsOffered.map((level) => (
                    <Badge
                      key={level}
                      className="bg-health/10 text-health hover:bg-health/20"
                    >
                      {level.replace(/-/g, " ").replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              {facility.specialties.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium">Specialties</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {facility.specialties.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="mb-2 text-sm font-medium">
                  Insurance Accepted
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {facility.insuranceAccepted.map((ins) => (
                    <Badge key={ins} variant="outline">
                      {ins}
                    </Badge>
                  ))}
                </div>
              </div>

              {facility.contacts.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Contacts</h4>
                    <div className="space-y-2">
                      {facility.contacts.map((c, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-muted/50 p-3 text-sm"
                        >
                          <p className="font-medium">{c.name}</p>
                          <p className="text-muted-foreground">{c.role}</p>
                          <p className="text-muted-foreground">{c.phone}</p>
                          <p className="text-muted-foreground">{c.email}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Media gallery */}
          {facility.media && facility.media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  Media ({facility.media.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {facility.media.map((m) => (
                    <div
                      key={m.id}
                      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                    >
                      {m.type === "image" && (
                        <Image
                          src={m.url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      )}
                      {m.type === "gaussian_splat" && (
                        <div className="flex h-full items-center justify-center">
                          <Box className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {m.type === "video" && (
                        <div className="flex h-full items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="text-xs font-medium text-white capitalize">
                          {m.type.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Placements section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                Placements ({facilityPlacements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {facilityPlacements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No placements at this facility.
                </p>
              ) : (
                <div className="space-y-3">
                  {facilityPlacements.map((plc) => {
                    const cfg =
                      statusConfig[plc.status] ?? {
                        label: plc.status,
                        color: "bg-muted text-muted-foreground",
                      };
                    return (
                      <div
                        key={plc.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{plc.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {plc.careLevel.replace(/-/g, " ").replace(/_/g, " ")} &middot;{" "}
                            {plc.priority} priority
                          </p>
                        </div>
                        <Badge className={cfg.color}>{cfg.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Capacity + Staff */}
        <div className="space-y-6">
          {/* Capacity card */}
          <Card>
            <CardHeader>
              <CardTitle>Capacity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant={facility.hasAvailability ? "default" : "destructive"}
                >
                  {facility.hasAvailability ? "Available" : "Full"}
                </Badge>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span className="font-medium">
                    {facility.currentOccupancy} / {facility.capacity} beds
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-health transition-all"
                    style={{
                      width: `${Math.round((facility.currentOccupancy / facility.capacity) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {Math.round(
                    (facility.currentOccupancy / facility.capacity) * 100,
                  )}
                  % occupied
                </p>
              </div>

              {facility.waitlistDays && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Waitlist
                  </span>
                  <span className="text-sm font-medium">
                    ~{facility.waitlistDays} days
                  </span>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-center text-sm">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {facility.capacity - facility.currentOccupancy}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Available Beds
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {facility.reviewsCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                Staff ({staff.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {staff.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No staff assigned.
                </p>
              ) : (
                <div className="space-y-3">
                  {staff.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <p className="text-sm font-medium">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {u.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {u.email}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
