# GREENLIGHT

## Product Specification v0.1

### Working definition

**Greenlight is an AI permitting agent that turns a construction project into an executable path to approval.**

Greenlight does not primarily answer questions about building codes.

It constructs and maintains a machine-readable model of:

* the property
* the proposed project
* applicable jurisdictions
* applicable regulations
* permit pathways
* required evidence
* dependencies
* unresolved questions
* agency correspondence
* submissions
* approvals
* inspections
* regulatory changes

It continuously answers one question:

> **What is preventing this project from moving forward right now?**

Greenlight then works to remove those blockers, subject to explicit human authorization where external actions, representations, submissions, or consequential decisions are involved.

---

# 1. PRODUCT THESIS

Traditional permitting is organized around documents, agencies, webpages, PDFs, email threads, forms, and institutional knowledge.

The applicant experiences a project.

Government systems experience a collection of permits.

Greenlight creates the missing abstraction between them:

## The Permit Graph

A project becomes a dependency graph of machine-readable constraints.

```text
PROPERTY
   ↓
PROJECT INTENT
   ↓
JURISDICTION RESOLUTION
   ↓
REGULATORY SOURCES
   ↓
APPLICABLE REQUIREMENTS
   ↓
PERMIT PATHWAY
   ↓
EVIDENCE REQUIREMENTS
   ↓
APPLICATIONS
   ↓
REVIEWS / CORRECTIONS
   ↓
APPROVALS
   ↓
INSPECTIONS
   ↓
FINALIZATION
```

The atomic unit inside Greenlight is **not a PDF**.

It is a **requirement**.

Every requirement should ultimately have:

```text
Requirement
├── Rule
├── Authority
├── Jurisdiction
├── Applicability conditions
├── Source
├── Source version
├── Evidence required
├── Current evidence
├── Status
├── Dependencies
├── Conflicts
├── Verification state
├── Last checked
├── Communications
└── Change history
```

This preserves the strongest original Greenlight concept: persistent property state, regulation graph, constraint compiler, government inbox, and live execution workflow.

---

# 2. POSITIONING

## Primary positioning

> **Get your project permit-ready.**

Supporting line:

> Greenlight researches the rules, builds your approval path, identifies blockers, manages permitting correspondence, and keeps the project current as requirements change.

## Technical positioning

> **A compiler for construction regulation.**

This should appear in technical/investor material, not necessarily as the homepage headline.

## What Greenlight is not

Greenlight is not:

* a generic AI chatbot
* architectural design software
* CAD
* plan-drafting software
* a contractor marketplace
* a home-management dashboard
* a legal-advice product
* merely RAG over municipal codes
* merely a permit checklist generator
* merely an email copilot
* merely a document summarizer

Greenlight is the **execution layer between a construction project and the bureaucracy required to approve it**.

---

# 3. INITIAL MARKET WEDGE

Do not launch as "every permit everywhere."

Greenlight needs depth before breadth.

## Recommended first wedge

**Residential projects in one permitting jurisdiction**, with an initial emphasis on:

* detached ADUs
* attached ADUs
* garage conversions
* home additions
* decks / accessory structures where sufficiently documented

Los Angeles is a plausible launch jurisdiction because City Planning and LADBS publish relevant zoning, ADU, plan-check, building-record and permit resources publicly. LADBS explicitly exposes online permits, permit status, zoning/property information, plan-check information, ADU resources, and homeowner guides.

The earlier product direction also correctly favored deep support for one geography over nominal nationwide coverage.

## Initial users

### Primary

Homeowners undertaking non-trivial permitted construction.

### Secondary

* small residential architects
* permit expediters
* design-build firms
* general contractors
* ADU companies

### Later

* commercial developers
* multi-family developers
* solar installers
* restaurant operators
* tenant-improvement contractors
* real-estate investors
* institutional construction teams

---

# 4. CORE USER PROMISE

A Greenlight user should be able to begin with:

> **"I want to convert my detached garage into an ADU."**

and reach:

```text
PROJECT STATUS

Jurisdiction        Resolved
Permit pathway      Resolved
Requirements        34
Satisfied           19
Missing             8
Blocked             2
Needs verification  5

READINESS            56%

PRIMARY BLOCKER
Existing structure dimensions are not yet verified.

NEXT ACTION
Upload site survey or verify dimensions manually.
```

The software should become progressively more certain as evidence is added.

It should never disguise unknown information as resolved information.

---

# 5. FUNDAMENTAL PRODUCT PRINCIPLES

## 5.1 Evidence before assertion

Every externally sourced permitting conclusion must retain provenance.

Bad:

> Rear setback is 4 feet.

Greenlight:

```text
Rear setback
4 ft

Authority
Los Angeles municipal / applicable state provision

Source
[link]

Source retrieved
Sep 19, 2026

Applicability
Detached new-construction ADU

Verification
Verified against current source
```

If Greenlight cannot establish the requirement:

```text
STATUS
Needs verification

Why
Two applicable sources appear inconsistent.

Action
Request clarification from Planning Department
```

---

## 5.2 Unknown must remain unknown

No hallucinated parcel data.

No inferred permit fees presented as exact.

No fabricated contacts.

No invented filing requirements.

No fictional processing time.

No silent extrapolation from another jurisdiction.

Greenlight should have explicit states:

```text
KNOWN
INFERRED
UNVERIFIED
CONFLICTED
UNKNOWN
NOT APPLICABLE
```

For production, I would avoid exposing the word `INFERRED` as equivalent to established facts.

---

## 5.3 Agent actions must be inspectable

Every agent action generates an event.

```text
15:42:11  Property jurisdiction resolved
15:42:13  LADBS source discovered
15:42:18  Source retrieved
15:42:22  14 requirements extracted
15:42:25  9 requirements linked to existing evidence
15:42:31  3 conflicts detected
```

