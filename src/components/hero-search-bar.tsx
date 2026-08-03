"use client"

import { Search, MapPin, Stethoscope } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function HeroSearchBar() {
  return (
    <div className="w-full">
      <p className="mb-3 text-center text-sm font-medium text-white/50 sm:text-left sm:text-base">
        Find the right care setting for your patients
      </p>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-2 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              type="text"
              placeholder="City, state, or ZIP code"
              className="h-12 border-white/10 bg-white/[0.05] pl-10 text-sm text-white placeholder-white/30 focus-visible:border-health/50 focus-visible:ring-2 focus-visible:ring-health/20"
            />
          </div>
          <div className="sm:w-48">
            <Select>
              <SelectTrigger className="h-12 w-full border-white/10 bg-white/[0.05] text-sm text-white/60 focus-visible:border-health/50 focus-visible:ring-2 focus-visible:ring-health/20 data-[placeholder]:text-white/30">
                <Stethoscope className="mr-1 h-4 w-4 shrink-0 text-white/40" />
                <SelectValue placeholder="Care level" />
              </SelectTrigger>
              <SelectContent
                align="start"
                sideOffset={8}
                className="border-white/10 bg-[#0F1A2E]/95 text-white backdrop-blur-xl"
              >
                <SelectItem value="skilled-nursing">
                  Skilled Nursing
                </SelectItem>
                <SelectItem value="rehab">Rehabilitation</SelectItem>
                <SelectItem value="assisted-living">
                  Assisted Living
                </SelectItem>
                <SelectItem value="home-health">Home Health</SelectItem>
                <SelectItem value="memory-care">Memory Care</SelectItem>
                <SelectItem value="ltc">Long-Term Care</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ShimmerButton
            shimmerColor="#ffffff"
            shimmerSize="0.05em"
            shimmerDuration="3s"
            borderRadius="12px"
            background="rgba(68, 190, 175, 1)"
            className="h-12 shrink-0 gap-2 px-6 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl active:translate-y-px sm:w-auto"
          >
            <Search className="h-4 w-4" />
            <span>Find Facilities</span>
          </ShimmerButton>
        </div>
      </div>
    </div>
  )
}
