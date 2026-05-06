# Code Architecture Plan

## Goal

Move from a single-file Expo prototype into a maintainable app with a real routing core.

## Current Problem

Right now [App.js](/Users/busanpsy/Documents/New%20project/App.js) mixes:

- UI
- search
- restriction data
- route logic
- map rendering
- GPS state

That is okay for a prototype, but it will collapse once the routing engine becomes real.

## Recommended Structure

```text
src/
  app/
    AppShell.js
    navigation/
    screens/
  components/
    cards/
    map/
    search/
    route/
  features/
    planner/
    liveTrip/
    alerts/
    settings/
  engine/
    index.js
    routing/
    restrictions/
    vehicles/
    validation/
    geocoding/
  data/
    seeds/
    profiles/
  services/
    routingService.js
    locationService.js
    reroutingManager.js
    MapboxLayer.js
    googlePlaces.js
  state/
    routeStore.js
    vehicleStore.js
    settingsStore.js
  utils/
    formatting.js
    geo.js
```

## Suggested Module Responsibilities

## Architecture Mapping From Reference

### UI layer

- `Main screen`
- `Route preview`
- `Settings`
- `Alert banner`

### Services layer

- `RoutingService`
- `LocationService`
- `ReroutingManager`
- `MapboxLayer`

### Engine layer

- `GraphProvider`
- `RestrictionEvaluator`
- `PathFinder`
- route and vehicle stores

### Data layer

- `Road segments DB`
- `Restrictions DB`
- `Exceptions DB`
- `OSM source payloads`

## Suggested Module Responsibilities

### `src/engine/routing`

Owns the actual pathfinding logic.

Files:

- `graph.js`
- `graphProvider.js`
- `pathfinding.js`
- `costFunctions.js`
- `routeBuilder.js`

### `src/engine/restrictions`

Owns restriction evaluation.

Files:

- `ruleTypes.js`
- `restrictionIndex.js`
- `restrictionEvaluator.js`
- `exceptionEvaluator.js`

### `src/engine/vehicles`

Owns vehicle profile normalization.

Files:

- `vehicleProfiles.js`
- `vehicleEvaluator.js`

### `src/engine/validation`

Owns second-pass legality checking.

Files:

- `routeValidator.js`
- `violationBuilder.js`

### `src/engine/geocoding`

Owns place resolution boundary.

Files:

- `placeResolver.js`
- `placeCache.js`

### `src/services`

Adapters for external systems.

Files:

- `routingService.js`
- `locationService.js`
- `reroutingManager.js`
- `MapboxLayer.js`
- `googlePlaces.js`

Important rule:

- external services should not contain business routing rules

## State Design

### Route state

```js
{
  originQuery: "",
  destinationQuery: "",
  originPlace: null,
  destinationPlace: null,
  activeVehicleProfile: "commercial_mini_van_default",
  currentRoute: null,
  rerouteStatus: "idle"
}
```

Recommended implementation:

- Zustand in the mobile app
- engine remains framework-agnostic

### Settings state

```js
{
  avoidTolls: false,
  preferServiceRoads: true,
  voiceGuidance: true
}
```

## API Boundary

The mobile app should eventually call one stable interface:

```ts
computeLegalRoute({
  origin,
  destination,
  vehicleProfile,
  preferences
})
```

It should receive:

```ts
{
  status,
  summary,
  polyline,
  maneuvers,
  warnings,
  validation
}
```

## Migration Plan From Current App

### Phase 1 — Data

- finalize DB schema
- ingest filtered OSM graph
- bind parkway restrictions and exceptions

### Phase 2 — Engine

- implement `GraphProvider`
- implement `RestrictionEvaluator`
- implement `PathFinder`
- add exception test fixtures

### Phase 3 — App

- implement `RoutingService`
- implement `MapboxLayer`
- implement turn-by-turn UI
- move route state into Zustand stores
- split current single-file UI

### Phase 4 — Realtime

- implement `LocationService`
- implement `ReroutingManager`
- tune off-route threshold and battery behavior

## Testing Strategy

### Unit tests

- restriction evaluator
- exception evaluator
- route validator
- pathfinding over small fixture graphs

### Fixture tests

Critical trips:

- `Little Ferry, NJ -> Peekskill, NY`
- `Queens -> Manhattan`
- `Bergen County -> Bronx`

For each fixture:

- legal route exists
- blocked parkways absent
- allowed exception only where permitted

### Regression tests

Every driver-reported bad route becomes a fixture.

## Current Status

Already present in the repo:

- `src/engine/index.js`
- `src/engine/restrictions/restrictionData.js`
- `src/engine/routing/pathfinding.js`
- `src/engine/validation/routeValidator.js`

Missing relative to the target architecture:

- `src/services/routingService.js`
- `src/services/locationService.js`
- `src/services/reroutingManager.js`
- `src/engine/routing/graphProvider.js`
- `src/engine/restrictions/restrictionEvaluator.js`
- `src/engine/routing/costFunctions.js`
- Zustand-backed stores
- `Turn-by-turn UI` component layer
