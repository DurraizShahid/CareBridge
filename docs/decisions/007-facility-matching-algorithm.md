# ADR-007: Facility Matching Algorithm

## Status

Accepted

## Date

2026-07-08

## Context

When a social worker creates a placement, they need to find the best facility for a patient. Manually comparing facilities across care level, availability, insurance acceptance, location, and quality is time-consuming and error-prone. CareBridge needs an automated matching system that ranks facilities based on patient requirements.

Requirements:
- Match on care level compatibility (hard requirement)
- Consider facility availability (capacity vs. occupancy)
- Verify insurance acceptance (Medicare, Medicaid, private)
- Factor in geographic preference
- Surface quality indicators (ratings)
- Return a ranked shortlist, not a single answer (social worker makes final decision)

## Decision

Implement a **scoring-based matching algorithm** that evaluates each facility against patient criteria, assigns a numeric score, and returns the top 5 matches.

### Algorithm: `calculateFacilityScore(facility, patient, preferredLocation)`

#### Hard Disqualifiers (returns -1)

A facility is immediately excluded if any of these conditions are true:
1. Facility does not offer the required care level
2. Facility is at full capacity (`currentOccupancy >= capacity`)
3. Facility does not accept the patient's insurance

#### Scoring (base score: 50)

| Factor | Points | Logic |
|---|---|---|
| Availability | +`(capacity - currentOccupancy)` | More open beds = higher score |
| Rating | +`(rating * 5)` | Quality bonus (0-25 points) |
| City match | +10 | Patient's preferred city matches facility city |
| State match | +5 | Patient's preferred state matches (if city doesn't) |
| Waitlist | -`(waitlistDays)` | Longer waitlists reduce the score |

#### Insurance Matching

The `facilityAcceptsPatientInsurance()` function checks:
1. Patient has Medicare → facility `acceptsMedicare` must be true
2. Patient has Medicaid → facility `acceptsMedicaid` must be true
3. Other insurance → fuzzy string matching against `insuranceAccepted[]` array

#### Output

`computeMatchedFacilities()` runs the scoring against all facilities in the organization, filters out scores < 0, sorts descending, and returns the top 5 facility IDs. These are stored as `matchedFacilities` on the Placement record.

### Integration Points

- Called automatically on placement creation
- Called on placement update if relevant fields change (care level, insurance, preferred location)
- Social worker sees matched facilities on the placement detail page and can select one

## Alternatives Considered

### Manual selection only (no algorithm)
- Pros: Simple, no false confidence
- Cons: Defeats the purpose; social workers would need to compare dozens of facilities manually
- Rejected: Core product value is in intelligent matching

### Machine learning / collaborative filtering
- Pros: Could learn from historical placement outcomes
- Cons: Requires training data (cold start problem), complex infrastructure, hard to explain/debug
- Rejected: Premature for MVP; deterministic scoring is transparent and sufficient

### Weighted preference system (user-configurable weights)
- Pros: Social workers could tune what matters most
- Cons: Adds configuration complexity, most users would not tune weights
- Rejected: Fixed weights with sensible defaults are simpler; can add tuning later if needed

### External matching service / third-party API
- Pros: Could leverage larger datasets
- Cons: Vendor dependency, cost, latency, data privacy concerns with patient data
- Rejected: Matching logic is a core differentiator; keep it in-house

## Consequences

- The algorithm runs synchronously during placement creation (acceptable for current data volumes)
- Scoring is deterministic and explainable -- each factor contributes visible points
- Adding new scoring factors (e.g., specialist staff, accreditation) requires updating `calculateFacilityScore()`
- The algorithm only considers facilities within the user's organization; cross-org matching would require a separate flow
- Insurance matching uses fuzzy string comparison, which may produce false positives for ambiguous provider names