Users should never wonder:

> "What is the AI doing?"

---

## 5.4 Consequential external actions require approval

Research can be automatic.

Parsing can be automatic.

Classification can be automatic.

Drafting can be automatic.

External representation should default to approval.

Examples:

**No approval required**

* crawl public government webpage
* re-run rule analysis
* classify uploaded document
* compare regulatory versions
* generate internal checklist

**Approval required**

* email planning department
* represent facts about user's property
* submit application
* upload government form
* accept fee
* certify information
* respond to correction notice
* withdraw application

---

# 6. TOP-LEVEL INFORMATION ARCHITECTURE

Greenlight should have six primary surfaces.

```text
GREENLIGHT

01  PROJECT
02  GRAPH
03  REQUIREMENTS
04  DOCUMENTS
05  INBOX
06  ACTIVITY
```

And two secondary surfaces:

```text
PROPERTY
SOURCES
```

Do not use a conventional SaaS sidebar full of 14 generic menu items.

The application should feel closer to:

**industrial control system + CAD inspector + mission control + modern developer tool**

than:

**generic AI SaaS dashboard**.

---

# 7. VISUAL DIRECTION

## Design character

Greenlight should feel:

* engineered
* procedural
* precise
* dense without being cluttered
* authoritative
* mechanically responsive
* utilitarian
* slightly brutalist
* highly legible
* operational

Avoid:

* purple AI gradients
* floating glass cards
* giant rounded rectangles
* excessive white space
* robot illustrations
* sparkle icons
* generic "Ask AI" bubbles
* rainbow status badges
* huge marketing typography inside the authenticated product

## Visual reference vocabulary

Think conceptually:

* aviation cockpit
* building inspection stamp
* construction drawing
* terminal
* control room
* blueprint annotation
* Git diff
* issue tracker
* GIS inspector
* CAD property panel

Do not literally clone any of them.

---

# 8. DESIGN SYSTEM

## Typography

Primary UI:

**Inter / Geist / similar highly legible grotesk**

Machine/data fields:

**JetBrains Mono / IBM Plex Mono / equivalent**

Use monospace intentionally for:

* permit IDs
* parcel IDs
* rule citations
* statuses
* timestamps
* dimensions
* coordinates
* event IDs

Not for body copy.

## Shapes

Border radius:

```text
0 to 6px
```

No oversized pills except tiny status tokens.

## Borders

Strong borders should be structural.

Example:

```text
1px neutral
2px emphasized active state
```

Use panels more like instrument housings than cards.

## Status vocabulary

Use semantic status shapes plus text, not color alone.

```text
● VERIFIED
▲ REVIEW
■ BLOCKED
○ MISSING
◇ PENDING
× CONFLICT
```

## Density

Desktop-first.

Permit work is document-heavy and benefits from large screens.

Responsive mobile should focus on:

* notifications
* approvals
* inbox
* upload
* status
* comments

Do not try to reproduce the entire graph editor on mobile.

---

# 9. THE GREENLIGHT COMMAND BAR

The most prominent AI interaction should not be a chat window.

Use a universal command surface:

```text
┌────────────────────────────────────────────────────────────┐
│ GL >  Ask, change project assumptions, or issue a command │
└────────────────────────────────────────────────────────────┘
```

Examples of supported intent:

```text
Change proposed height to 18 ft

Why is parking marked satisfied?

Show the source for the setback requirement

What changed since yesterday?

Draft a clarification email about the side setback

Which blocker should I solve first?

Re-run this project against current regulations

Upload revised structural calculations
```

Results should alter or inspect structured project state.

The user is interacting with the **project model**, not holding an endless conversation.

---

# 10. ONBOARDING FLOW

## Screen 1: Landing

Headline:

> **Get your project permit-ready.**

Subhead:

> Greenlight researches your jurisdiction, compiles the requirements, identifies blockers, and manages the path to approval.

Primary CTA:

**Start a project**

Secondary:

**How Greenlight works**

No 15-feature marketing grid.

---

## Screen 2: Project intent

Single major question:

> **What are you trying to build?**

Input supports natural language.

Optional structured selectors appear below:

```text
Property address
Project type
Existing / proposed
```

User can begin with natural language first.

---

## Screen 3: Property resolution

Greenlight resolves:

* normalized address
* jurisdiction
* applicable city
* applicable county
* parcel identifier if available from authoritative data
* zoning sources
* authority boundaries

UI:

```text
PROPERTY RESOLUTION

Address
[resolved address]

AUTHORITY STACK

City          RESOLVED
County        RESOLVED
State         RESOLVED

Parcel ID     PENDING / RESOLVED
Zoning        PENDING / RESOLVED
```

Every retrieved fact gets provenance.

User confirms property identity before Greenlight proceeds.

---

## Screen 4: Existing information

Ask users for available evidence.

```text
WHAT DO YOU ALREADY HAVE?

[ ] Site survey
[ ] Existing plans
[ ] Property records
[ ] Previous permits
[ ] Proposed drawings
[ ] Contractor documents
[ ] Engineering documents
[ ] Nothing yet
```

Allow drag/drop.

Do not force completion.

---

## Screen 5: Compilation

This should be visually memorable.

Not a spinner.

Display the compiler running:

```text
COMPILING PROJECT

01 Jurisdiction                 COMPLETE
02 Authority sources            COMPLETE
03 Project classification       COMPLETE
04 Applicable regulations       RUNNING
05 Permit pathway               WAITING
06 Evidence requirements        WAITING
07 Dependency graph             WAITING
```

Below:

```text
Sources discovered: 18
Sources retrieved: 11
Rules extracted: 27
Conflicts detected: 1
```

