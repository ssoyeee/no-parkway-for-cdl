import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";
import * as Location from "expo-location";
import { computeLegalRoute } from "./src/engine";
import MapboxLayer from "./src/services/MapboxLayer";

const theme = {
  bg: "#ece6da",
  panel: "#fbf8f1",
  card: "#fffdf8",
  ink: "#18231d",
  muted: "#627065",
  line: "#24332b",
  moss: "#2d5441",
  mossSoft: "#d7e6da",
  sky: "#dbe8ed",
  amber: "#f7dfb7",
  amberSoft: "#fbefda",
  coral: "#ca6a38",
  sand: "#f3ecdf",
  green: "#2d7f57"
};

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
const TRI_STATE_LOCATION_BIAS = {
  circle: {
    center: {
      latitude: 40.8505,
      longitude: -73.9352
    },
    radius: 75000
  }
};

function buildLocationBias(coords) {
  if (coords?.latitude && coords?.longitude) {
    return {
      circle: {
        center: {
          latitude: coords.latitude,
          longitude: coords.longitude
        },
        radius: 30000
      }
    };
  }

  return TRI_STATE_LOCATION_BIAS;
}

function expandRoadAbbreviations(text) {
  if (!text) {
    return "";
  }

  return text
    .replace(/\bPkwy\b/gi, "Parkway")
    .replace(/\bPkway\b/gi, "Parkway");
}

const tabs = [
  { key: "planner", label: "Planner" },
  { key: "stops", label: "Stops" },
  { key: "live", label: "Live Trip" },
  { key: "alerts", label: "Alerts" },
  { key: "settings", label: "Settings" }
];

const stopPlan = [
  {
    id: "1",
    time: "8:30",
    title: "Morning service call",
    detail: "Hackensack University Medical Center",
    eta: "18 min"
  },
  {
    id: "2",
    time: "11:00",
    title: "Parts pickup",
    detail: "Garden State Plaza",
    eta: "21 min"
  },
  {
    id: "3",
    time: "2:15",
    title: "Afternoon equipment drop",
    detail: "Newark Liberty International Airport",
    eta: "34 min"
  }
];

const alertFeed = [
  {
    road: "Northern State Parkway",
    detail: "Commercial vehicles prohibited from entering eastbound ramps near Exit 31.",
    status: "High confidence"
  },
  {
    road: "Taconic State Parkway",
    detail: "Do not follow generic GPS detours through parkway feeders in southern Westchester.",
    status: "Common driver mistake"
  },
  {
    road: "Bronx River Parkway",
    detail: "Avoid northbound parkway merge suggestions around White Plains during re-route events.",
    status: "Monitor closely"
  }
];

const nycRestrictedRoads = [
  {
    road: "Belt Parkway",
    region: "Brooklyn and Queens",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "FDR Drive",
    region: "Manhattan",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Henry Hudson Parkway",
    region: "Manhattan and Bronx",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Cross Island Parkway",
    region: "Queens",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Jackie Robinson Parkway",
    region: "Brooklyn and Queens",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Bronx River Parkway",
    region: "Bronx and Westchester",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Palisades Interstate Parkway",
    region: "New York and New Jersey",
    source: "Product rule",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Hutchinson River Parkway",
    region: "Bronx and Westchester",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Saw Mill River Parkway",
    region: "Westchester",
    source: "Product rule",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Sprain Brook Parkway",
    region: "Westchester",
    source: "Product rule",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Taconic State Parkway",
    region: "Hudson Valley",
    source: "Product rule",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Grand Central Parkway",
    region: "Queens",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited with limited exception segment"
  }
];

const nycConditionalExceptions = [
  {
    road: "Grand Central Parkway",
    segment:
      "Between the Robert Kennedy (Triborough) Bridge and the western leg of the Brooklyn Queens Expressway",
    source: "NYC DOT parkway restrictions",
    rule:
      "Single-unit vehicles with no more than three axles and ten tires may operate in both directions on this segment."
  },
  {
    road: "Grand Central Parkway",
    segment:
      "Between the Robert Kennedy (Triborough) Bridge and the western leg of the Brooklyn Queens Expressway",
    source: "NYC DOT parkway restrictions",
    rule: "Buses are prohibited from operating on the Grand Central Parkway without consent."
  }
];

const regionalRestrictedRoads = [
  {
    road: "Northern State Parkway",
    region: "Long Island",
    source: "Regional rule",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Southern State Parkway",
    region: "Long Island",
    source: "Regional rule",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Palisades Interstate Parkway",
    region: "New York and New Jersey",
    source: "Regional rule",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Saw Mill River Parkway",
    region: "Westchester",
    source: "Regional rule",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Sprain Brook Parkway",
    region: "Westchester",
    source: "Regional rule",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Taconic State Parkway",
    region: "Hudson Valley",
    source: "Regional rule",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Wantagh State Parkway",
    region: "Long Island",
    source: "Regional rule",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Meadowbrook State Parkway",
    region: "Long Island",
    source: "Regional rule",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Merritt Parkway",
    region: "Connecticut Route 15",
    source: "Connecticut DOT parkway restrictions",
    rule: "Restricted by size and vehicle type"
  },
  {
    road: "Wilbur Cross Parkway",
    region: "Connecticut Route 15",
    source: "Connecticut DOT parkway restrictions",
    rule: "Restricted by size and vehicle type"
  },
  {
    road: "Milford Parkway",
    region: "Milford, Connecticut",
    source: "Connecticut DOT parkway restrictions",
    rule: "Restricted by size and vehicle type"
  },
  {
    road: "Laurelton Parkway",
    region: "Queens",
    source: "Regional rule",
    rule: "Commercial vehicles prohibited"
  }
];

const segmentRestrictions = [
  {
    road: "Fifth Avenue",
    region: "Manhattan",
    source: "NYC DOT posted signage",
    rule: "Certain segments restrict commercial vehicles. Obey posted signage."
  },
  {
    road: "Park Avenue",
    region: "Manhattan",
    source: "NYC DOT posted signage",
    rule: "Certain segments restrict commercial vehicles. Obey posted signage."
  },
  {
    road: "Brooklyn Bridge",
    region: "Brooklyn and Manhattan",
    source: "NYC DOT posted signage",
    rule: "Certain segments restrict commercial vehicles. Obey posted signage."
  }
];

const restrictedRoadSeed = [...nycRestrictedRoads, ...regionalRestrictedRoads];

const allowedRoadExceptions = [
  {
    road: "Garden State Parkway",
    region: "New Jersey",
    source: "Product rule exception",
    rule: "Allowed for this commercial van profile"
  }
];

const destinationRiskProfiles = {
  "Garden State Plaza": {
    level: "low",
    summary: "New Jersey destination with Garden State Parkway treated as the only parkway exception.",
    roads: [],
    note: "Garden State Parkway can be used here, but other parkways stay blocked."
  },
  "Hackensack University Medical Center": {
    level: "low",
    summary: "North Jersey destination that should stay on legal highways and local arterials.",
    roads: [],
    note: "Garden State Parkway may be used if it helps, while other parkways remain blocked."
  },
  "Newark Liberty International Airport": {
    level: "low",
    summary: "Airport trip can use the Garden State Parkway exception when useful.",
    roads: [],
    note: "Do not use other parkways. Keep the exception limited to Garden State Parkway."
  },
  "Peekskill, New York": {
    level: "high",
    summary: "Hudson Valley routing is vulnerable to Palisades, Taconic, Saw Mill, and Sprain Brook parkway mistakes.",
    roads: [
      "Palisades Interstate Parkway",
      "Taconic State Parkway",
      "Saw Mill River Parkway",
      "Sprain Brook Parkway"
    ],
    note: "Use a legal exit corridor before reaching restricted parkway segments and continue on permitted state or local roads."
  }
};

const routeStrategyRules = [
  {
    id: "little-ferry-to-peekskill",
    originTerms: ["little ferry", "bergen county"],
    destinationTerms: ["peekskill"],
    summary:
      "Use Garden State Parkway only where it helps, then exit to Route 17, I-287, US-9W, and legal local corridors before any restricted parkways.",
    allowedParkways: ["Garden State Parkway"],
    avoidRoads: [
      "Palisades Interstate Parkway",
      "Taconic State Parkway",
      "Saw Mill River Parkway",
      "Sprain Brook Parkway"
    ],
    corridorSegments: [
      "Garden State Parkway",
      "Route 17",
      "I-287 / New York Thruway",
      "US-9W",
      "Local road connection into Peekskill"
    ]
  }
];

