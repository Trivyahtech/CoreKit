STANDARD OPERATING PROCEDURE
SOP-001
UI/UX Design Process
Small Network — Direct-to-Consumer (D2C)
Flow-Driven Design for Single Vendor Ecommerce Systems

Document ID
Version
Status
Classification
SOP-001
v1.0
Active
Internal
Effective Date
Review Date
Owner
Approved By
20/04/2026
20/04/2026
Frontend & Design
Head of Product

1.  Purpose
    This SOP defines a structured UI/UX design process for building a single-vendor ecommerce platform (Direct-to-Consumer / D2C). It ensures the following outcomes across all design and development work:

Seamless customer purchase journey from browse to order confirmation
Clear and minimal admin operations with no unnecessary complexity
Direct alignment between UI designs, backend APIs, and JIRA execution
Exclusion of marketplace and SaaS patterns that do not apply to the D2C context

2.  Scope
    This SOP is applicable to the following roles and areas of work:

2.1 Applicable Roles
Role
Responsibility
UI/UX Designers
Owning the design process end-to-end
Product Managers
Validating flows and approving screens
Frontend Developers
Implementing designs against API specs
QA Teams
Verifying edge cases and acceptance criteria

2.2 Coverage
Customer-facing UI (primary deliverable)
Admin UI (basic operations only)
Flow-to-screen-to-JIRA conversion process

3.  Core Principles

3.1 Flow-First Design
All UI design must strictly follow the defined D2C ecommerce purchase flow. No screen may be created without a corresponding step in the approved flow diagram.

Browse → Cart → Checkout → Payment → Order Confirmation

3.2 Minimal Complexity
No vendor interfaces
No multi-store logic
No SaaS configuration UI

3.3 API-Aligned Design
Every UI action must map to a documented backend API endpoint. No UI interaction is permitted without a defined system behavior.

3.4 Conversion-Focused UX
Checkout friction must be minimised at every step. The maximum permitted number of checkout steps is three (3).

4.  Inputs Required
    The following inputs must be confirmed and available before design work commences:

Input
Description
Status
D2C Business Flows
Approved purchase journey and business logic
Required
Product Catalog Structure
Category, attribute, and media schema
Required
API List / Draft Endpoints
Backend API contracts or draft specs
Required
Target Audience Definition
End-customer profiles and device preferences
Required

5.  Step-by-Step Procedure

1
Define D2C Core Flow

Objective: Establish and document the exact customer journey before any design work begins.

Mandatory Customer Journey:
Browse Products
View Product Details
Add to Cart
Review Cart
Checkout
Payment
Order Confirmation
Order Tracking

!
Output: Flow Diagram — must receive formal approval from the Product Manager before proceeding to Step 2.

2
Map Flow to Screens

Objective: Convert each flow step into a defined UI screen with a named owner.

Customer Screens (Mandatory)
Flow Step
Screen Name
Browse
Home / Product Listing
View Product
Product Detail Page
Add to Cart
Cart Page
Checkout
Checkout Page
Payment
Payment Screen
Confirmation
Order Success Page
Tracking
Order History / Tracking

Admin Screens (Limited)
Function
Screen Name
Product Management
Product Dashboard
Order Management
Order Dashboard

!
Output: Screen Mapping Document — reviewed and signed off before wireframing commences.

3
Create Low-Fidelity Wireframes

Objective: Define structure, layout, and navigation without visual styling.

Focus Areas:
Product visibility and information hierarchy
Clear CTA placement (Add to Cart, Buy Now)
Simple, minimal navigation

Rules:
No visual styling or colours in this phase
Focus exclusively on layout, content placement, and flow

!
Output: Wireframes for all screens in Screen Mapping Document.

4
Define UI Component Library

Objective: Build a reusable design system to ensure consistency across all screens.

Component
Usage
Product Card
Product listing, search results, recommendations
Add to Cart Button
Product detail, listing, cart
Quantity Selector
Cart, product detail
Cart Summary Panel
Cart, checkout sidebar
Input Fields
Address entry, payment details, login
Status Indicators
Order status, tracking states