These must reflect real backend events, not fake animated counters.

Convex's realtime query model is particularly suitable here because client subscriptions can update as backend state changes.

---

## Screen 6: First project assessment

The payoff screen.

```text
PROJECT COMPILED

GREENLIGHT READINESS
42%

PERMIT PATH
4 stages

REQUIREMENTS
31

CURRENT BLOCKERS
5

UNKNOWN
3

NEXT REQUIRED ACTION
Verify dimensions of existing garage
```

CTA:

**Open project**

---

# 11. PROJECT CONTROL ROOM

This is the default project screen.

Layout:

```text
┌──────────────────────────────────────────────────────────────────┐
│ GREENLIGHT / 1448 ALVARADO / GARAGE → ADU      READINESS 62%   │
├──────────────┬───────────────────────────────────┬───────────────┤
│ PROJECT TREE │ CURRENT STATE                     │ NEXT ACTION   │
│              │                                   │               │
│ Property     │ Permit Path                       │ Missing       │
│ Planning     │ ██████░░░░ 62%                   │ survey        │
│ Building     │                                   │               │
│ Electrical   │ Blocked  2                        │ [Resolve]     │
│ Plumbing     │ Missing  4                        │               │
│ Inspection   │ Review   3                        │               │
├──────────────┴───────────────────────────────────┴───────────────┤
│ EVENT STREAM                                                      │
└──────────────────────────────────────────────────────────────────┘
```

## Top header

Always show:

* project
* property
* current phase
* readiness
* last verified
* agent status

Example:

```text
LAST REGULATION CHECK  12m ago
AGENT                  IDLE
INBOX                  2 unread
```

---

# 12. READINESS

Readiness should not simply be arbitrary AI confidence.

Define it mechanically.

For example:

```text
eligible weighted requirements satisfied
-----------------------------------------
all currently evaluable required constraints
```

Keep separate:

### Permit readiness

Have the known requirements been satisfied?

### Evidence completeness

Does Greenlight possess evidence for required facts?

### Verification health

Are important sources current and non-conflicted?

Never compress these into one misleading number.

Dashboard:

```text
PERMIT READINESS        62%
EVIDENCE COMPLETENESS   71%
SOURCE HEALTH           94%
```

---

# 13. REQUIREMENT EXPLORER

This becomes one of Greenlight's most important screens.

Table:

```text
ID       REQUIREMENT               STATUS        AUTHORITY       SOURCE
R-014    Rear setback              REVIEW        City            §...
R-018    Max structure height      VERIFIED      City            §...
R-021    Parking requirement       SATISFIED     State           §...
R-025    Structural calculations   MISSING       Building Dept.   Bulletin...
```

Filters:

* blocking
* missing
* unresolved
* satisfied
* changed
* by authority
* by permit stage
* by evidence type

Click requirement.

Inspector drawer opens.

```text
R-014

REAR SETBACK

STATUS
NEEDS REVIEW

RULE
[structured expression]

APPLICABILITY
Detached ADU
Current property configuration

EVIDENCE
Site plan v3

AUTHORITY
[agency]

SOURCE
[official URL]
Retrieved Sep 19 2026

SOURCE TEXT
[relevant short excerpt]

REASONING
Structured explanation of how rule applies.

DEPENDENCIES
R-009 Lot boundary verified

HISTORY
Sep 19  Rule discovered
Sep 19  Evidence associated
Sep 19  Conflict detected
```

---

# 14. SOURCE PROVENANCE

Every important conclusion gets a **source drawer**.

The source drawer should display:

```text
SOURCE

Title
Authority
URL
Retrieved
Effective date if known
Document version if known

RELEVANT SECTION
...

USED BY
R-014
R-018
R-033

SOURCE STATUS
CURRENT
```

Allow:

**Open original**

**View captured version**

**See extraction**

**Report incorrect interpretation**

This is critical for trust.

---

# 15. PERMIT GRAPH

This is Greenlight's signature visual feature.

Not a decorative flowchart.

It should represent actual dependency state.

Example:

```text
PROPERTY VERIFIED
      │
      ▼
ZONING ELIGIBILITY ────── VERIFIED
      │
      ├── HEIGHT ───────── VERIFIED
      │
      ├── SETBACK ──────── BLOCKED
      │
      └── PARKING ──────── VERIFIED
      │
      ▼
SITE PLAN ──────────────── REVIEW
      │
      ▼
BUILDING APPLICATION ──── LOCKED
      │
      ├── STRUCTURAL ───── MISSING
      │
      └── ENERGY ───────── MISSING
      ▼
PLAN CHECK ─────────────── LOCKED
```

Nodes are interactive.

Clicking a blocked node shows:

* why blocked
* dependency
* source
* evidence
* action
* owner

---

# 16. CHANGE IMPACT COMPILER

This should become Greenlight's "wow" interaction.

User changes a structured project parameter.

Example command:

```text
Set proposed ADU height to 18 ft.
```

Greenlight must not immediately mutate canonical project state.

It produces a **change set**.

```text
PROPOSED CHANGE

Height
15 ft → 18 ft

IMPACT ANALYSIS

Requirements changed      3
Requirements invalidated  1
Documents affected        2
Permit pathway changed    0

BLOCKER CREATED
Rear-setback exemption may no longer apply.

AFFECTED
Site Plan v2
Elevation Drawing v3

[Review details]

[Apply change]
```

This interaction is effectively:

> `git diff` for construction assumptions.

Internally:

```text
current project state
       ↓
proposed mutation
       ↓
recompile affected constraints
       ↓
calculate dependency diff
       ↓
present impact
       ↓
user accepts
       ↓
commit
```

This feature is one of the strongest possible YC demo moments.

---

# 17. DOCUMENT VAULT