const routeNodeCoordinates = {
  little_ferry: { latitude: 40.8509, longitude: -74.0382, label: "Little Ferry, NJ" },
  route17_paramus: { latitude: 40.9558, longitude: -74.0726, label: "Route 17, Paramus, NJ" },
  garden_state_north: { latitude: 41.0402, longitude: -74.1158, label: "Garden State Parkway North" },
  ny_thruway_link: { latitude: 41.1272, longitude: -73.9784, label: "New York Thruway Link" },
  us9w_corridor: { latitude: 41.154, longitude: -73.9345, label: "US-9W Corridor" },
  peekskill_local: { latitude: 41.2862, longitude: -73.9215, label: "Peekskill Local Access" },
  peekskill: { latitude: 41.2901, longitude: -73.9204, label: "Peekskill, New York" },
  palisades_corridor: { latitude: 41.1223, longitude: -73.9182, label: "Palisades Interstate Parkway" }
};

const routeGraphEdges = [
  {
    from: "little_ferry",
    to: "route17_paramus",
    road: "Route 46 Connector",
    miles: 7,
    allowed: true
  },
  {
    from: "route17_paramus",
    to: "garden_state_north",
    road: "Garden State Parkway",
    miles: 8,
    allowed: true
  },
  {
    from: "garden_state_north",
    to: "ny_thruway_link",
    road: "I-287 / New York Thruway",
    miles: 13,
    allowed: true
  },
  {
    from: "ny_thruway_link",
    to: "us9w_corridor",
    road: "US-9W",
    miles: 10,
    allowed: true
  },
  {
    from: "us9w_corridor",
    to: "peekskill_local",
    road: "Local Connector",
    miles: 6,
    allowed: true
  },
  {
    from: "peekskill_local",
    to: "peekskill",
    road: "City Streets",
    miles: 2,
    allowed: true
  },
  {
    from: "garden_state_north",
    to: "palisades_corridor",
    road: "Palisades Interstate Parkway",
    miles: 11,
    allowed: false
  },
  {
    from: "palisades_corridor",
    to: "peekskill",
    road: "Palisades Interstate Parkway",
    miles: 18,
    allowed: false
  }
];

const baseRoutes = {
  safest: {
    title: "Safest Legal Route",
    eta: 57,
    miles: 31,
    tolls: 6.94,
    turns: 14,
    summary: "Service roads prioritized near parkway entries.",
    notes: [
      "No parkways used",
      "Early warning at Northern State interchange",
      "Moderate traffic through Queens approach"
    ]
  },
  balanced: {
    title: "Balanced Route",
    eta: 53,
    miles: 29,
    tolls: 9.5,
    turns: 18,
    summary: "Faster, but more lane changes and tighter merges.",
    notes: [
      "No parkways used",
      "Higher toll exposure",
      "Denser merge pattern through the Bronx"
    ]
  }
};

const defaultRegion = {
  latitude: 40.758,
  longitude: -73.9855,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18
};