Rules: All components must be reusable and visually consistent across all screens.

!
Output: Component Library in design tool (Figma).

5
Create High-Fidelity UI

Objective: Produce production-ready designs based on approved wireframes and component library.

Design Focus Areas:
Clean and prominent product display
Visible and accurate pricing at all stages
Strong, high-contrast call-to-action buttons
Minimal checkout steps — maximum 3

!
Output: Final UI Designs — approved by Product Manager before handoff.

6
UI → API Mapping (Critical)

Objective: Ensure every design screen and action is executable via a defined backend API.

Screen
Action
API Endpoint
Product Listing
Load products
GET /products
Product Detail
View single product
GET /products/{id}
Cart
Add item to cart
POST /cart
Cart
Update quantity
PATCH /cart/{item_id}
Checkout
Place order
POST /orders
Payment
Initiate payment
POST /payments/initiate
Order History
Get order list
GET /orders

!
Output: UI → API Mapping Document — reviewed by Backend Lead before JIRA handoff.

7
Define Edge Cases

Objective: Identify and document all non-happy-path states to prevent UI gaps in production.

Edge Case
Screen Affected
Required Behaviour
Empty cart
Cart Page
Show empty state with CTA to browse
Out of stock
Product Detail, Cart
Disable Add to Cart, show label
Payment failure
Payment Screen
Show error, offer retry or alternative
Network error
All screens
Show offline/error message with retry
Invalid address
Checkout Page
Inline validation message on field

!
Output: Edge Case Documentation — used as Acceptance Criteria in JIRA.

8
Prepare Design Handoff

Objective: Package all design assets so that development can begin without ambiguity.

Each screen in the handoff package must include:
Screen name and flow reference step
Figma design link (fully annotated)
Components used (from Component Library)
API mapping reference
User actions and interactions
Edge cases and error states

9
Handoff to JIRA

Objective: Convert design deliverables directly into development work items in JIRA.

Design Output
JIRA Artifact
Notes
Flow (entire journey)
Epic
One Epic per major flow
Screen
Story
One Story per screen
User Action / Interaction
Task
Sub-task under the relevant Story
API Mapping
Backend Task
Assigned to backend developer
Edge Case
Acceptance Criteria
Attached to relevant Story

6.  Collaboration Points

Team
Collaboration Point
Timing
Product Team
Validate flows before wireframing commences
Before Step 2
Backend Developers
Confirm API feasibility; align UI actions with logic
Before Step 6
QA Team
Define expected behaviours and edge case coverage
Before Step 7
Frontend Developers
Component feasibility review
Before Step 4

7.  Best Practices

Keep UI simple and conversion-focused — avoid decorative complexity
Use clear, high-contrast CTAs on every transactional screen
Maintain consistent layout patterns using the Component Library
Design mobile-first unless desktop is specified as primary platform
Always validate flows with the Product Manager before building final UI
Document all states: default, loading, error, empty, and success

8.  Common Mistakes to Avoid

✕
Designing marketplace or multi-vendor features for a D2C system
✕
Adding unnecessary steps to the checkout flow (max 3 steps)
✕
Ignoring backend API constraints when designing interactions
✕
Missing error states, loading states, or empty states in designs
✕
Overcomplicating the admin UI with unnecessary configuration screens

9.  Acceptance Criteria
    This SOP is considered successfully implemented when all of the following conditions are met:

[✓] Full D2C customer flow is clearly designed and approved
[✓] All screens are individually mapped to backend API endpoints
[✓] JIRA Epics, Stories, and Tasks can be created directly from the design handoff package
[✓] Frontend developers can build all screens without requiring design clarification
[✓] UI supports the complete end-to-end purchase journey
[✓] All edge cases are documented and included as Story acceptance criteria

10. Revision History

Version
Date
Author
Change Summary
v1.0
2025-01-01
Product Team
Initial release of SOP-001

END OF DOCUMENT — SOP-001 v1.0