Documents are evidence, not folders.

Interface:

```text
DOCUMENTS

Site Plan v3.pdf
CLASSIFIED     Site plan
USED BY        8 requirements
SUPERSEDES     Site Plan v2.pdf
STATUS         Current

StructuralCalcs.pdf
CLASSIFIED     Structural calculations
USED BY        3 requirements
STATUS         Needs review
```

On upload:

1. store original
2. compute metadata
3. extract text where applicable
4. classify document
5. detect version relationship
6. identify facts
7. propose evidence links
8. ask user to confirm consequential extracted facts where needed

Never silently overwrite earlier documents.

Maintain version history.

---

# 18. DOCUMENT INSPECTOR

Split view:

```text
PDF / IMAGE               EXTRACTED FACTS

                           Structure height   15 ft
                           Floor area         ...
                           Revision           ...
                           Date               ...

                           USED BY
                           R-014
                           R-018
```

Clicking a fact highlights its location in the document when technically feasible.

Every extracted datum stores:

```text
documentId
page
boundingBox if available
rawText
normalizedValue
extractionMethod
confidence
verificationStatus
```

---

# 19. PROJECT INBOX

Every project receives its own AgentMail inbox.

For example:

```text
gl-8F3K2@projects.greenlight...
```

Use a verified Greenlight domain in production.

AgentMail supports custom-domain inboxes as well as send/receive/reply, attachments, threading, labels, and inbound webhooks.

## Inbox purpose

This is not merely an email client.

Incoming correspondence should be treated as potential **state mutations**.

Flow:

```text
EMAIL RECEIVED
     ↓
store immutable message
     ↓
identify project / sender / thread
     ↓
extract attachments
     ↓
classify message
     ↓
extract candidate facts
     ↓
extract requested actions
     ↓
detect deadlines
     ↓
link requirements
     ↓
propose state changes
     ↓
apply safe changes
     ↓
request approval where required
```

---

# 20. EMAIL DECISION EXTRACTION

When an agency email arrives, Greenlight should display:

```text
INCOMING MESSAGE

Planning Department
Sep 19 11:43

DETECTED

DECISION
Conditional applicability

REQUIREMENT IMPACT
R-014 Rear setback

NEW CONDITION
[condition]

PROJECT IMPACT
Readiness +4%

ACTION REQUIRED
Update proposed dimension

SOURCE
This email

[Review extraction]
```

The original email must always remain accessible.

---

# 21. COMPOSE WITH GREENLIGHT

A user should be able to select a blocker:

**Request clarification**

Greenlight generates:

```text
RECIPIENT
Verified agency contact

PURPOSE
Clarify applicability of R-014

PROJECT FACTS USED
Property ...
Project type ...
Proposed height ...
Relevant section ...

ATTACHMENTS
Site Plan v3

DRAFT
[email]

[Approve & send]
```

Before sending, Greenlight should show exactly which project facts it will represent externally.

This prevents invisible hallucinations from becoming official correspondence.

---

# 22. AGENT ACTION CENTER

Separate page:

```text
AGENT ACTIONS

READY FOR APPROVAL
3

RUNNING
1

COMPLETED TODAY
14

FAILED
1
```

Action types:

* crawl source
* recompile requirements
* classify document
* extract evidence
* monitor source
* draft email
* process inbound email
* prepare application
* validate requirement
* request clarification
* recalculate project impact

Each action stores:

```text
actionId
type
trigger
initiator
input references
model
tool calls
result
state changes
approval status
startedAt
completedAt
failure
retry history
```

---

# 23. AUTONOMY SETTINGS

Per project:

```text
AGENT PERMISSIONS

Research public sources          AUTO
Re-check known sources           AUTO
Process incoming email           AUTO
Extract document facts           AUTO
Update non-consequential state   AUTO

Draft external email             AUTO DRAFT
Send external email              REQUIRE APPROVAL
Submit forms                     REQUIRE APPROVAL
Represent project facts          REQUIRE APPROVAL
Pay fees                         DISABLED
```

This should be explicit, not buried in settings.

---

# 24. SOURCE MONITORING

Every active project should create monitoring targets for high-value regulatory sources.

Firecrawl `/monitor` can watch pages or sites on schedules and emit structured changes through webhook, allowing Greenlight to react to meaningful updates rather than repeatedly ingesting unchanged pages.

Flow:

```text
SOURCE CHANGE
      ↓
Firecrawl monitor webhook
      ↓
snapshot / diff stored
      ↓
affected requirement lookup
      ↓
recompile impacted constraints
      ↓
determine project impact
      ↓
notify user only if material
```

UX:

```text
REGULATION CHANGE

2 active project requirements affected

SOURCE
[official source]

CHANGED
Sep 19 2026

PROJECT IMPACT

R-018        re-verification required
R-023        unchanged after recompilation

[Review change]
```

---

# 25. SOURCE HEALTH

Each source should have:

```text
OFFICIAL / SECONDARY
CURRENT / STALE / UNREACHABLE
LAST RETRIEVED
LAST CHANGED
DEPENDENT REQUIREMENTS
```

Official sources rank above:

* blogs
* contractor pages
* legal summaries
* forum posts

Secondary sources may assist discovery but should not silently become authoritative.

---

# 26. PROJECT TIMELINE

A project needs a chronological audit surface.

```text
SEP 19

15:41 Project created
15:42 Jurisdiction resolved
15:44 Regulatory crawl completed
15:45 Permit graph compiled
16:02 Site plan uploaded
16:04 8 requirements satisfied
16:06 Height conflict detected
16:18 Clarification email drafted
16:21 User approved email
16:22 Message sent

SEP 20

09:14 Agency reply received
09:15 Reply classified
09:15 Requirement R-014 updated
```

Every change should be attributable to:

