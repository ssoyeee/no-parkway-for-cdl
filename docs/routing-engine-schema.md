# Restricted-Road-Aware Routing Engine Schema

## Goal

This schema supports a commercial-vehicle routing engine that:

- stores a real road graph
- stores commercial restrictions at road, segment, ramp, and turn level
- evaluates restrictions against a vehicle profile
- computes legal routes first, then optimizes ETA and drivability
- keeps a source trail and version history for rules

## Core Principles

1. `place search` and `routing` are separate systems
2. restrictions are attached to `segments` and `turns`, not only road names
3. exceptions are first-class data, not hardcoded special cases
4. legality beats ETA
5. every restriction must have a source and confidence

## Main Entities

### 1. `vehicle_profiles`

Represents a routing mode or a concrete saved vehicle.

```sql
create table vehicle_profiles (
  id uuid primary key,
  name text not null,
  vehicle_type text not null,
  is_commercial boolean not null default true,
  height_m numeric(6,3),
  weight_kg numeric(10,2),
  length_m numeric(6,3),
  width_m numeric(6,3),
  axle_count integer,
  tire_count integer,
  has_trailer boolean not null default false,
  is_bus boolean not null default false,
  hazmat_class text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Recommended starter profile:

- `commercial_mini_van_default`
- `vehicle_type = service_van`
- `is_commercial = true`
- `has_trailer = false`

### 2. `road_nodes`

Intersection and graph node table.

```sql
create table road_nodes (
  id bigint primary key,
  lat double precision not null,
  lon double precision not null,
  elevation_m numeric(8,2),
  source text not null,
  region_code text not null,
  created_at timestamptz not null default now()
);
```

### 3. `road_segments`

Directed graph edges used by the router.

```sql
create table road_segments (
  id bigint primary key,
  from_node_id bigint not null references road_nodes(id),
  to_node_id bigint not null references road_nodes(id),
  road_name text,
  ref_code text,
  road_class text not null,
  is_one_way boolean not null default false,
  length_m numeric(10,2) not null,
  speed_limit_kph numeric(6,2),
  lane_count integer,
  has_toll boolean not null default false,
  is_ramp boolean not null default false,
  is_service_road boolean not null default false,
  region_code text not null,
  source text not null,
  osm_way_id bigint,
  geometry_geojson jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Key notes:

- store directed segments, not undirected roads
- keep ramps separate
- preserve service roads as distinct legal alternatives

### 4. `turn_restrictions`

For ramp-level and maneuver-level legality.

```sql
create table turn_restrictions (
  id uuid primary key,
  from_segment_id bigint not null references road_segments(id),
  to_segment_id bigint not null references road_segments(id),
  restriction_type text not null,
  applies_direction text,
  time_rule text,
  source text not null,
  confidence numeric(3,2) not null default 1.00,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Examples:

- `no_commercial_turn`
- `no_left_turn`
- `ramp_prohibited_for_commercial`

### 5. `restriction_rules`

Normalized legal restrictions.

```sql
create table restriction_rules (
  id uuid primary key,
  scope_type text not null,
  scope_id text not null,
  segment_id bigint references road_segments(id),
  restriction_type text not null,
  applies_to_vehicle_type text,
  requires_commercial boolean,
  max_height_m numeric(6,3),
  max_weight_kg numeric(10,2),
  max_length_m numeric(6,3),
  max_axles integer,
  time_rule text,
  legal_effect text not null,
  source text not null,
  source_url text,
  confidence numeric(3,2) not null default 1.00,
  effective_start date,
  effective_end date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

`scope_type` values:

- `road_name`
- `segment`
- `turn`
- `bridge`
- `tunnel`
- `region`

`legal_effect` values:

- `prohibited`
- `conditional`
- `warning`
- `allowed_exception`

### 6. `restriction_exceptions`

Used for roads like Grand Central Parkway segment exceptions and Garden State Parkway business rules.

```sql
create table restriction_exceptions (
  id uuid primary key,
  restriction_rule_id uuid not null references restriction_rules(id),
  scope_type text not null,
  scope_id text not null,
  exception_expression jsonb not null,
  source text not null,
  source_url text,
  confidence numeric(3,2) not null default 1.00,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Example `exception_expression`:

```json
{
  "vehicle_type": "single_unit",
  "max_axles": 3,
  "max_tires": 10
}
```

### 7. `places_cache`

Stores resolved geocoding results from Google or another provider so routing is not fully dependent on live lookups.

```sql
create table places_cache (
  id uuid primary key,
  provider text not null,
  provider_place_id text,
  display_name text not null,
  formatted_address text not null,
  lat double precision not null,
  lon double precision not null,
  region_code text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 8. `route_requests`

Audit log of routing inputs and outputs.

```sql
create table route_requests (
  id uuid primary key,
  vehicle_profile_id uuid references vehicle_profiles(id),
  origin_place_id uuid references places_cache(id),
  destination_place_id uuid references places_cache(id),
  origin_label text not null,
  destination_label text not null,
  requested_at timestamptz not null default now(),
  route_status text not null,
  risk_level text,
  blocked_reason text,
  summary text,
  engine_version text not null
);
```

### 9. `route_segments`

Stores the chosen path for replay, QA, and support.

```sql
create table route_segments (
  id uuid primary key,
  route_request_id uuid not null references route_requests(id),
  position_index integer not null,
  road_segment_id bigint not null references road_segments(id),
  maneuver_type text,
  cumulative_distance_m numeric(10,2),
  cumulative_eta_s integer,
  created_at timestamptz not null default now()
);
```

### 10. `route_violations`

Critical for QA and field feedback.

```sql
create table route_violations (
  id uuid primary key,
  route_request_id uuid not null references route_requests(id),
  restriction_rule_id uuid references restriction_rules(id),
  severity text not null,
  violation_type text not null,
  detected_at timestamptz not null default now(),
  notes text
);
```

### 11. `driver_reports`

Field correction loop.

```sql
create table driver_reports (
  id uuid primary key,
  route_request_id uuid references route_requests(id),
  vehicle_profile_id uuid references vehicle_profiles(id),
  report_type text not null,
  road_name text,
  lat double precision,
  lon double precision,
  description text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
```

## Important Indexes

```sql
create index idx_segments_from_node on road_segments(from_node_id);
create index idx_segments_to_node on road_segments(to_node_id);
create index idx_segments_road_name on road_segments(road_name);
create index idx_segments_osm_way_id on road_segments(osm_way_id);
create index idx_rules_scope on restriction_rules(scope_type, scope_id);
create index idx_rules_segment on restriction_rules(segment_id);
create index idx_turn_restrictions_pair on turn_restrictions(from_segment_id, to_segment_id);
create index idx_route_segments_route on route_segments(route_request_id, position_index);
```

## Data Sources To Ingest

### Required first wave

- OpenStreetMap road graph
- official NYC parkway restrictions
- regional tri-state restricted parkways
- signed segment restrictions where available
- OSM filtering script that emits adjacency-list-ready segment payloads

## Data Layers Aligned To Runtime Architecture

### Road segments DB

Stores:

- `segment_id`
- geometry
- road class
- OSM identifiers

### Restrictions DB

Stores:

- restriction type
- restriction value
- whether the rule is absolute or conditional

### Exceptions DB

Stores:

- vehicle-specific and segment-specific exceptions
- Garden State Parkway allowance logic
- Grand Central Parkway segment exception logic

### OSM payloads

Source of truth used by ingestion jobs before segment normalization.

### Required enrichment

- ramp-level access restrictions
- bridge and tunnel restrictions
- official city and state updates
- driver-reported corrections

## MVP Data Model Boundary

For the first production-capable version, do not start with every US rule. Start with:

- NYC boroughs
- Long Island
- North/Central NJ
- Westchester
- southern Connecticut
- Hudson Valley corridor where your users actually drive

That keeps the restriction data maintainable while still making the routing engine real.