function AppChip({ label, tone = "default" }) {
  return (
    <View style={[styles.chip, tone === "warm" ? styles.chipWarm : null]}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function SectionHeader({ eyebrow, title, detail, actionLabel, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable style={styles.headerAction} onPress={onAction}>
          <Text style={styles.headerActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AppCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function MetricCard({ label, value, detail, tone }) {
  return (
    <AppCard style={[styles.metricCard, tone === "warm" ? styles.metricWarm : null]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </AppCard>
  );
}

function CompactNav({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed
}) {
  return (
    <View style={styles.compactNav}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.compactNavTabs}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.compactTab, activeTab === tab.key && styles.compactTabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.compactTabText,
                activeTab === tab.key && styles.compactTabTextActive
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable
        style={styles.navUtilityButton}
        onPress={() => setSidebarCollapsed((current) => !current)}
      >
        <Text style={styles.navUtilityButtonText}>
          {sidebarCollapsed ? "Show Info" : "Hide Info"}
        </Text>
      </Pressable>
    </View>
  );
}

function getDestinationCoordinate(destination) {
  const map = {
    "Garden State Plaza": { latitude: 40.9163, longitude: -74.076 },
    "Hackensack University Medical Center": { latitude: 40.8855, longitude: -74.0548 },
    "Newark Liberty International Airport": { latitude: 40.6895, longitude: -74.1745 },
    "Peekskill, New York": { latitude: 41.2901, longitude: -73.9204 },
    "Little Ferry, NJ": { latitude: 40.8509, longitude: -74.0382 }
  };

  return map[destination] || null;
}

function resolvePlace(label, selectedPlace, { seeded = true } = {}) {
  if (selectedPlace && selectedPlace.coordinate) {
    return {
      label: selectedPlace.label || label,
      coordinate: selectedPlace.coordinate,
      placeId: selectedPlace.placeId,
      isSeeded: false
    };
  }

  const coordinate = seeded ? getDestinationCoordinate(label) : null;
  return {
    label,
    coordinate,
    isSeeded: Boolean(coordinate)
  };
}

function getWaypointCoordinate(origin, destinationCoordinate) {
  return {
    latitude: (origin.latitude + destinationCoordinate.latitude) / 2 + 0.01,
    longitude: (origin.longitude + destinationCoordinate.longitude) / 2 - 0.015
  };
}

function getRiskTone(level) {
  if (level === "high") {
    return "high";
  }
  if (level === "medium") {
    return "medium";
  }
  return "low";
}

function isAllowedParkwayException(road) {
  return allowedRoadExceptions.some((item) => item.road === road);
}

function getRestrictedRoadRules() {
  return [...nycRestrictedRoads, ...regionalRestrictedRoads];
}

function isRestrictedRoadName(road) {
  if (!road) {
    return false;
  }

  if (isAllowedParkwayException(road)) {
    return false;
  }

  return road.includes("Parkway") || getRestrictedRoadRules().some((item) => item.road === road);
}

function assessDestinationRisk(destination) {
  const profile = destinationRiskProfiles[destination];
  if (!profile) {
    return {
      level: "medium",
      summary: "All parkways except Garden State Parkway are treated as restricted by default.",
      roads: getRestrictedRoadRules()
        .map((item) => item.road)
        .filter((road) => road.includes("Parkway") && !isAllowedParkwayException(road))
        .slice(0, 6),
      note: "This stop is not profiled yet, so the app falls back to the blanket rule: every parkway is restricted except Garden State Parkway."
    };
  }

  const matchedRoads = profile.roads.filter((road) => isRestrictedRoadName(road));
  const matchedRules = getRestrictedRoadRules().filter((item) =>
    matchedRoads.includes(item.road)
  );

  return {
    ...profile,
    roads: matchedRoads,
    matchedRules
  };
}

function normalizeGoogleSuggestion(item) {
  return {
    id: item.id,
    title: expandRoadAbbreviations(item.title || item.fullText || ""),
    subtitle: expandRoadAbbreviations(item.subtitle || ""),
    fullText: expandRoadAbbreviations(item.fullText || item.title || ""),
    source: item.source || "google"
  };
}

async function fetchGoogleAutocomplete(query, coords) {
  if (!GOOGLE_PLACES_API_KEY || query.trim().length < 2) {
    return [];
  }

  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask":
        "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text"
    },
    body: JSON.stringify({
      input: query,
      locationBias: buildLocationBias(coords),
      includedRegionCodes: ["us"],
      regionCode: "us"
    })
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.suggestions || [])
    .map((item) => item.placePrediction)
    .filter(Boolean)
    .map((prediction) =>
      normalizeGoogleSuggestion({
        id: prediction.placeId,
        title:
          prediction.structuredFormat?.mainText?.text ||
          prediction.text?.text ||
          "",
        subtitle: prediction.structuredFormat?.secondaryText?.text || "",
        fullText: prediction.text?.text || "",
        source: "autocomplete"
      })
    );
}

async function fetchGoogleTextSearch(query, coords) {
  if (!GOOGLE_PLACES_API_KEY || query.trim().length < 2) {
    return [];
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName.text,places.formattedAddress,places.primaryTypeDisplayName.text"
    },
    body: JSON.stringify({
      textQuery: query,
      locationBias: buildLocationBias(coords),
      regionCode: "us",
      pageSize: 5
    })
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.places || []).map((place) =>
    normalizeGoogleSuggestion({
      id: place.id,
      title: place.displayName?.text || "",
      subtitle:
        place.formattedAddress ||
        place.primaryTypeDisplayName?.text ||
        "",
      fullText:
        [place.displayName?.text, place.formattedAddress].filter(Boolean).join(", "),
      source: "search"
    })
  );
}

async function fetchGoogleSuggestions(query, coords) {
  const [autocompleteResult, textSearchResult] = await Promise.allSettled([
    fetchGoogleAutocomplete(query, coords),
    fetchGoogleTextSearch(query, coords)
  ]);

  const merged = [
    ...(autocompleteResult.status === "fulfilled" ? autocompleteResult.value : []),
    ...(textSearchResult.status === "fulfilled" ? textSearchResult.value : [])
  ];

  const seen = new Set();
  return merged.filter((item) => {
    const key = `${item.fullText.toLowerCase()}::${item.title.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function fetchGooglePlaceDetails(placeId) {
  if (!GOOGLE_PLACES_API_KEY || !placeId) {
    return null;
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,location"
    }
  });

  if (!response.ok) {
    return null;
  }

  const place = await response.json();
  if (!place.location) {
    return null;
  }

  return {
    placeId: place.id,
    label:
      [place.displayName?.text, place.formattedAddress].filter(Boolean).join(", ") ||
      place.displayName?.text ||
      "",
    coordinate: {
      latitude: place.location.latitude,
      longitude: place.location.longitude
    }
  };
}

function getRouteStrategy(originLabel, destinationLabel) {
  const origin = (originLabel || "").trim().toLowerCase();
  const destination = (destinationLabel || "").trim().toLowerCase();

  return (
    routeStrategyRules.find((rule) => {
      const originMatch = rule.originTerms.some((term) => origin.includes(term));
      const destinationMatch = rule.destinationTerms.some((term) =>
        destination.includes(term)
      );
      return originMatch && destinationMatch;
    }) || null
  );
}

function getGraphNodeId(label) {
  const normalized = (label || "").trim().toLowerCase();
  const mapping = {
    "little ferry, nj": "little_ferry",
    "little ferry": "little_ferry",
    "peekskill, new york": "peekskill",
    "peekskill": "peekskill"
  };

  return mapping[normalized] || null;
}

function getNeighbors(nodeId) {
  return routeGraphEdges.flatMap((edge) => {
    if (edge.from === nodeId) {
      return [{ node: edge.to, edge }];
    }
    if (edge.to === nodeId) {
      return [{ node: edge.from, edge }];
    }
    return [];
  });
}

function computeGraphRoute(originLabel, destinationLabel) {
  const start = getGraphNodeId(originLabel);
  const goal = getGraphNodeId(destinationLabel);

  if (!start || !goal) {
    return null;
  }

  const distances = { [start]: 0 };
  const previous = {};
  const visited = new Set();

  while (true) {
    let current = null;
    let bestDistance = Infinity;

    Object.keys(distances).forEach((nodeId) => {
      if (!visited.has(nodeId) && distances[nodeId] < bestDistance) {
        bestDistance = distances[nodeId];
        current = nodeId;
      }
    });

    if (!current) {
      break;
    }

    if (current === goal) {
      break;
    }

    visited.add(current);

    getNeighbors(current).forEach(({ node, edge }) => {
      if (!edge.allowed) {
        return;
      }

      const nextDistance = distances[current] + edge.miles;
      if (distances[node] === undefined || nextDistance < distances[node]) {
        distances[node] = nextDistance;
        previous[node] = { node: current, edge };
      }
    });
  }

  if (distances[goal] === undefined) {
    return null;
  }

  const nodes = [];
  const edges = [];
  let cursor = goal;

  while (cursor) {
    nodes.unshift(cursor);
    const previousStep = previous[cursor];
    if (!previousStep) {
      break;
    }
    edges.unshift(previousStep.edge);
    cursor = previousStep.node;
  }

  return {
    nodeIds: nodes,
    edges,
    miles: distances[goal]
  };
}

function buildInternalRoutePlan(
  originLabel,
  destinationLabel,
  originCoordinate = null,
  destinationCoordinate = null
) {
  return computeLegalRoute({
    originLabel,
    destinationLabel,
    originCoordinate,
    destinationCoordinate
  });
}

function getPointDistanceScore(a, b) {
  if (!a || !b) {
    return Number.POSITIVE_INFINITY;
  }

  const latDiff = a.latitude - b.latitude;
  const lngDiff = a.longitude - b.longitude;
  return latDiff * latDiff + lngDiff * lngDiff;
}

function getNearestRouteScore(routeCoordinates, coordinate) {
  if (!routeCoordinates || routeCoordinates.length === 0 || !coordinate) {
    return Number.POSITIVE_INFINITY;
  }

  return routeCoordinates.reduce(
    (best, point) => Math.min(best, getPointDistanceScore(point, coordinate)),
    Number.POSITIVE_INFINITY
  );
}

function getActiveSegmentCoordinates(routePlan, currentCoordinate) {
  if (!routePlan?.routeSegments?.length || !currentCoordinate) {
    return [];
  }

  let bestSegment = null;
  let bestScore = Number.POSITIVE_INFINITY;

  routePlan.routeSegments.forEach((segment) => {
    (segment.geometry || []).forEach((point) => {
      const score = getPointDistanceScore(currentCoordinate, point);
      if (score < bestScore) {
        bestScore = score;
        bestSegment = segment;
      }
    });
  });

  return bestSegment?.geometry || [];
}

function RouteMap({
  locationState,
  routePlan,
  destination,
  destinationPlace,
  previewOriginCoordinate = null,
  live = false,
  navigationStarted = false,
  expanded = false,
  onToggleExpanded,
  onRefreshLocation
}) {
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const destinationSpec = useMemo(
    () => resolvePlace(destination, destinationPlace),
    [destination, destinationPlace]
  );

  if (Platform.OS === "web") {
    return (
      <AppCard style={[styles.mapFallback, live ? styles.mapFallbackLive : null]}>
        <Text style={styles.cardTitle}>Map preview is native-only</Text>
        <Text style={styles.cardBody}>
          Open this screen in Expo Go to see the real device GPS and native Google-style map view.
        </Text>
      </AppCard>
    );
  }

  if (locationState.loading) {
    return (
      <View style={[styles.mapFrame, live ? styles.mapFrameLive : null, expanded ? styles.mapFrameExpanded : null, styles.mapLoading]}>
        <ActivityIndicator size="large" color={theme.moss} />
        <Text style={styles.mapLoadingText}>Reading current GPS location...</Text>
      </View>
    );
  }

  if (locationState.error || !locationState.coords) {
    return (
      <View style={[styles.mapFrame, live ? styles.mapFrameLive : null, expanded ? styles.mapFrameExpanded : null, styles.mapLoading]}>
        <Text style={styles.cardTitle}>Location permission needed</Text>
        <Text style={styles.cardBody}>
          {locationState.error ||
            "Turn on location access to center the route on the device position."}
        </Text>
        <Pressable style={styles.secondaryButton} onPress={onRefreshLocation}>
          <Text style={styles.secondaryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const gpsOrigin = {
    latitude: locationState.coords.latitude,
    longitude: locationState.coords.longitude
  };
  const origin = previewOriginCoordinate || gpsOrigin;
  if (!destinationSpec.coordinate) {
    return (
      <View style={[styles.mapFrame, live ? styles.mapFrameLive : null, expanded ? styles.mapFrameExpanded : null, styles.mapLoading]}>
        <Text style={styles.cardTitle}>Typed destination ready for handoff</Text>
        <Text style={styles.cardBody}>
          "{destination}" will open in Google Maps as a live search destination.
        </Text>
        <Text style={styles.cardBody}>
          The in-app preview map still needs geocoding before it can pin arbitrary typed places.
        </Text>
      </View>
    );
  }

  const routeCoordinates =
    routePlan && routePlan.coordinates && routePlan.coordinates.length > 1
      ? routePlan.coordinates.map((point) => ({
          latitude: point.latitude,
          longitude: point.longitude
        }))
      : [origin, getWaypointCoordinate(origin, destinationSpec.coordinate), destinationSpec.coordinate];
  const activeSegmentCoordinates = navigationStarted
    ? getActiveSegmentCoordinates(routePlan, gpsOrigin)
    : [];
  const gpsRouteScore = getNearestRouteScore(routeCoordinates, gpsOrigin);
  const gpsNearPlannedRoute = gpsRouteScore < 0.003;
  const followLiveUser = live && navigationStarted && gpsNearPlannedRoute;

  return (
    <View style={[styles.mapFrame, live ? styles.mapFrameLive : null, expanded ? styles.mapFrameExpanded : null]}>
      <MapboxLayer
        accessToken={MAPBOX_ACCESS_TOKEN}
        currentLocation={followLiveUser ? gpsOrigin : origin}
        deviceLocation={gpsOrigin}
        recenterCoordinate={gpsOrigin}
        recenterTrigger={recenterTrigger}
        heading={locationState.coords?.heading || 0}
        originCoordinate={origin}
        destinationCoordinate={destinationSpec.coordinate}
        activeSegmentCoordinates={activeSegmentCoordinates}
        routeCoordinates={routeCoordinates}
        followUser={followLiveUser}
        followZoomLevel={live ? 15 : 13}
        followPitch={live ? 45 : 0}
      />
      <View style={styles.mapOverlay}>
        <AppChip label={live ? "Live Route" : "Route Overview"} />
        <AppChip label="Mapbox renderer" tone="warm" />
      </View>
      <View style={styles.mapActionStack}>
        <Pressable style={styles.mapUtilityButton} onPress={() => setRecenterTrigger((value) => value + 1)}>
          <Text style={styles.mapUtilityButtonText}>My Location</Text>
        </Pressable>
        {onToggleExpanded ? (
          <Pressable style={styles.mapUtilityButton} onPress={onToggleExpanded}>
            <Text style={styles.mapUtilityButtonText}>{expanded ? "Collapse" : "Expand"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function PlannerScreen({
  originText,
  setOriginText,
  originPlace,
  setOriginPlace,
  destination,
  setDestination,
  destinationPlace,
  setDestinationPlace,
  routeMode,
  setRouteMode,
  avoidTolls,
  serviceRoadBias,
  onPlanRoute,
  onOpenLive,
  onOpenAlerts,
  locationState,
  onRefreshLocation
}) {
  const [searchMode, setSearchMode] = useState(false);
  const [activeField, setActiveField] = useState("destination");
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [originLoading, setOriginLoading] = useState(false);
  const [destinationLoading, setDestinationLoading] = useState(false);
  const route = baseRoutes[routeMode];
  const risk = assessDestinationRisk(destination);
  const strategy = getRouteStrategy(originText, destination);
  const adjustedEta = route.eta + (avoidTolls ? 5 : 0) - (serviceRoadBias ? 0 : 2);
  const adjustedMiles = route.miles + (avoidTolls ? 2 : 0);
  const destinationSpec = resolvePlace(destination, destinationPlace);
  const originSpec = resolvePlace(originText, originPlace, { seeded: false });
  const origin =
    originSpec.coordinate
      ? {
          label: originSpec.label || originText.trim(),
          latitude: originSpec.coordinate.latitude,
          longitude: originSpec.coordinate.longitude
        }
      : originText.trim().length > 0
        ? { label: originText.trim() }
      : locationState.coords
        ? {
            latitude: locationState.coords.latitude,
            longitude: locationState.coords.longitude
          }
        : null;
  const routePlan = buildInternalRoutePlan(
    originText,
    destination,
    origin && origin.latitude && origin.longitude
      ? { latitude: origin.latitude, longitude: origin.longitude }
      : null,
    destinationSpec.coordinate || null
  );

  const liveSuggestions =
    activeField === "origin" ? originSuggestions : destinationSuggestions;
  const liveLoading = activeField === "origin" ? originLoading : destinationLoading;
  const activeValue = activeField === "origin" ? originText : destination;
  const activePlaceholder =
    activeField === "origin" ? "Starting point" : "Search destination";

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (originText.trim().length < 2) {
        if (active) {
          setOriginSuggestions([]);
          setOriginLoading(false);
        }
        return;
      }
      if (active) {
        setOriginLoading(true);
      }
      const results = await fetchGoogleSuggestions(originText, locationState.coords);
      if (active) {
        setOriginSuggestions(results);
        setOriginLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [originText, locationState.coords]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      if (destination.trim().length < 2) {
        if (active) {
          setDestinationSuggestions([]);
          setDestinationLoading(false);
        }
        return;
      }
      if (active) {
        setDestinationLoading(true);
      }
      const results = await fetchGoogleSuggestions(destination, locationState.coords);
      if (active) {
        setDestinationSuggestions(results);
        setDestinationLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [destination, locationState.coords]);

  async function handleManualSearch() {
    const query = activeValue.trim();
    if (query.length < 2) {
      return;
    }

    if (activeField === "origin") {
      setOriginLoading(true);
    } else {
      setDestinationLoading(true);
    }

    try {
      const results = await fetchGoogleSuggestions(query, locationState.coords);
      const firstMatch = results[0] || null;
      const placeDetails = firstMatch ? await fetchGooglePlaceDetails(firstMatch.id) : null;

      if (activeField === "origin") {
        if (firstMatch) {
          setOriginText(firstMatch.fullText || query);
          setOriginSuggestions(results);
          setOriginPlace(
            placeDetails || {
              placeId: firstMatch.id,
              label: firstMatch.fullText || query,
              coordinate: null
            }
          );
        } else {
          setOriginText(query);
          setOriginPlace({ label: query, coordinate: null });
          setOriginSuggestions([]);
        }
        setOriginLoading(false);
      } else {
        if (firstMatch) {
          setDestination(firstMatch.fullText || query);
          setDestinationSuggestions(results);
          setDestinationPlace(
            placeDetails || {
              placeId: firstMatch.id,
              label: firstMatch.fullText || query,
              coordinate: null
            }
          );
        } else {
          setDestination(query);
          setDestinationPlace({ label: query, coordinate: null });
          setDestinationSuggestions([]);
        }
        setDestinationLoading(false);
      }

      if (placeDetails?.coordinate) {
        setSearchMode(false);
      }
    } catch {
      if (activeField === "origin") {
        setOriginLoading(false);
      } else {
        setDestinationLoading(false);
      }
    }
  }

  return (
    <View style={styles.screenStack}>
      <SectionHeader
        eyebrow="Commercial Van Routing"
        title={searchMode ? "Search without the clutter" : "Plan a legal route fast"}
        detail={
          searchMode
            ? "Extra route and settings panels are folded away while you pick the destination."
            : "Built around NYC tri-state parkway avoidance instead of passenger-car assumptions."
        }
        actionLabel={searchMode ? "Done" : undefined}
        onAction={searchMode ? () => setSearchMode(false) : undefined}
      />

      {!searchMode ? (
        <AppCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>ParkwaySafe</Text>
          <Text style={styles.heroText}>
            Enter a stop, keep commercial-van rules active, and review a route you can trust before you drive.
          </Text>
          <View style={styles.rowWrap}>
            <AppChip label="Commercial Van" />
            <AppChip label="Parkway Avoidance On" tone="warm" />
            <AppChip label="Tri-State Coverage" />
          </View>
        </AppCard>
      ) : null}

      <AppCard style={[styles.searchOverlayCard, searchMode ? styles.searchFocusCard : null]}>
        <View style={styles.searchModeTabs}>
          <Pressable
            style={[styles.searchModeTab, activeField === "origin" && styles.searchModeTabActive]}
            onPress={() => {
              setActiveField("origin");
              setSearchMode(true);
            }}
          >
            <Text
              style={[
                styles.searchModeTabText,
                activeField === "origin" && styles.searchModeTabTextActive
              ]}
            >
              Origin
            </Text>
            <Text style={styles.searchModeTabValue}>
              {originText || "Current location"}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.searchModeTab,
              activeField === "destination" && styles.searchModeTabActive
            ]}
            onPress={() => {
              setActiveField("destination");
              setSearchMode(true);
            }}
          >
            <Text
              style={[
                styles.searchModeTabText,
                activeField === "destination" && styles.searchModeTabTextActive
              ]}
            >
              Destination
            </Text>
            <Text style={styles.searchModeTabValue}>
              {destination || "Search destination"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchInputShell}>
          <TextInput
            value={activeValue}
            onChangeText={(text) =>
              activeField === "origin"
                ? (setOriginText(text), setOriginPlace(null))
                : (setDestination(text), setDestinationPlace(null))
            }
            placeholder={activePlaceholder}
            placeholderTextColor={theme.muted}
            style={[styles.searchOverlayInput, searchMode ? styles.inputFocused : null]}
            onFocus={() => setSearchMode(true)}
          />
          <View style={styles.searchInputActions}>
            <Pressable style={styles.searchActionButton} onPress={handleManualSearch}>
              <Text style={styles.searchActionText}>Search</Text>
            </Pressable>
            <Pressable
              style={styles.searchActionButton}
              onPress={() => {
                const next = activeField === "origin" ? "destination" : "origin";
                setActiveField(next);
                setSearchMode(true);
              }}
            >
              <Text style={styles.searchActionText}>Switch</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.searchOverlayResults}>
          {liveLoading ? (
            <View style={styles.suggestionEmptyState}>
              <Text style={styles.suggestionMeta}>Searching Google places...</Text>
            </View>
          ) : null}
          {!liveLoading && liveSuggestions.map((item, index) => (
            <Pressable
              key={`${activeField}-${item.id}-${index}`}
              style={styles.mapSearchRow}
              onPress={async () => {
                if (activeField === "origin") {
                  setOriginLoading(true);
                } else {
                  setDestinationLoading(true);
                }

                const placeDetails = await fetchGooglePlaceDetails(item.id);

                if (activeField === "origin") {
                  setOriginText(item.fullText);
                  setOriginPlace(
                    placeDetails || {
                      placeId: item.id,
                      label: item.fullText,
                      coordinate: null
                    }
                  );
                  setOriginLoading(false);
                } else {
                  setDestination(item.fullText);
                  setDestinationPlace(
                    placeDetails || {
                      placeId: item.id,
                      label: item.fullText,
                      coordinate: null
                    }
                  );
                  setDestinationLoading(false);
                }

                if (placeDetails?.coordinate) {
                  setSearchMode(false);
                }
              }}
            >
              <View style={styles.mapSearchIcon}>
                <Text style={styles.mapSearchIconText}>O</Text>
              </View>
              <View style={styles.mapSearchCopy}>
                <Text style={styles.mapSearchTitle}>{item.title}</Text>
                <Text style={styles.mapSearchSubtitle}>
                  {item.subtitle || "Google Places result"}
                </Text>
              </View>
            </Pressable>
          ))}
          {!liveLoading && activeValue.trim().length < 2 ? (
            <View style={styles.suggestionEmptyState}>
              <Text style={styles.suggestionMeta}>Type at least 2 characters.</Text>
            </View>
          ) : null}
          {!liveLoading && activeValue.trim().length >= 2 && liveSuggestions.length === 0 ? (
            <View style={styles.suggestionEmptyState}>
              <Text style={styles.suggestionMeta}>No Google matches found.</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.searchHint}>
          {GOOGLE_PLACES_API_KEY
            ? "Live Google search is active. Autocomplete and nearby place matches are both being used."
            : destinationSpec.isSeeded
              ? "Known place: in-app map preview and risk profile are available."
              : "Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to enable live Google place search."}
        </Text>
      </AppCard>

      {searchMode ? null : (
        <View style={styles.dualColumn}>
          <MetricCard label="Mode" value={route.title} detail={route.summary} />
          <MetricCard
            label="Risk Level"
            value={risk.level.toUpperCase()}
            detail={risk.summary}
            tone={risk.level === "high" ? "warm" : undefined}
          />
        </View>
      )}

      <AppCard style={[styles.riskCard, styles[`riskCard${getRiskTone(risk.level)}`]]}>
        <Text style={styles.cardTitle}>Parkway risk check</Text>
        <Text style={styles.cardBody}>{risk.note}</Text>
        {risk.roads.map((road, index) => (
          <View key={`risk-road-${road}-${index}`} style={styles.bulletRow}>
            <View style={[styles.bulletDot, styles.riskBullet]} />
            <Text style={styles.bulletText}>{road}</Text>
          </View>
        ))}
      </AppCard>

      {routePlan ? (
        <AppCard style={styles.integrationCard}>
          <Text style={styles.cardTitle}>{routePlan.title}</Text>
          <Text style={styles.cardBody}>{routePlan.summary}</Text>
          {routePlan.miles ? (
            <Text style={styles.cardBody}>Approximate computed distance: {routePlan.miles} mi</Text>
          ) : null}
          <Text style={styles.cardLabel}>Route uses</Text>
          {routePlan.routeRoads.map((segment, index) => (
            <View key={`planner-route-segment-${segment}-${index}`} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{segment}</Text>
            </View>
          ))}
          {routePlan.allowedExceptions.length > 0 ? (
            <>
              <Text style={styles.cardLabel}>Allowed exception</Text>
              <Text style={styles.cardBody}>{routePlan.allowedExceptions.join(", ")}</Text>
            </>
          ) : null}
          {routePlan.avoidRoads.length > 0 ? (
            <>
              <Text style={styles.cardLabel}>Avoid</Text>
              {routePlan.avoidRoads.slice(0, 4).map((road, index) => (
                <View key={`planner-avoid-road-${road}-${index}`} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, styles.riskBullet]} />
                  <Text style={styles.bulletText}>{road}</Text>
                </View>
              ))}
            </>
          ) : null}
        </AppCard>
      ) : null}

      {searchMode ? null : (
        <AppCard>
          <SectionHeader
            eyebrow="Current Device Location"
            title={
              locationState.coords
                ? `${locationState.coords.latitude.toFixed(4)}, ${locationState.coords.longitude.toFixed(4)}`
                : "Waiting for GPS"
            }
            detail={
              locationState.coords
                ? `Accuracy about ${Math.round(locationState.coords.accuracy || 0)} meters`
                : "The app will center the route on the phone's current position."
            }
            actionLabel="Refresh GPS"
            onAction={onRefreshLocation}
          />
        </AppCard>
      )}

      {searchMode ? null : (
        <AppCard>
          <SectionHeader
            eyebrow="Route Preference"
            title="Choose the driving feel"
            detail="Both options avoid parkways. The difference is how aggressively we trade speed for lower-risk moves."
          />
          <View style={styles.segmentRow}>
            <Pressable
              style={[styles.segment, routeMode === "safest" && styles.segmentActive]}
              onPress={() => setRouteMode("safest")}
            >
              <Text
                style={[styles.segmentText, routeMode === "safest" && styles.segmentTextActive]}
              >
                Safest
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segment, routeMode === "balanced" && styles.segmentActive]}
              onPress={() => setRouteMode("balanced")}
            >
              <Text
                style={[
                  styles.segmentText,
                  routeMode === "balanced" && styles.segmentTextActive
                ]}
              >
                Balanced
              </Text>
            </Pressable>
          </View>
        </AppCard>
      )}

      {searchMode ? null : (
        <RouteMap
          locationState={locationState}
          routePlan={routePlan}
          destination={destination}
          destinationPlace={destinationPlace}
          previewOriginCoordinate={originSpec.coordinate}
          onRefreshLocation={onRefreshLocation}
        />
      )}

      {searchMode ? null : (
        <View style={styles.dualColumn}>
          <MetricCard
            label="ETA"
            value={`${adjustedEta} min`}
            detail={`${adjustedMiles} mi total`}
          />
          <MetricCard
            label="Tolls"
            value={`$${avoidTolls ? "0.00" : route.tolls.toFixed(2)}`}
            detail={`${route.turns} guided turns`}
          />
        </View>
      )}

      {searchMode ? null : (
        <AppCard style={styles.routeDetailCard}>
          <Text style={styles.cardTitle}>{route.title}</Text>
          <Text style={styles.cardBody}>
            {avoidTolls
              ? "Toll avoidance is active, so the route stays legal but may add local miles."
              : route.summary}
          </Text>
          {route.notes.map((note) => (
            <View key={note} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{note}</Text>
            </View>
          ))}
        </AppCard>
      )}

      {searchMode ? null : (
        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButton} onPress={onPlanRoute}>
            <Text style={styles.primaryButtonText}>Review Route</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onOpenAlerts}>
            <Text style={styles.secondaryButtonText}>Restriction Alerts</Text>
          </Pressable>
        </View>
      )}

      {searchMode ? null : (
        <Pressable style={styles.launchButton} onPress={onOpenLive}>
          <Text style={styles.launchButtonText}>Start Trip</Text>
        </Pressable>
      )}
    </View>
  );
}

function StopsScreen({ onPickStop }) {
  return (
    <View style={styles.screenStack}>
      <SectionHeader
        eyebrow="Today's Workday"
        title="Three scheduled stops"
        detail="A real app for service drivers needs quick stop context, not only single-destination routing."
      />

      <View style={styles.dualColumn}>
        <MetricCard label="Jobs" value="3" detail="2 boroughs, 1 supply run" />
        <MetricCard label="Drive Time" value="1h 38m" detail="Parkway-safe estimate" tone="warm" />
      </View>

      {stopPlan.map((stop, index) => (
        <AppCard key={stop.id}>
          <View style={styles.stopRow}>
            <View style={styles.stopIndex}>
              <Text style={styles.stopIndexText}>{index + 1}</Text>
            </View>
            <View style={styles.stopContent}>
              <Text style={styles.cardTitle}>{stop.title}</Text>
              <Text style={styles.cardBody}>{stop.detail}</Text>
              <Text style={styles.stopMeta}>
                {stop.time} start  |  {stop.eta} from previous stop
              </Text>
            </View>
            <Pressable style={styles.inlineMiniButton} onPress={() => onPickStop(stop.detail)}>
              <Text style={styles.inlineMiniButtonText}>Route</Text>
            </Pressable>
          </View>
        </AppCard>
      ))}
    </View>
  );
}

function LiveTripScreen({
  originText,
  originPlace,
  destination,
  destinationPlace,
  routeMode,
  avoidTolls,
  locationState,
  onRefreshLocation
}) {
  const [mapExpanded, setMapExpanded] = useState(false);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const destinationSpec = resolvePlace(destination, destinationPlace);
  const originSpec = resolvePlace(originText, originPlace, { seeded: false });
  const risk = assessDestinationRisk(destination);
  const origin =
    originSpec.coordinate
      ? {
          label: originSpec.label || originText.trim(),
          latitude: originSpec.coordinate.latitude,
          longitude: originSpec.coordinate.longitude
        }
      : originText.trim().length > 0
        ? { label: originText.trim() }
      : locationState.coords
        ? {
            latitude: locationState.coords.latitude,
            longitude: locationState.coords.longitude
          }
        : null;
  const routePlan = buildInternalRoutePlan(
    originText,
    destination,
    origin && origin.latitude && origin.longitude
      ? { latitude: origin.latitude, longitude: origin.longitude }
      : null,
    destinationSpec.coordinate || null
  );
  const nextManeuver = routePlan.maneuvers?.[0] || null;
  const followingManeuver = routePlan.maneuvers?.[1] || null;

  return (
    <View style={styles.screenStack}>
      <SectionHeader
        eyebrow="Active Navigation"
        title={destination}
        detail={`${baseRoutes[routeMode].title}${avoidTolls ? "  |  Toll avoidance active" : ""}`}
      />

      <AppCard style={styles.turnCard}>
        <Text style={styles.turnLabel}>Next Maneuver</Text>
        <Text style={styles.turnText}>
          {nextManeuver ? nextManeuver.instruction : "Waiting for computed maneuver"}
        </Text>
        <Text style={styles.turnSubtext}>
          {nextManeuver
            ? `In ${nextManeuver.distanceMiles.toFixed(1)} mi`
            : "A legal route maneuver will appear once a route is computed."}
        </Text>
        {followingManeuver ? (
          <Text style={styles.turnSubtext}>Then {followingManeuver.instruction.toLowerCase()}.</Text>
        ) : null}

        <View style={styles.warningBannerEmbedded}>
          <Text style={styles.warningBannerText}>
            Follow the internal legal corridor and stay off blocked parkways such as {risk.roads[0] || "seeded restricted parkways"}.
          </Text>
        </View>

        <Text style={styles.cardLabel}>Live Route</Text>
        <RouteMap
          locationState={locationState}
          routePlan={routePlan}
          destination={destination}
          destinationPlace={destinationPlace}
          previewOriginCoordinate={originSpec.coordinate}
          live
          navigationStarted={navigationStarted}
          expanded={mapExpanded}
          onToggleExpanded={() => setMapExpanded((value) => !value)}
          onRefreshLocation={onRefreshLocation}
        />
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.launchButton, navigationStarted ? styles.stopButton : null]}
            onPress={() => setNavigationStarted((value) => !value)}
          >
            <Text style={styles.launchButtonText}>
              {navigationStarted ? "Stop" : "Start"}
            </Text>
          </Pressable>
        </View>
      </AppCard>

      <View style={styles.dualColumn}>
        <MetricCard label="Arrival" value="10:37 AM" detail="57 min remaining" />
        <MetricCard label="Compliance" value="Clear" detail="No restricted segments on current path" tone="warm" />
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Trip Watch</Text>
        <Text style={styles.cardBody}>{risk.summary}</Text>
        <Text style={styles.cardLabel}>Route uses</Text>
        {routePlan.routeRoads.map((segment, index) => (
          <View key={`live-route-segment-${segment}-${index}`} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText}>{segment}</Text>
          </View>
        ))}
        {routePlan.maneuvers?.length > 0 ? (
          <>
            <Text style={styles.cardLabel}>Upcoming maneuvers</Text>
            {routePlan.maneuvers.slice(0, 3).map((maneuver) => (
              <View key={maneuver.id} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>
                  {maneuver.instruction} ({maneuver.distanceMiles.toFixed(1)} mi)
                </Text>
              </View>
            ))}
          </>
        ) : null}
        {routePlan.allowedExceptions.length > 0 ? (
          <>
            <Text style={styles.cardLabel}>Allowed exception</Text>
            <Text style={styles.cardBody}>{routePlan.allowedExceptions.join(", ")}</Text>
          </>
        ) : null}
        {routePlan.avoidRoads.length > 0 ? (
          <>
            <Text style={styles.cardLabel}>Avoid</Text>
            {routePlan.avoidRoads.slice(0, 4).map((road, index) => (
              <View key={`live-avoid-road-${road}-${index}`} style={styles.bulletRow}>
                <View style={[styles.bulletDot, styles.riskBullet]} />
                <Text style={styles.bulletText}>{road}</Text>
              </View>
            ))}
          </>
        ) : null}
        <View style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>If you miss the next turn, re-route stays in commercial-van mode.</Text>
        </View>
        <View style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>Voice guidance prioritizes legal roads over shortest path.</Text>
        </View>
      </AppCard>
    </View>
  );
}

function AlertsScreen() {
  return (
    <View style={styles.screenStack}>
      <SectionHeader
        eyebrow="Restriction Center"
        title="Hotspots to watch"
        detail="This gives the app a credible regional point of view instead of acting like a generic map."
      />

      {alertFeed.map((alert) => (
        <AppCard key={alert.road}>
          <View style={styles.alertHeader}>
            <Text style={styles.cardTitle}>{alert.road}</Text>
            <AppChip label={alert.status} tone="warm" />
          </View>
          <Text style={styles.cardBody}>{alert.detail}</Text>
        </AppCard>
      ))}

      <SectionHeader
        eyebrow="NYC Restricted Roads"
        title="Official city parkway restrictions"
        detail="This is the core NYC rule set for commercial vehicles."
      />

      {nycRestrictedRoads.map((item) => (
        <AppCard key={item.road}>
          <View style={styles.alertHeader}>
            <Text style={styles.cardTitle}>{item.road}</Text>
            <AppChip label={item.region} tone="warm" />
          </View>
          <Text style={styles.cardBody}>{item.rule}</Text>
          <Text style={styles.cardBody}>Source: {item.source}</Text>
        </AppCard>
      ))}

      <SectionHeader
        eyebrow="NYC Conditional Exception"
        title="Grand Central special case"
        detail="This segment has a narrow exception and should not be treated like a fully open parkway."
      />

      {nycConditionalExceptions.map((item) => (
        <AppCard key={`${item.road}-${item.rule}`}>
          <View style={styles.alertHeader}>
            <Text style={styles.cardTitle}>{item.road}</Text>
            <AppChip label="Conditional" tone="warm" />
          </View>
          <Text style={styles.cardBody}>{item.segment}</Text>
          <Text style={styles.cardBody}>{item.rule}</Text>
          <Text style={styles.cardBody}>Source: {item.source}</Text>
        </AppCard>
      ))}

      <SectionHeader
        eyebrow="Regional Restricted Roads"
        title="Tri-state parkway rules"
        detail="These are kept separate from the official NYC list so regional routing can be reasoned about more cleanly."
      />

      {regionalRestrictedRoads.map((item) => (
        <AppCard key={item.road}>
          <View style={styles.alertHeader}>
            <Text style={styles.cardTitle}>{item.road}</Text>
            <AppChip label={item.region} tone="warm" />
          </View>
          <Text style={styles.cardBody}>{item.rule}</Text>
          <Text style={styles.cardBody}>Source: {item.source}</Text>
        </AppCard>
      ))}

      <SectionHeader
        eyebrow="Signed Segments"
        title="Posted local restrictions"
        detail="These are not whole-road bans. The app should eventually handle them as segment-level constraints."
      />

      {segmentRestrictions.map((item) => (
        <AppCard key={item.road}>
          <View style={styles.alertHeader}>
            <Text style={styles.cardTitle}>{item.road}</Text>
            <AppChip label={item.region} />
          </View>
          <Text style={styles.cardBody}>{item.rule}</Text>
          <Text style={styles.cardBody}>Source: {item.source}</Text>
        </AppCard>
      ))}

      <SectionHeader
        eyebrow="Allowed Exceptions"
        title="Do not warn on these"
        detail="These roads are explicitly excluded from the commercial-van parkway warning set."
      />

      {allowedRoadExceptions.map((item) => (
        <AppCard key={item.road}>
          <View style={styles.alertHeader}>
            <Text style={styles.cardTitle}>{item.road}</Text>
            <AppChip label={item.region} />
          </View>
          <Text style={styles.cardBody}>{item.rule}</Text>
          <Text style={styles.cardBody}>Source: {item.source}</Text>
        </AppCard>
      ))}
    </View>
  );
}

function SettingRow({ label, detail, value, onValueChange }) {
  return (
    <AppCard>
      <View style={styles.settingRow}>
        <View style={styles.settingCopy}>
          <Text style={styles.cardTitle}>{label}</Text>
          <Text style={styles.cardBody}>{detail}</Text>
        </View>
        <Switch
          trackColor={{ false: "#c9d1c8", true: theme.moss }}
          thumbColor="#fff"
          value={value}
          onValueChange={onValueChange}
        />
      </View>
    </AppCard>
  );
}

function SettingsScreen({
  avoidTolls,
  setAvoidTolls,
  serviceRoadBias,
  setServiceRoadBias,
  voiceGuidance,
  setVoiceGuidance
}) {
  return (
    <View style={styles.screenStack}>
      <SectionHeader
        eyebrow="Vehicle Profile"
        title="Commercial van settings"
        detail="These settings are wired into the planner so the prototype behaves more like a real app."
      />

      <AppCard style={styles.profileCard}>
        <Text style={styles.cardTitle}>Vehicle</Text>
        <Text style={styles.profileValue}>Commercial Mini Van</Text>
        <Text style={styles.cardBody}>Parkway avoidance stays on by default for this profile.</Text>
      </AppCard>

      <SettingRow
        label="Avoid tolls"
        detail="Prefer legal toll-free paths when they do not create risky re-route behavior."
        value={avoidTolls}
        onValueChange={setAvoidTolls}
      />
      <SettingRow
        label="Favor service roads"
        detail="Bias route choices toward frontage roads near common parkway trap points."
        value={serviceRoadBias}
        onValueChange={setServiceRoadBias}
      />
      <SettingRow
        label="Voice guidance"
        detail="Keep warning and maneuver prompts on during active trips."
        value={voiceGuidance}
        onValueChange={setVoiceGuidance}
      />
    </View>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState("planner");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(width < 1100);
  const [originText, setOriginText] = useState("");
  const [originPlace, setOriginPlace] = useState(null);
  const [destination, setDestination] = useState("");
  const [destinationPlace, setDestinationPlace] = useState(null);
  const [routeMode, setRouteMode] = useState("safest");
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [serviceRoadBias, setServiceRoadBias] = useState(true);
  const [voiceGuidance, setVoiceGuidance] = useState(true);
  const [locationState, setLocationState] = useState({
    loading: true,
    error: "",
    coords: null
  });

  const isWide = width >= 1100;

  useEffect(() => {
    let subscription;
    let active = true;

    async function startLocation() {
      if (Platform.OS === "web") {
        setLocationState({
          loading: false,
          error: "Open in Expo Go to use device GPS.",
          coords: null
        });
        return;
      }

      setLocationState((current) => ({ ...current, loading: true, error: "" }));

      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          if (active) {
            setLocationState({
              loading: false,
              error: "Location permission was not granted.",
              coords: null
            });
          }
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation
        });

        if (active) {
          setLocationState({
            loading: false,
            error: "",
            coords: current.coords
          });
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 4000,
            distanceInterval: 5
          },
          (next) => {
            if (active) {
              setLocationState({
                loading: false,
                error: "",
                coords: next.coords
              });
            }
          }
        );
      } catch (error) {
        if (active) {
          setLocationState({
            loading: false,
            error: error instanceof Error ? error.message : "Unable to read location.",
            coords: null
          });
        }
      }
    }

    startLocation();

    return () => {
      active = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  async function refreshLocation() {
    if (Platform.OS === "web") {
      setLocationState({
        loading: false,
        error: "Open in Expo Go to use device GPS.",
        coords: null
      });
      return;
    }

    setLocationState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      setLocationState({
        loading: false,
        error: "",
        coords: current.coords
      });
    } catch (error) {
      setLocationState({
        loading: false,
        error: error instanceof Error ? error.message : "Unable to refresh location.",
        coords: null
      });
    }
  }

  const shellStyle = [styles.appShell, isWide ? styles.appShellWide : null];
  const contentStyle = [styles.contentArea, isWide ? styles.contentAreaWide : null];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={shellStyle}>
        {!sidebarCollapsed ? (
          <View style={styles.sidebar}>
            <Text style={styles.brandEyebrow}>Field Service Navigation</Text>
            <Text style={styles.brandTitle}>ParkwaySafe</Text>
            <Text style={styles.brandBody}>
              A focused routing app for commercial vans that need to avoid parkways across the NYC tri-state area.
            </Text>

            <View style={styles.sidebarMetrics}>
              <MetricCard label="Coverage" value="NYC + NJ + CT" detail="Region-first data model" />
              <MetricCard label="Profile" value="Commercial Van" detail="Parkway avoidance always on" tone="warm" />
            </View>

            <View style={styles.tabRail}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab.key}
                  style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text
                    style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <AppCard style={styles.sidebarCallout}>
              <Text style={styles.cardTitle}>Map + GPS status</Text>
              <Text style={styles.cardBody}>
                {Platform.OS === "web"
                  ? "Web preview keeps a placeholder. Open in Expo Go to see the live GPS map."
                  : locationState.coords
                    ? `GPS active at ${locationState.coords.latitude.toFixed(3)}, ${locationState.coords.longitude.toFixed(3)}`
                    : locationState.loading
                      ? "Requesting live device location."
                      : locationState.error}
              </Text>
            </AppCard>
          </View>
        ) : null}

        <ScrollView contentContainerStyle={contentStyle}>
          <CompactNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
          />
          {activeTab === "planner" ? (
            <PlannerScreen
              originText={originText}
              setOriginText={setOriginText}
              originPlace={originPlace}
              setOriginPlace={setOriginPlace}
              destination={destination}
              setDestination={setDestination}
              destinationPlace={destinationPlace}
              setDestinationPlace={setDestinationPlace}
              routeMode={routeMode}
              setRouteMode={setRouteMode}
              avoidTolls={avoidTolls}
              serviceRoadBias={serviceRoadBias}
              onPlanRoute={() => setActiveTab("alerts")}
              onOpenLive={() => setActiveTab("live")}
              onOpenAlerts={() => setActiveTab("alerts")}
              locationState={locationState}
              onRefreshLocation={refreshLocation}
            />
          ) : null}

          {activeTab === "stops" ? (
            <StopsScreen
              onPickStop={(stop) => {
                setDestination(stop);
                setDestinationPlace(null);
                setActiveTab("planner");
              }}
            />
          ) : null}

          {activeTab === "live" ? (
            <LiveTripScreen
              originText={originText}
              originPlace={originPlace}
              destination={destination}
              destinationPlace={destinationPlace}
              routeMode={routeMode}
              avoidTolls={avoidTolls}
              locationState={locationState}
              onRefreshLocation={refreshLocation}
            />
          ) : null}

          {activeTab === "alerts" ? <AlertsScreen /> : null}

          {activeTab === "settings" ? (
            <SettingsScreen
              avoidTolls={avoidTolls}
              setAvoidTolls={setAvoidTolls}
              serviceRoadBias={serviceRoadBias}
              setServiceRoadBias={setServiceRoadBias}
              voiceGuidance={voiceGuidance}
              setVoiceGuidance={setVoiceGuidance}
            />
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.bg
  },
  appShell: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: theme.bg
  },
  appShellWide: {
    flexDirection: "row"
  },
  sidebar: {
    backgroundColor: theme.panel,
    borderBottomWidth: 2,
    borderColor: theme.line,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 18
  },
  brandEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: theme.moss
  },
  brandTitle: {
    fontSize: 34,
    lineHeight: 38,
    color: theme.ink,
    fontWeight: "900"
  },
  brandBody: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.muted,
    maxWidth: 360
  },
  sidebarMetrics: {
    gap: 12
  },
  tabRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.card
  },
  tabButtonActive: {
    backgroundColor: theme.moss,
    borderColor: theme.moss
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.ink
  },
  tabButtonTextActive: {
    color: "#fff"
  },
  sidebarCallout: {
    backgroundColor: theme.sand
  },
  contentArea: {
    padding: 20,
    gap: 16
  },
  contentAreaWide: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center"
  },
  screenStack: {
    gap: 16,
    paddingBottom: 36
  },
  compactNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6
  },
  compactNavTabs: {
    gap: 8,
    paddingRight: 8
  },
  compactTab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.card
  },
  compactTabActive: {
    backgroundColor: theme.moss,
    borderColor: theme.moss
  },
  compactTabText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.ink
  },
  compactTabTextActive: {
    color: "#fff"
  },
  navUtilityButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: theme.panel
  },
  navUtilityButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.ink
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start"
  },
  sectionHeaderCopy: {
    flex: 1,
    gap: 4
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: theme.moss
  },
  sectionTitle: {
    fontSize: 30,
    lineHeight: 34,
    color: theme.ink,
    fontWeight: "900"
  },
  sectionDetail: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.muted
  },
  headerAction: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.line
  },
  headerActionText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.ink
  },
  chip: {
    borderWidth: 1.5,
    borderColor: theme.line,
    backgroundColor: theme.mossSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  chipWarm: {
    backgroundColor: theme.amberSoft
  },
  chipText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.ink
  },
  card: {
    borderWidth: 2,
    borderColor: theme.line,
    borderRadius: 24,
    backgroundColor: theme.card,
    padding: 16,
    gap: 10
  },
  heroCard: {
    backgroundColor: theme.sand
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    color: theme.ink
  },
  heroText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.muted
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.ink
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.muted,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  input: {
    borderWidth: 2,
    borderColor: theme.line,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
    color: theme.ink,
    fontSize: 15
  },
  inputFocused: {
    borderColor: theme.moss,
    backgroundColor: "#fffefb"
  },
  searchFocusCard: {
    backgroundColor: "#fffaf0"
  },
  searchOverlayCard: {
    padding: 0,
    overflow: "hidden"
  },
  searchModeTabs: {
    borderBottomWidth: 1,
    borderBottomColor: "#e7dfd0"
  },
  searchModeTab: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 3,
    backgroundColor: "#fff"
  },
  searchModeTabActive: {
    backgroundColor: "#fffdf7"
  },
  searchModeTabText: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: theme.muted,
    fontWeight: "800"
  },
  searchModeTabTextActive: {
    color: theme.moss
  },
  searchModeTabValue: {
    fontSize: 15,
    color: theme.ink,
    fontWeight: "700"
  },
  searchInputShell: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: "#fff"
  },
  searchOverlayInput: {
    borderWidth: 0,
    fontSize: 24,
    color: theme.ink,
    paddingVertical: 8
  },
  searchInputActions: {
    flexDirection: "row",
    gap: 8
  },
  searchActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.sky
  },
  searchActionText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.ink
  },
  searchOverlayResults: {
    backgroundColor: "#fff"
  },
  suggestionList: {
    borderWidth: 1.5,
    borderColor: "#d9d4c7",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff"
  },
  suggestionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ebe4d8",
    gap: 4
  },
  suggestionEmptyState: {
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  mapSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee7da",
    backgroundColor: "#fff"
  },
  mapSearchIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#7d7d7d",
    alignItems: "center",
    justifyContent: "center"
  },
  mapSearchIconText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#5a5a5a"
  },
  mapSearchCopy: {
    flex: 1,
    gap: 2
  },
  mapSearchTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.ink
  },
  mapSearchSubtitle: {
    fontSize: 13,
    color: theme.muted
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.ink
  },
  suggestionMeta: {
    fontSize: 12,
    color: theme.muted
  },
  searchHint: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.muted
  },
  quickStop: {
    borderWidth: 1.5,
    borderColor: theme.line,
    borderRadius: 999,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  quickStopText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.ink
  },
  dualColumn: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metricCard: {
    flex: 1,
    minWidth: 220
  },
  metricWarm: {
    backgroundColor: theme.amberSoft
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.muted,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  metricValue: {
    fontSize: 26,
    lineHeight: 30,
    color: theme.ink,
    fontWeight: "900"
  },
  metricDetail: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.muted
  },
  segmentRow: {
    flexDirection: "row",
    gap: 10
  },
  segment: {
    flex: 1,
    borderWidth: 2,
    borderColor: theme.line,
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingVertical: 12,
    alignItems: "center"
  },
  segmentActive: {
    backgroundColor: theme.moss,
    borderColor: theme.moss
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.ink
  },
  segmentTextActive: {
    color: "#fff"
  },
  mapFrame: {
    height: 320,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.line,
    overflow: "hidden",
    backgroundColor: "#e6ebed"
  },
  mapFrameLive: {
    height: 360
  },
  mapFrameExpanded: {
    height: 560
  },
  map: {
    width: "100%",
    height: "100%"
  },
  mapOverlay: {
    position: "absolute",
    left: 12,
    top: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  mapActionStack: {
    position: "absolute",
    right: 12,
    bottom: 12,
    gap: 8
  },
  mapUtilityButton: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 2,
    borderColor: theme.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  mapUtilityButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: theme.ink
  },
  mapLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10
  },
  mapLoadingText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.muted
  },
  mapFallback: {
    minHeight: 220,
    justifyContent: "center"
  },
  mapFallbackLive: {
    minHeight: 260
  },
  routeDetailCard: {
    backgroundColor: "#f6f3eb"
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
    color: theme.ink
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.muted
  },
  cardLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: theme.moss,
    marginTop: 4
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: theme.moss,
    marginTop: 6
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: theme.ink
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  primaryButton: {
    flex: 1,
    minWidth: 200,
    backgroundColor: theme.ink,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.ink
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff"
  },
  secondaryButton: {
    flex: 1,
    minWidth: 200,
    backgroundColor: theme.card,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.line
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: theme.ink
  },
  launchButton: {
    backgroundColor: theme.moss,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.moss
  },
  stopButton: {
    backgroundColor: theme.coral,
    borderColor: theme.coral
  },
  launchButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff"
  },
  googleMapsButton: {
    backgroundColor: "#1f6feb",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#184eab"
  },
  googleMapsButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff"
  },
  integrationCard: {
    backgroundColor: "#f2f6fb"
  },
  riskCard: {
    borderWidth: 2
  },
  riskCardhigh: {
    backgroundColor: "#fae5dc",
    borderColor: "#c85b2f"
  },
  riskCardmedium: {
    backgroundColor: "#fbefda",
    borderColor: "#bf8c22"
  },
  riskCardlow: {
    backgroundColor: "#edf5ee",
    borderColor: "#3f7b57"
  },
  riskBullet: {
    backgroundColor: "#c85b2f"
  },
  stopRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center"
  },
  stopIndex: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: theme.moss,
    alignItems: "center",
    justifyContent: "center"
  },
  stopIndexText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff"
  },
  stopContent: {
    flex: 1,
    gap: 4
  },
  stopMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.moss,
    fontWeight: "800"
  },
  inlineMiniButton: {
    borderWidth: 2,
    borderColor: theme.line,
    borderRadius: 14,
    backgroundColor: theme.panel,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  inlineMiniButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: theme.ink
  },
  turnCard: {
    backgroundColor: "#fff7eb"
  },
  turnLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: theme.moss
  },
  turnText: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: theme.ink
  },
  turnSubtext: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.muted
  },
  warningBanner: {
    borderWidth: 2,
    borderColor: theme.line,
    borderRadius: 20,
    backgroundColor: theme.amber,
    padding: 14
  },
  warningBannerEmbedded: {
    marginTop: 6,
    borderWidth: 2,
    borderColor: theme.line,
    borderRadius: 20,
    backgroundColor: theme.amber,
    padding: 14
  },
  warningBannerText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
    color: theme.ink
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  settingCopy: {
    flex: 1,
    gap: 4
  },
  profileCard: {
    backgroundColor: theme.sand
  },
  profileValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    color: theme.ink
  }
});