* user
* agent
* external agency
* external web source
* system

---

# 27. APPLICATION ASSEMBLY

Later-stage but strategically important.

Greenlight creates an application package manifest:

```text
BUILDING PERMIT PACKAGE

Required
✓ Application form
✓ Site plan
✓ Floor plan
✓ Elevations
✕ Structural calculations
✓ Ownership information

Completeness
83%

Submission availability
BLOCKED

Reason
Structural calculations missing
```

No submission until requirements are satisfied.

---

# 28. CORRECTION NOTICE MODE

This should eventually be a major wedge.

User uploads a real plan-check correction letter.

Greenlight:

1. preserves original
2. identifies individual corrections
3. maps each correction to project requirements
4. assigns status
5. links affected drawings/documents
6. creates dependencies
7. tracks resolution
8. drafts agency response where appropriate

UI:

```text
PLAN CHECK CORRECTIONS

12 total

Resolved      5
In progress   4
Blocked       2
Unclear       1
```

Individual correction:

```text
C-007

AGENCY COMMENT
[original]

GREENLIGHT INTERPRETATION
...

AFFECTED
Drawing A3.1
Requirement R-018

OWNER
Architect

STATUS
IN PROGRESS
```

This turns Greenlight into a collaboration product later.

---

# 29. INSPECTION MODE

After permits issue:

```text
INSPECTIONS

Foundation       REQUIRED
Framing          REQUIRED
Electrical rough REQUIRED
Final            LOCKED
```

Eventually Greenlight can track:

* required inspections
* scheduling information
* prerequisites
* inspection correspondence
* results
* corrections
* reinspection

Do not build this first unless the initial jurisdiction exposes sufficient reliable data.

---

# 30. NOTIFICATIONS

Only notify on actionable change.

Good:

> Agency reply received. One blocker is now resolved and a new height condition was added.

Good:

> Official ADU guidance changed. Greenlight is re-verifying two requirements in your active project.

Bad:

> Greenlight found 7 new webpages.

The user cares about **project impact**, not crawling.

---

# 31. HOME SCREEN

Do not create analytics for analytics' sake.

For multiple projects:

```text
GREENLIGHT

ACTIVE PROJECTS                         3

1448 Alvarado
Garage → ADU
READINESS 62%
BLOCKED 2
NEXT: Upload structural calculations

...

AGENT NEEDS YOU                         2

Approve planning clarification
Verify property dimension

RECENT EXTERNAL CHANGES                 1

Municipal source updated
1 active project affected
```

---

# 32. GLOBAL PROPERTY RECORD

Reuse the best HomeOps concept without becoming HomeOps.

A property persists independently of individual projects.

```text
PROPERTY

Identity
Jurisdictions
Parcel data
Known zoning facts
Existing structures
Prior Greenlight projects
Reusable documents
Prior permits
Verified facts
```

If user starts a second project, Greenlight reuses prior verified evidence.

This creates compounding product value.

---

# 33. DATA MODEL

Recommended conceptual Convex tables.

## organizations

```text
name
ownerId
plan
createdAt
```

## users

```text
authSubject
name
email
organizationIds
```

## properties

```text
organizationId
address
normalizedAddress
parcelIdentifier
coordinates
jurisdictionIds[]
createdBy
createdAt
```

## propertyFacts

```text
propertyId
key
value
unit
status
sourceType
sourceId
verifiedAt
supersededBy
```

## jurisdictions

```text
name
type
parentJurisdictionId
officialDomains[]
```

## projects

```text
propertyId
organizationId
name
projectType
description
phase
status
readiness
evidenceCompleteness
sourceHealth
agentInboxId
createdAt
```

## projectParameters

```text
projectId
key
value
unit
source
verificationStatus
version
```

## permits

```text
projectId
authorityId
permitType
status
externalPermitId
dependencies[]
```

## requirements

```text
projectId
canonicalRuleId
title
description
status
severity
authorityId
applicability
verificationStatus
```

## requirementVersions

```text
requirementId
version
ruleExpression
sourceSnapshotIds[]
effectiveAt
supersededAt
```

## dependencies

```text
fromEntityType
fromEntityId
toEntityType
toEntityId
relationship
```

## evidence

```text
projectId
requirementId
type
sourceEntityId
status
value
unit
verificationStatus
```

## documents

```text
projectId
propertyId
storageId
filename
mimeType
documentType
version
supersedesId
uploadedBy
createdAt
```

## documentFacts

```text
documentId
key
rawValue
normalizedValue
page
bbox
confidence
verificationStatus
```

## sources

```text
jurisdictionId
url
authority
official
sourceType
monitorId
```

## sourceSnapshots

```text
sourceId
retrievedAt
contentHash
storageReference
changeStatus
previousSnapshotId
```

## communications

```text
projectId
threadId
providerMessageId
direction
sender
recipients
subject
bodyReference
receivedAt
classification
```

## communicationExtractions

```text
communicationId
type
value
status
linkedRequirementIds[]
```

## agentRuns

```text
projectId
trigger
status
startedAt
finishedAt
model
```

## agentSteps

```text
runId
type
status
inputRefs[]
outputRefs[]
startedAt
completedAt
```

## proposedChanges

```text
projectId
origin
changes[]
impact
status
approvedBy
```

## approvals

```text
projectId
actionType
actionPayload
requestedAt
status
resolvedAt
resolvedBy
```

## events

Append-only audit stream.

```text
projectId
actorType
actorId
eventType
entityType
entityId
payload
createdAt
```

---

# 34. CONVEX ARCHITECTURE

Convex should own canonical application state.

Queries:

```text
getProjectControlRoom
getRequirementGraph
getBlockingRequirements
getProjectTimeline
getPendingApprovals
getProjectInbox
getRequirementInspector
getSourceHealth
getAgentActivity
```

