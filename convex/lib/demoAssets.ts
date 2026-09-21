export const DEMO_SITE_PLAN = `
SITE PLAN — GARAGE TO ADU CONVERSION
1448 Alvarado St, Los Angeles, CA 90026
Scale: 1/8" = 1'-0" | Sheet A-1 | Preliminary plan check submittal

PARCEL SUMMARY
Lot area: 6,200 sq ft
Zoning: RD1.5
APN: 5422-014-028
Existing structure: detached garage 280 SF at northwest corner of rear yard
Proposed ADU: 420 SF garage conversion with kitchenette, bath, and separate entrance

DIMENSIONS & SETBACKS
Rear setback: 4 ft to south property line (dimension verified on sheet)
Side setback (west): 3 ft
Proposed ADU height: 16 ft to ridge
Parking: no replacement required — within 1/2 mile of Metro bus on Alvarado St

SITE NOTES
1. Convert existing detached garage to one-bedroom ADU; maintain open fire access on west driveway.
2. New sewer lateral tie-in at rear; existing panel upgrade shown on separate electrical sheet.
3. All dimensions per City of Los Angeles ADU ordinance and RD1.5 standards.
`.trim();

export const DEMO_STRUCTURAL = `
STRUCTURAL CALCULATIONS — GARAGE ADU CONVERSION
1448 Alvarado St, Los Angeles, CA 90026
Prepared for: Garage to ADU conversion permit submittal

SCOPE
Existing garage roof framing and east load-bearing wall to remain with new opening header.
Engineering calcs include ridge beam check, shear wall at north elevation, and foundation hold-downs.

DESIGN CRITERIA
2022 California Building Code | LADBS residential plan check
Roof live load: 20 psf
Floor dead load: 15 psf garage conversion zone

SUMMARY
Load-bearing garage wall reinforced for new 10'-0" opening; existing structure braced per calc package.
Structural calculations complete for plan check review.
`.trim();

export const DEMO_ASSET_MANIFEST = [
  {
    filename: "site-plan-garage-adu-detailed.txt",
    documentType: "site_plan",
    mimeType: "text/plain",
    description: "Scaled site plan with rear setback, height, zoning, and lot data for 1448 Alvarado.",
  },
  {
    filename: "structural-calcs-garage-adu.txt",
    documentType: "structural",
    mimeType: "text/plain",
    description: "Engineering calculations for garage conversion load-bearing modifications.",
  },
] as const;
