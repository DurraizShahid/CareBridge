"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowUpRight, Box } from "lucide-react";
import type { TourConfig } from "@/lib/facility-tour";

const FacilityTour = dynamic(() => import("@/components/facility-tour/facility-tour").then(m => m.FacilityTour), { ssr: false, loading: () => <p className="care-tour-loading" role="status">Preparing your 3D walkthrough…</p> });
const demoTour: TourConfig = {
  accentColor: "#245C52", wallColor: "#F4F7F3", floorColor: "#E4DBCE", roomName: "Private suite",
  welcome: "Explore a sample care setting. This model demonstrates CareBridge’s facility tour feature.",
  stops: [
    { id: "welcome", area: "lobby", label: "A welcoming arrival", description: "Explore the reception area and shared spaces.", highlights: ["Reception", "Shared seating"] },
    { id: "hall", area: "corridor", label: "Room to move", description: "Follow the path from shared spaces to the patient room.", highlights: ["Connecting corridor"] },
    { id: "suite", area: "room", label: "A place to recover", description: "Take a closer look at the layout of a private patient suite.", highlights: ["Private suite", "Bedside space"] },
  ],
};
export function TourPreview() {
  const [open, setOpen] = useState(false);
  return <div className="care-tour-demo" data-ui>
    {open ? <><div className="care-tour-top"><p>Sample care setting · Interactive 3D tour</p><button type="button" className="care-text-link" onClick={() => setOpen(false)}>Close tour</button></div><FacilityTour config={demoTour} facilityName="a sample care home" /></> : <button type="button" className="care-tour-poster" onClick={() => setOpen(true)} aria-label="Explore a sample care setting in 3D"><Image src="/Images/care/shared-living.jpg" alt="A sunlit shared living space, shown as an illustrative care setting" fill sizes="(max-width: 800px) 100vw, 70vw" /><span className="care-tour-action"><Box size={23} aria-hidden="true" /><span>Step inside a care setting<small>Explore the 3D tour</small></span><ArrowUpRight size={23} aria-hidden="true" /></span></button>}
  </div>;
}