These become realtime subscriptions. Convex queries are automatically subscribable/reactive, which is ideal for agent runs, incoming email, document processing, and regulatory changes updating the interface while the user is looking at it.

Mutations:

```text
createProject
confirmProperty
uploadDocumentMetadata
verifyFact
proposeParameterChange
applyApprovedChangeSet
approveAgentAction
rejectAgentAction
linkEvidence
markRequirementNotApplicable
```

Mutations should enforce invariants transactionally.

Actions:

```text
crawlJurisdiction
processSource
compileRequirements
analyzeDocument
sendAgentMail
processInboundMail
runImpactAnalysis
startSourceMonitor
```

Convex recommends using actions for external calls and keeping deterministic state-management logic in queries and mutations where possible.

HTTP actions:

```text
/webhooks/agentmail
/webhooks/firecrawl
```

Convex HTTP actions can receive external HTTP requests and then invoke internal queries/mutations/actions.

---

# 35. AGENTMAIL ARCHITECTURE

Use one inbox per active project initially.

Creation:

```text
project created
     ↓
AgentMail inbox provisioned
     ↓
inbox ID stored in Convex
     ↓
webhook configured
```

Inbound:

```text
message.received
     ↓
Convex HTTP action
     ↓
verify webhook
     ↓
persist metadata
     ↓
fetch full content if needed
     ↓
store attachments
     ↓
schedule analysis
     ↓
propose state changes
```

AgentMail recommends webhooks for production inbound-email processing rather than polling.

---

# 36. FIRECRAWL ARCHITECTURE

Use different Firecrawl capabilities for different jobs.

## Discovery

Find official relevant pages.

## Crawl

Build jurisdiction corpus.

Firecrawl Crawl supports whole-site discovery, rendered pages, path constraints and streaming crawl results through webhooks/WebSockets/polling.

## Scrape

Retrieve specific authoritative pages.

## Parse

Process PDFs where appropriate.

## Monitor

Track active regulatory sources.

## Change handling

```text
Firecrawl diff
      ↓
sourceSnapshot
      ↓
requirements linked to source
      ↓
targeted recompilation
      ↓
impact changeSet
      ↓
event
      ↓
user notification if material
```

Do not recompile the entire jurisdiction every time one source changes.

---

# 37. OPENAI / REASONING ARCHITECTURE

The model should operate over structured tasks.

Avoid giant prompts asking:

> "Understand this entire permitting project."

Use bounded operations:

```text
classify_project
extract_rule
determine_applicability
normalize_requirement
identify_dependency
extract_document_fact
classify_email
extract_agency_decision
map_evidence
detect_conflict
generate_change_impact
draft_clarification
```

Every structured AI output should be schema-validated.

Do not commit model output directly to canonical state where meaningful risk exists.

Pipeline:

```text
model output
   ↓
schema validation
   ↓
deterministic validation
   ↓
source/evidence linkage
   ↓
confidence / review policy
   ↓
canonical mutation OR human review
```

---

# 38. REQUIREMENT ENGINE

This is Greenlight's long-term moat.

Represent rules in normalized form when possible.

Conceptually:

```text
IF
project.type = detached_ADU
AND
project.height > X

THEN
setback.rear >= Y

AUTHORITY
...

SOURCE
...

EFFECTIVE
...
```

Not every regulation will reduce cleanly to executable logic.

Therefore requirements need modes:

```text
DETERMINISTIC
MODEL_INTERPRETED
HUMAN_VERIFICATION_REQUIRED
AGENCY_CLARIFICATION_REQUIRED
```

This distinction is crucial.

---

# 39. CONFLICT ENGINE

Greenlight should actively detect:

### Source conflict

Two authorities appear inconsistent.

### Evidence conflict

Property documents disagree.

### Design conflict

Project assumption violates rule.

### Version conflict

New regulation supersedes stored interpretation.

### Correspondence conflict

Agency statement differs from stored rule interpretation.

UI:

```text
CONFLICT DETECTED

Municipal guidance
vs.
Agency email

Affected requirement
R-014

Greenlight will not resolve this automatically.

Recommended action
Request clarification.
```

---

# 40. AUDITABILITY

For any state change, user can click:

**Why?**

Greenlight displays:

```text
CHANGE

R-014
REVIEW → SATISFIED

TRIGGER
Agency email received

EVIDENCE
Message ID...
Sep 20 2026

EXTRACTION
...

RULE
...

AGENT RUN
AR-8821

APPLIED
Sep 20 2026 09:15
```

This is essential for a serious construction product.

---

# 41. SECURITY MODEL

At minimum:

* strict organization isolation
* authorization checks on every project query/mutation
* encrypted provider secrets
* private document storage
* webhook signature validation
* idempotency for inbound webhooks
* idempotency for outbound actions
* attachment malware handling where possible
* no untrusted email content treated as system instruction
* no source webpage content treated as agent instruction
* bounded outbound communication
* immutable audit event history
* sensitive-data logging restrictions

## Prompt injection

Assume municipal webpages and inbound emails can contain malicious instructions.

External text is **data**, never instruction.

Tool permissions must be enforced in application logic rather than delegated solely to the model.

---

# 42. FAILURE HANDLING

Every agent action needs:

```text
PENDING
RUNNING
SUCCEEDED
FAILED_RETRYABLE
FAILED_FINAL
WAITING_APPROVAL
CANCELLED
```

No indefinite spinner.

Example:

```text
SOURCE RETRIEVAL FAILED

Official source returned 503.

Last successful snapshot
Sep 18 2026

Project conclusions are still based on that version.

[Retry]
```

---

# 43. EMPTY STATES

Use operational empty states.

Bad:

