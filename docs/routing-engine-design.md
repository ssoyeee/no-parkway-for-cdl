# Routing Engine Technical Design

## Goal

Build a routing engine that computes a legal commercial-vehicle route before optimizing speed. The engine must prevent restricted parkway usage except where an explicit exception applies.

## Product Definition

This is not a generic navigation engine.

It is a:

- commercial-vehicle-aware
- restriction-first
- region-focused
- legally conservative routing engine

## Layered Architecture

The runtime boundary should follow four layers:

1. `UI`
2. `Services`
3. `Engine`
4. `Data`

### UI

- Main screen
- Route preview
- Settings
- Alert banner
- Turn-by-turn UI

### Services

- `RoutingService`
- `LocationService`
- `ReroutingManager`
- `MapboxLayer`

### Engine

- `GraphProvider`
- `RestrictionEvaluator`
- `PathFinder (A*)`
- stores for route and vehicle state

### Data

- road segments DB
- restrictions DB
- exceptions DB
- OSM source payloads

## High-Level Flow

```text
Search / Geocode
  -> Resolve Origin and Destination
  -> Load Vehicle Profile
  -> RoutingService.calculateSafeRoute
  -> GraphProvider.loadGraphWindow
  -> RestrictionEvaluator.canPass / hasException
  -> Apply Restriction Filter
  -> Apply Turn / Ramp Restrictions
  -> PathFinder.computePath (A*)
  -> Validate Path
  -> Generate Route Summary + Turn List
  -> MapboxLayer.renderRoutePolyline
  -> Render and Monitor
```

## Inputs

### Required

- origin coordinates
- destination coordinates
- vehicle profile

### Optional

- avoid tolls
- prefer service roads
- traffic feed
- known user preference like “avoid dense local streets”

## Routing Stages

### 1. Search and resolution

External provider like Google can be used for:

- autocomplete
- text search
- geocoding

But once place coordinates are resolved, routing must move into the internal engine.

### 2. Graph extraction

Pull a bounded subgraph around the OD pair:

- start with a corridor bounding box
- expand if no legal path is found
- include ramps and service roads

This avoids loading the full region graph per request.

### 3. Restriction expansion

Convert raw rule data into executable constraints:

- hard bans on segments
- hard bans on turns
- conditional bans
- warnings and soft penalties

Examples:

- `Taconic State Parkway` => hard ban
- `Grand Central Parkway` segment exception => conditional evaluation
- confusing feeders near restricted parkways => soft penalty

### 4. Vehicle evaluation

Evaluate every rule against the current vehicle.

For each segment or turn:

- `allowed`
- `blocked`
- `allowed_by_exception`
- `warning_only`

### 5. Costing

The route cost function should be:

```text
illegal segment = infinite cost
illegal turn = infinite cost
warning-prone feeder = high penalty
toll segment = user-configurable penalty
service road = small penalty or bonus depending on preference
traffic = ETA modifier only after legality
```

Ordering matters:

1. legality
2. route stability
3. simplicity / drivability
4. ETA

## Algorithm Choice

### Phase 1

Use `A*` over the filtered directed graph.

Why:

- simple to reason about
- easy to validate
- good enough for regional OD pairs at MVP scale

### Phase 2

Add precomputation for speed:

- contraction hierarchies
- multi-level Dijkstra
- corridor caching

Do not start there. Get correctness first.

## Path Validation

Every computed path must pass a second validation pass:

1. walk every segment
2. check every turn pair
3. re-evaluate restrictions
4. emit violations if any

If any violation exists:

- reject the route
- widen graph scope or alternate costing
- recompute

## Reroute Strategy

When the driver goes off-route:

1. snap current GPS to legal candidate segments
2. recompute from snapped position
3. keep current vehicle profile
4. preserve same restriction set
5. avoid panic detours through restricted feeders

## Edge Classes

The engine should distinguish these classes:

- interstate
- state highway
- arterial
- local road
- service road
- ramp
- parkway
- bridge
- tunnel

This matters because “parkway” is not just a text label. It is an operational routing class in this app.

## Restriction Categories

### Hard bans

- commercial vehicles prohibited
- trailer prohibited
- bus prohibited
- height or weight over limit

### Conditional

- time-based restriction
- axle-count-based exception
- signed segment allowance

### Warning-only

- common misroute feeder
- difficult merge before restricted parkway
- poor signage area

