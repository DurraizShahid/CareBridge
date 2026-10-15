// Flat vignettes for the homepage people section. Colors follow .care-public tokens; skin is the one warm note.
const ink = "#203e39", green = "#245c52", sage = "#dce8da", mist = "#edf2ec", skin = "#e6c9a8", white = "#fff";
const line = { stroke: ink, strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const SocialWorker = () => <>
  <rect x="112" y="16" width="40" height="30" rx="4" fill={white} {...line} /><path d="M132 16v30M112 31h40" {...line} />
  <ellipse cx="100" cy="114" rx="88" ry="5" fill={sage} />
  <rect x="32" y="58" width="6" height="36" rx="3" fill={ink} /><rect x="32" y="86" width="36" height="6" rx="3" fill={ink} /><path d="M37 92v20M64 92v20" {...line} />
  <path d="M56 90h24v22" fill="none" stroke={ink} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
  <path d="M46 90c-2-16 2-30 16-32 10 0 18 8 18 18v14z" fill={green} />
  <rect x="58" y="70" width="7" height="9" rx="1.5" fill={white} />
  <path d="M74 70q14 8 28 10" fill="none" stroke={skin} strokeWidth="7" strokeLinecap="round" />
  <circle cx="62" cy="44" r="10" fill={skin} /><path d="M52 44c-1-12 8-16 14-14 6 1 8 6 6 10-4-4-12-3-16 0-2 1-3 3-4 4z" fill={ink} />
  <rect x="174" y="52" width="8" height="60" rx="4" fill={ink} /><rect x="96" y="92" width="82" height="6" rx="2" fill={ink} /><path d="M102 98v14M170 98v14" {...line} />
  <rect x="96" y="80" width="82" height="12" rx="4" fill={white} {...line} />
  <ellipse cx="160" cy="77" rx="13" ry="5" fill={white} {...line} /><circle cx="156" cy="68" r="9" fill={skin} />
  <path d="M104 80c0-9 14-13 28-12 10 1 14 6 18 12z" fill={sage} {...line} />
</>;

const DischargePlanner = () => <>
  <circle cx="164" cy="28" r="12" fill={sage} />
  <ellipse cx="100" cy="114" rx="88" ry="5" fill={sage} />
  <path d="M66 112c36 0 34-16 70-14" fill="none" stroke={green} strokeWidth="3" strokeDasharray="1 8" strokeLinecap="round" />
  <path d="M132 60l26-22 26 22z" fill={green} {...line} /><rect x="138" y="60" width="40" height="38" fill={white} {...line} />
  <rect x="152" y="78" width="12" height="20" rx="2" fill={ink} /><rect x="142" y="66" width="10" height="9" rx="1.5" fill={sage} {...line} />
  <path d="M42 92v20M54 92v20" stroke={ink} strokeWidth="9" strokeLinecap="round" />
  <path d="M34 94c-2-26 4-42 14-42 12 0 16 16 14 42z" fill={green} />
  <rect x="54" y="58" width="24" height="30" rx="3" fill={white} {...line} /><rect x="60" y="55" width="12" height="6" rx="2" fill={ink} />
  <path d="M59 68l3 3 6-6M59 79l3 3 6-6" fill="none" stroke={green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M71 69h3M71 80h3" {...line} />
  <circle cx="55" cy="76" r="4.5" fill={skin} />
  <circle cx="48" cy="36" r="10" fill={skin} /><path d="M38 36c0-10 6-14 12-13 7 1 10 6 9 12-1-4-6-6-12-5-4 1-7 3-9 6z" fill={ink} /><circle cx="40" cy="26" r="5" fill={ink} />
</>;

const CareCoordinator = () => <>
  <ellipse cx="100" cy="114" rx="88" ry="5" fill={sage} />
  <path d="M52 50q24 26 38 14M110 64q14 12 38-14" fill="none" stroke={green} strokeWidth="3" strokeDasharray="1 8" strokeLinecap="round" />
  <circle cx="40" cy="38" r="17" fill={white} {...line} /><path d="M40 30v16M32 38h16" stroke={green} strokeWidth="4.5" strokeLinecap="round" />
  <circle cx="160" cy="38" r="17" fill={white} {...line} /><path d="M151 42l9-9 9 9v8h-18z" fill={sage} {...line} />
  <path d="M84 108c-2-20 4-32 16-32s18 12 16 32z" fill={green} />
  <rect x="88" y="86" width="7" height="9" rx="1.5" fill={white} />
  <path d="M112 90q10-10 2-24" fill="none" stroke={skin} strokeWidth="7" strokeLinecap="round" /><rect x="108" y="56" width="7" height="14" rx="2" fill={ink} />
  <circle cx="100" cy="62" r="10" fill={skin} /><path d="M90 64c-2-12 4-17 11-17 8 0 12 6 9 12-3-3-9-4-14-2-3 1-5 4-6 7z" fill={ink} />
  <rect x="58" y="104" width="84" height="8" rx="3" fill={ink} />
</>;

const FacilityAdministrator = () => <>
  <ellipse cx="100" cy="114" rx="88" ry="5" fill={sage} />
  <rect x="96" y="26" width="84" height="86" rx="3" fill={white} {...line} /><rect x="92" y="20" width="92" height="9" rx="3" fill={ink} />
  {[38, 60].flatMap(y => [106, 131, 156].map(x => <rect key={`${x}-${y}`} x={x} y={y} width="14" height="13" rx="2" fill={x === 156 && y === 60 ? green : mist} {...line} />))}
  <rect x="106" y="82" width="14" height="13" rx="2" fill={mist} {...line} /><rect x="156" y="82" width="14" height="13" rx="2" fill={mist} {...line} />
  <rect x="130" y="86" width="16" height="26" rx="2" fill={sage} {...line} />
  <path d="M46 104v10M58 104v10" stroke={ink} strokeWidth="9" strokeLinecap="round" />
  <path d="M38 106c-2-28 4-44 14-44 12 0 16 16 14 44z" fill={green} />
  <rect x="58" y="70" width="22" height="28" rx="3" fill={ink} /><rect x="61" y="74" width="16" height="20" rx="1.5" fill={sage} />
  <path d="M64 84l3 3 6-6" fill="none" stroke={green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  <circle cx="59" cy="88" r="4.5" fill={skin} />
  <circle cx="52" cy="46" r="10" fill={skin} /><path d="M42 48c-2-11 3-17 11-17 7 0 12 5 10 13v12c-2-6-2-10-4-12-5 1-11 0-14-4-1 3-2 6-3 8z" fill={ink} />
</>;

export const roles = [
  { label: "Hospital social workers", Art: SocialWorker },
  { label: "Discharge planners", Art: DischargePlanner },
  { label: "Care coordinators", Art: CareCoordinator },
  { label: "Facility administrators", Art: FacilityAdministrator },
];