> Nothing here yet 🎉

Greenlight:

```text
NO PROJECT DOCUMENTS

Greenlight currently has no project-specific evidence.

Upload:
• site plan
• survey
• existing permit
• project drawing

[Upload document]
```

---

# 44. SEARCH

Global search should understand structured entities:

```text
rear setback
R-014
site plan
planning email
height
§12...
```

Search across:

* requirements
* documents
* document facts
* sources
* correspondence
* permit IDs
* project events

---

# 45. COMMAND PALETTE

Keyboard-first.

`⌘K`

Commands:

```text
Upload document
Change project parameter
Open requirement
Show blockers
Draft agency email
Recompile project
View graph
View source changes
Create project
```

This contributes strongly to the industrial/tooling feel.

---

# 46. COLLABORATION

Post-hackathon:

Roles:

```text
Owner
Architect
Contractor
Engineer
Permit consultant
Viewer
```

Assign blockers.

```text
Structural calculations
OWNER: Structural engineer
DUE: ...
```

External collaborators should not automatically get access to all property material.

---

# 47. MVP FOR HACKATHON

Build the smallest **real** version of the full thesis.

## Must work

1. Authentication
2. Create real project
3. Enter real supported property address
4. Resolve supported jurisdiction
5. Crawl real official sources
6. Store real source snapshots
7. Extract structured requirements
8. Show source provenance
9. Upload real project documents
10. Extract real document facts
11. Map evidence to requirements
12. Compute project blockers
13. Build real dependency graph
14. Create real AgentMail project inbox
15. Receive real inbound email
16. Parse incoming message
17. Link email to requirement
18. Draft real clarification email
19. Human approval
20. Send real email
21. Display delivery/inbound state
22. Monitor at least one real official source
23. Process real Firecrawl change event
24. Re-evaluate affected requirement
25. Maintain Convex realtime activity stream
26. Record complete event history

No fake permit approvals.

No fake agency responses.

No seeded "government replied!" demo.

For the demo, communicate with an actual test inbox you control while clearly presenting it as a test correspondence loop, or use a genuine agency interaction if you have received one naturally.

---

# 48. FEATURES TO DEFER

Do not attempt during initial build:

* nationwide jurisdiction coverage
* automatic official permit submission
* payments
* contractor marketplace
* architectural drawing generation
* code-compliant CAD generation
* full inspection scheduling
* insurance
* financing
* home-maintenance features
* autonomous fee payments
* dozens of construction verticals

These dilute the core.

---

# 49. POST-HACKATHON V1

After proof of concept:

### Jurisdiction onboarding system

Internal tooling for adding and validating municipalities.

### Correction notice workflow

Critical for professional users.

### Team collaboration

Architect/contractor/client.

### Project templates

Known permit pathways.

### Application package generation

Structured manifests and downloadable submission packets.

### Portfolio view

For architects / ADU builders managing multiple projects.

### Regulation-diff triage

Admin system for validating changed rules.

### Source-quality scoring

Authority-aware provenance.

---

# 50. LONG-TERM PRODUCT

Greenlight eventually becomes:

> **The operating system between a building project and regulatory approval.**

Potential lifecycle:

```text
Feasibility
   ↓
Entitlements
   ↓
Permit preparation
   ↓
Submission
   ↓
Plan check
   ↓
Corrections
   ↓
Permit issuance
   ↓
Inspections
   ↓
Final approval
```

Do not position this whole roadmap on day one.

Earn each stage.

---

# 51. INTERNAL ADMIN CONSOLE

You need this from the beginning.

Screens:

```text
Jurisdictions
Sources
Source failures
Requirement extraction review
Project compiler runs
Agent runs
Email delivery
Webhook failures
Source monitors
User-reported interpretation issues
```

Because permitting errors cannot be debugged from production logs alone.

---

# 52. QUALITY / EVALUATION SYSTEM

Before claiming a jurisdiction is supported, maintain a benchmark dataset.

Evaluate:

### Retrieval

Did Greenlight identify required authoritative sources?

### Extraction

Did it capture the correct requirement?

### Citation

Does the cited source actually support the rule?

### Applicability

Was the rule correctly applied to the project?

### Evidence mapping

Did Greenlight associate appropriate evidence?

### Conflict detection

Did it recognize inconsistent evidence?

### Change impact

Did parameter changes invalidate correct downstream constraints?

### Correspondence extraction

Did inbound agency email produce correct state changes?

Maintain human-reviewed gold cases.

Do not evaluate solely using another LLM as judge.

---

# 53. PRODUCT METRICS

Hackathon vanity metric:

```text
Projects created
```

Useful startup metrics:

```text
Time to first compiled permit path
% requirements with authoritative provenance
% blocking requirements resolved through Greenlight
Time from correction received → resolution plan
Project return frequency
Emails handled per project
Documents reused across projects
Projects reaching permit-ready state
User overrides / incorrect interpretations
Material regulatory changes detected
```

Long term:

```text
Time-to-permit reduction
Number of submission cycles
Correction count
Permit approval rate
```

Be careful making causal claims until properly measured.

---

# 54. YC STORY

The pitch should not be:

> We built an AI agent using Convex, Firecrawl and AgentMail.

Those are implementation choices.

Pitch:

> **Construction permitting is still managed through PDFs, government websites, email threads, consultants, and tribal knowledge. Greenlight turns every project into a live graph of rules, evidence, dependencies, correspondence and approvals. Its agent identifies what is blocking the project and works through those blockers until the project is permit-ready.**

Then show:

```text
User changes project
        ↓
Graph recompiles
        ↓
Constraint breaks
        ↓
Greenlight identifies affected documents
        ↓
Greenlight prepares agency clarification
        ↓
Human approves
        ↓
Agent emails agency
        ↓
Reply arrives
        ↓
Project state updates live
```

