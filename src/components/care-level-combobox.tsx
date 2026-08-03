"use client"

import * as React from "react"
import { Stethoscope } from "lucide-react"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

type CareLevel = {
  label: string
  value: string
}

const careLevels: CareLevel[] = [
  { label: "Skilled Nursing", value: "skilled-nursing" },
  { label: "Rehabilitation", value: "rehab" },
  { label: "Assisted Living", value: "assisted-living" },
  { label: "Home Health", value: "home-health" },
  { label: "Memory Care", value: "memory-care" },
  { label: "Long-Term Care", value: "ltc" },
]

export function CareLevelCombobox() {
  const [value, setValue] = React.useState<CareLevel | null>(null)

  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-white/20 bg-white/[0.08] px-4 py-1.5 transition-colors focus-within:border-[#44BEAF]/60 focus-within:ring-2 focus-within:ring-[#44BEAF]/30 sm:flex-1">
      <Stethoscope className="h-5 w-5 shrink-0 text-white/70" />
      <Combobox
        items={careLevels}
        value={value}
        onValueChange={(newValue) => setValue(newValue as CareLevel | null)}
        itemToStringValue={(item) => item.label}
      >
        <ComboboxInput
          placeholder="Care level needed"
          className="w-full bg-transparent text-sm text-white placeholder-white/50 outline-none border-none focus:ring-0 focus:outline-none shadow-none"
        />
        <ComboboxContent
          className="bg-[#134675] border border-white/20 text-white"
        >
          <ComboboxEmpty className="text-white/50">No care levels found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem
                key={item.value}
                value={item}
                className="text-white hover:bg-white/10 data-[highlighted]:bg-white/10"
              >
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