## Engine Output

The engine should return:

```json
{
  "status": "ok",
  "routeId": "uuid",
  "summary": {
    "distanceM": 0,
    "etaSeconds": 0,
    "riskLevel": "low"
  },
  "legs": [],
  "polyline": [],
  "maneuvers": [],
  "allowedExceptionsUsed": [],
  "blockedAlternativesAvoided": [],
  "validation": {
    "passed": true,
    "violations": []
  }
}
```

## Failure Modes

### 1. No legal path found

Return an explicit failure:

- do not silently fall back to Google
- explain why
- offer a broader search or manual review

### 2. Ambiguous legal state

If the data confidence is weak:

- route conservatively
- surface “restriction confidence” internally
- log for later review

### 3. Search resolves to a bad destination pin

Keep geocoding and routing separate so a bad place resolution can be corrected without affecting the engine.

## Service Contracts

### `RoutingService`

Primary entrypoint from the app.

```ts
calculateSafeRoute({
  origin,
  destination,
  vehicleProfile,
  preferences
})
```

Responsibilities:

- request graph window from `GraphProvider`
- invoke `RestrictionEvaluator`
- invoke `PathFinder`
- validate and shape result for UI

### `LocationService`

Responsibilities:

- GPS polling or subscription
- current position updates
- route snap candidate input

Initial operating target from the roadmap:

- 1-2 second polling while navigating

### `ReroutingManager`

Responsibilities:

- determine off-route state
- trigger reroute with current snapped position
- debounce route recalculation

Initial threshold from the roadmap:

- 50m off-route threshold

This threshold should remain configurable because city driving and highway driving need different tolerances.

### `MapboxLayer`

Responsibilities:

- render the A* result GeoJSON polyline on a Mapbox map
- render and follow the current device location
- switch between follow mode and route overview camera
- remain a rendering layer only, with no routing authority

Implementation boundary:

- use Mapbox Maps SDK, not Mapbox Navigation SDK
- do not allow SDK-side rerouting
- do not delegate legality to Mapbox

### `Turn-by-turn UI`

Responsibilities:

- display the current maneuver from the route engine
- show distance to next maneuver
- show legal reroute guidance on off-route events

Input source:

- current segment and next maneuver from `ReroutingManager` and the route engine

## Production Architecture

### Mobile app

- collects query
- renders route
- tracks GPS
- requests reroute

### Routing service

- loads graph window
- evaluates restrictions
- computes route
- validates route
- logs route result

### Data service

- ingests graph updates
- stores restriction rules
- handles manual corrections

## Open Design Issues

These need explicit decisions before broad rollout:

1. OSM freshness and update cadence
2. manual restriction binding scale as the region grows
3. graph memory size on device vs server-backed graph windows
4. offline cache strategy
5. Mapbox route polyline and camera performance on older devices
6. battery impact from repeated GPS + pathfinding
7. whether 50m off-route threshold is environment-specific
8. removing hardcoded exception logic in favor of DB-driven exceptions
9. route simulation and regression coverage for known bad parkway cases
10. turn instruction generation from our own path segments

## Implementation Roadmap

### Phase 1 — Data

- DB schema for segments
- restrictions and exceptions tables
- OSM filtering script
- manual parkway restriction binding

### Phase 2 — Engine

- `GraphProvider` in-memory graph window
- `RestrictionEvaluator`
- `A* PathFinder`
- `costFunctions`
- unit tests for GSP and GCP exception handling

### Phase 3 — App

- wire `RoutingService`
- implement `MapboxLayer`
- implement turn-by-turn UI
- add route and vehicle stores
- split Main / RoutePreview / Settings UI

### Phase 4 — Realtime

- `LocationService`
- `ReroutingManager`
- off-route detection
- reroute performance tuning

## Region Strategy

Start with a curated operational region:

- NYC
- Long Island
- Westchester
- Bergen / Hudson / Essex / Passaic corridors used by the target driver base
- southern CT where needed
- Hudson Valley destinations actually traveled to

The engine will be better if it is deep and correct in one region instead of shallow everywhere.

## What “done” means for V1

V1 is done when:

- the engine can compute legal routes for common tri-state trips
- restricted parkways are removed before route optimization
- reroute keeps the same legal model
- the app no longer depends on Google for final route legality
- every route can be audited after the fact