That is the company.

---

# 55. HACKATHON DEMO FLOW

Keep under three minutes.

## 0:00 to 0:20

Create project:

> Garage conversion to ADU.

Enter real supported property.

---

## 0:20 to 0:45

Show Greenlight compiling:

* jurisdiction
* official sources
* requirements
* permit graph

Open one real source citation.

---

## 0:45 to 1:10

Upload a real relevant document.

Show facts extracted.

Watch readiness update through Convex.

---

## 1:10 to 1:40

Change a parameter.

Show Change Impact:

```text
1 requirement invalidated
2 documents affected
1 new blocker
```

This is the signature moment.

---

## 1:40 to 2:10

Open blocker.

Generate clarification email.

Show exact facts being represented.

Approve.

Send through AgentMail.

---

## 2:10 to 2:35

Send a real reply from the test recipient.

AgentMail webhook hits Greenlight.

Convex UI updates live.

Show extracted decision/state update.

---

## 2:35 to 2:55

Show Firecrawl source monitoring.

Open a real source snapshot/change-monitor screen.

Explain:

> Greenlight doesn't just research the rules once. It keeps the project synchronized with the authoritative web.

---

## 2:55 to 3:00

Close with:

> **Greenlight is a compiler for construction regulation.**

Logo.

Done.

---

# 56. FRONTEND ROUTES

Recommended:

```text
/
 /login
 /projects
 /projects/new
 /projects/:projectId
 /projects/:projectId/graph
 /projects/:projectId/requirements
 /projects/:projectId/documents
 /projects/:projectId/inbox
 /projects/:projectId/activity
 /properties/:propertyId
 /sources/:sourceId
 /approvals
 /settings
```

Admin:

```text
/internal/jurisdictions
/internal/sources
/internal/runs
/internal/evaluations
/internal/webhooks
```

---

# 57. PRODUCT LANGUAGE

Use:

* compile
* requirement
* evidence
* verify
* blocker
* authority
* source
* project state
* change impact
* action required
* approval
* dependency
* correspondence
* revision
* permit path

Avoid:

* magical
* intelligent
* AI-powered everywhere
* effortless
* autopilot
* revolutionary
* hallucination
* chatbot
* copilot

The agent should feel serious because the product is serious.

---

# 58. BRAND DIRECTION

## Name

**Greenlight**

Very strong.

It communicates:

* permission
* progress
* approval
* readiness
* go/no-go state

without locking the company into "permits" forever.

## Brand mark concept

Avoid literal traffic light.

Possible abstract directions:

### Option A: Approval aperture

A geometric mark where incomplete lines resolve into one continuous opening.

### Option B: Constraint grid

A technical grid with one clear path through it.

### Option C: Registration mark

Inspired by architecture drawing registration/crop marks, with one resolved quadrant.

### Option D: GL monogram

Extremely simple industrial monogram built from right angles.

---

# 59. HOMEPAGE STRUCTURE

## Hero

**Get your project permit-ready.**

Greenlight researches the rules, compiles the approval path, identifies blockers, and manages permitting correspondence.

`[Start a project]`

Visual should be actual product UI, not abstract generated artwork.

## Section 2

**Know exactly what's blocking approval.**

Show requirement graph.

## Section 3

**Every requirement has a source.**

Show provenance inspector.

## Section 4

**Change the project. See what breaks.**

Show compiler diff.

## Section 5

**Give the project its own inbox.**

Show agency correspondence becoming state.

## Section 6

**Regulations change. Greenlight notices.**

Show source diff.

## CTA

**Compile your project.**

---

# 60. THE ONE SCREEN THAT SHOULD DEFINE THE PRODUCT

If someone sees only one screenshot, show:

```text
GREENLIGHT / PROJECT 8F3K

PERMIT READINESS  68%

PROJECT GRAPH
──────────────────────────────────────
Property          ● VERIFIED
Zoning            ● VERIFIED
Setback           ■ BLOCKED
Height            ● VERIFIED
Site Plan         ▲ REVIEW
Structural        ○ MISSING
Building Permit   ◇ LOCKED

PRIMARY BLOCKER
Rear setback applicability unresolved

WHY
Official guidance and current project
configuration require clarification.

SOURCE
[official authority]
Last verified 18m ago

ACTION
Draft clarification to Planning Department

AGENT
Ready for approval
──────────────────────────────────────

[Review & send]
```

That screenshot instantly communicates:

* agent
* workflow
* regulatory intelligence
* evidence
* source provenance
* blocker detection
* state
* action

without needing explanation.

---

# 61. THE EXPERIENCE RULE

Every screen should answer at least one of these:

1. **Where is my project?**
2. **What is blocking it?**
3. **Why does Greenlight believe that?**
4. **What changed?**
5. **What does Greenlight need from me?**
6. **What is Greenlight doing next?**

If a screen answers none of those, question whether it belongs in the product.

---

# 62. FINAL PRODUCT DEFINITION

Greenlight should feel less like speaking with an AI and more like operating a **live permitting machine**.

The user provides:

* intent
* property
* evidence
* authorization
* decisions

Greenlight maintains:

* jurisdiction
* rules
* dependencies
* evidence
* provenance
* correspondence
* changes
* blockers
* project state

And the agent continually converts:

```text
UNSTRUCTURED BUREAUCRACY

websites
codes
PDFs
forms
emails
drawings
corrections
agency responses

        ↓

STRUCTURED EXECUTION

requirements
dependencies
evidence
blockers
actions
approvals
```

That transformation is the product.

Not the chatbot.

Not the model.

Not the permit checklist.

**Greenlight is the execution system that keeps a construction project synchronized with the regulatory world until it is ready to move forward.**
