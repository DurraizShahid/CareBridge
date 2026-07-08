import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  RiArrowLeftLine,
  RiMapPinLine,
  RiPhoneLine,
  RiMailLine,
  RiGlobeLine,
  RiStarFill,
  RiBuildingLine,
  RiVideoLine,
  RiBox3Line,
} from "@remixicon/react";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getFacilityById } from "@/lib/data-access";

const facilityTypeLabels: Record<string, string> = {
  "skilled-nursing-facility": "Skilled Nursing Facility",
  "rehabilitation-center": "Rehabilitation Center",
  "assisted-living": "Assisted Living",
  "long-term-care": "Long-Term Care",
  "home-health-agency": "Home Health Agency",
  hospice: "Hospice",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacilityNetworkDetailPage({
  params,
}: Props) {
  const { id } = await params;

  const signedInUser = await currentUser();
  if (!signedInUser) redirect("/sign-in");

  const facility = await getFacilityById(id);
  if (!facility) notFound();

  const availableBeds = facility.capacity - facility.currentOccupancy;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/dashboard/facility-network" />}>
          <RiArrowLeftLine className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {facility.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {facilityTypeLabels[facility.type] ?? facility.type}
          </p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                {facility.media && facility.media.length > 0 ? (
                  facility.media
                    .filter((m) => m.type === "image")
                    .slice(0, 5)
                    .map((m, i) => (
                      <div
                        key={m.id}
                        className={`relative aspect-square overflow-hidden bg-muted ${i === 0 ? "col-span-2 row-span-2" : ""}`}
                      >
                        <Image
                          src={m.url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                    ))
                ) : (
                  <div className="col-span-full flex aspect-video items-center justify-center bg-muted">
                    <RiBuildingLine className="size-16 text-muted-foreground/20" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About this facility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <RiMapPinLine className="size-4 shrink-0 text-muted-foreground" />
                    <span>
                      {facility.address.street}, {facility.address.city},{" "}
                      {facility.address.state} {facility.address.zipCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <RiPhoneLine className="size-4 shrink-0 text-muted-foreground" />
                    <span>{facility.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <RiMailLine className="size-4 shrink-0 text-muted-foreground" />
                    <span>{facility.email}</span>
                  </div>
                  {facility.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <RiGlobeLine className="size-4 shrink-0 text-muted-foreground" />
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
                    <RiStarFill className="size-4 shrink-0 text-amber-500" />
                    <span>
                      {facility.rating} ({facility.reviewsCount} reviews)
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Medicare:
                    </span>
                    <Badge
                      variant={
                        facility.acceptsMedicare ? "default" : "secondary"
                      }
                    >
                      {facility.acceptsMedicare
                        ? "Accepted"
                        : "Not Accepted"}
                    </Badge>
                    <span className="ml-2 text-xs font-medium text-muted-foreground">
                      Medicaid:
                    </span>
                    <Badge
                      variant={
                        facility.acceptsMedicaid ? "default" : "secondary"
                      }
                    >
                      {facility.acceptsMedicaid
                        ? "Accepted"
                        : "Not Accepted"}
                    </Badge>
                  </div>
                  {facility.licensure.length > 0 && (
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
                  )}
                  {facility.accreditations.length > 0 && (
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
                  )}
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
                      {level.replace(/-/g, " ")}
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
                  {facility.insuranceAccepted.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      None listed
                    </span>
                  )}
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
                          className="rounded-lg border p-3 text-sm"
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

              {facility.media && facility.media.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="mb-2 text-sm font-medium">
                      Media ({facility.media.length})
                    </h4>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
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
                              sizes="10vw"
                            />
                          )}
                          {m.type === "gaussian_splat" && (
                            <div className="flex h-full items-center justify-center">
                              <RiBox3Line className="size-5 text-muted-foreground" />
                            </div>
                          )}
                          {m.type === "video" && (
                            <div className="flex h-full items-center justify-center">
                              <RiVideoLine className="size-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant={
                    facility.hasAvailability ? "default" : "destructive"
                  }
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
                    Est. waitlist
                  </span>
                  <span className="text-sm font-medium">
                    ~{facility.waitlistDays} days
                  </span>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {availableBeds}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Available Beds
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {facility.rating}
                  </p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <Button
                className="w-full gap-2"
                size="lg"
                render={
                  <Link href={`/placements/new?facilityId=${facility.id}`} />
                }
              >
                Initiate Placement
                <RiArrowLeftLine className="size-4 rotate-180" />
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Start a new placement request for this facility
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
