import type { ChatCompletionTool } from "openai/resources/index";

export const AI_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchPatients",
      description: "Search for patients in your organization. Results can be filtered by name/MRN/diagnosis, status, or care level. Returns basic patient info including age, diagnosis, and placement status.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search term to match against patient name, MRN, or diagnosis",
          },
          status: {
            type: "string",
            enum: [
              "admitted",
              "assessment-in-progress",
              "ready-for-discharge",
              "placed",
              "discharged",
            ],
            description: "Filter by patient status",
          },
          careLevel: {
            type: "string",
            enum: [
              "independent-living",
              "assisted-living",
              "skilled-nursing",
              "long-term-care",
              "rehabilitation",
              "home-health",
              "hospice",
              "memory-care",
            ],
            description: "Filter by required care level",
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default 20)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getPatient",
      description: "Get detailed information about a specific patient by their ID, including insurance, emergency contact, and full diagnosis history.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The patient's unique ID",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchFacilities",
      description: "Search for facilities across ALL organizations in the network. All parameters are optional — calling with no parameters returns all facilities. Can filter by location, insurance accepted, care levels offered, availability, facility type, and specialties. Use this when the user asks about placement options or finding facilities — this is the primary tool for facility discovery. Always call this tool immediately when the user asks about facilities; do not ask the user for additional information first.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City, state, or ZIP code to search near",
          },
          careLevelsOffered: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "independent-living",
                "assisted-living",
                "skilled-nursing",
                "long-term-care",
                "rehabilitation",
                "home-health",
                "hospice",
                "memory-care",
              ],
            },
            description: "Required care levels the facility must offer",
          },
          facilityTypes: {
            type: "array",
            items: {
              type: "string",
              enum: [
                "skilled-nursing-facility",
                "rehabilitation-center",
                "assisted-living",
                "long-term-care",
                "home-health-agency",
                "hospice",
              ],
            },
            description: "Filter by facility type",
          },
          insuranceAccepted: {
            type: "array",
            items: { type: "string" },
            description: "Insurance providers the facility must accept (e.g. Medicare, Medicaid, Aetna, Blue Cross)",
          },
          hasAvailability: {
            type: "boolean",
            description: "Filter to only show facilities with current availability",
          },
          specialties: {
            type: "array",
            items: { type: "string" },
            description: "Medical specialties the facility should support (e.g. cardiac, stroke, orthopedic, wound-care, palliative)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getFacilities",
      description: "List facilities managed by your own organization only. Use searchFacilities instead to find facilities across the entire network.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getFacility",
      description: "Get detailed information about ANY facility in the network by ID, including media, licensure, accreditations, and contacts. Works across all organizations.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The facility's unique ID",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getPlacements",
      description: "List placement records. Can filter by status, priority, or patient name. Use this when the user asks about pending discharges, active placements, or placement history.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: [
              "assessment",
              "searching",
              "matching",
              "pending-approval",
              "approved",
              "in-progress",
              "completed",
              "cancelled",
            ],
            description: "Filter by placement status",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "emergency"],
            description: "Filter by priority level",
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return (default 20)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getDashboardStats",
      description: "Get summary statistics for your organization including active patient counts, pending assessments, available facilities, and average placement times.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getRecentActivity",
      description: "Get the most recent activity in your organization including new placements, assessments, admissions, and discharges.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "draftPlacement",
      description: "Draft a placement for a patient at a specific facility. Validates that the patient exists, the facility offers the required care level, and prepares a placement draft for user confirmation. Use ONLY when the user explicitly asks to initiate a placement. Always call searchFacilities or getPatient first to get the correct IDs.",
      parameters: {
        type: "object",
        properties: {
          patientId: {
            type: "string",
            description: "The patient's unique ID",
          },
          facilityId: {
            type: "string",
            description: "The facility's unique ID to place the patient at",
          },
          careLevel: {
            type: "string",
            enum: [
              "independent-living",
              "assisted-living",
              "skilled-nursing",
              "long-term-care",
              "rehabilitation",
              "home-health",
              "hospice",
              "memory-care",
            ],
            description: "The care level for the placement",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "emergency"],
            description: "Priority level (default: medium)",
          },
          assessmentNotes: {
            type: "string",
            description: "Optional assessment notes or reason for placement",
          },
        },
        required: ["patientId", "facilityId", "careLevel"],
      },
    },
  },
];
