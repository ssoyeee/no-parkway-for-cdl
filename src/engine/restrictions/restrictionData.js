export const nycRestrictedRoads = [
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
    region: "Bronx",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Hutchinson River Parkway",
    region: "Bronx",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Mosholu Parkway",
    region: "Bronx",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Pelham Parkway",
    region: "Bronx",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Ocean Parkway",
    region: "Brooklyn",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Korean War Veterans Parkway",
    region: "Staten Island",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited"
  },
  {
    road: "Grand Central Parkway",
    region: "Queens",
    source: "NYC DOT parkway restrictions",
    rule: "Commercial vehicles prohibited with a limited conditional exception"
  }
];

export const nycConditionalExceptions = [
  {
    road: "Grand Central Parkway",
    segment:
      "Between the Robert Kennedy (Triborough) Bridge and the western leg of the Brooklyn Queens Expressway",
    source: "NYC DOT parkway restrictions",
    rule:
      "Single-unit vehicles with no more than three axles and ten tires may operate in both directions on this segment."
  }
];

export const regionalRestrictedRoads = [
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

export const segmentRestrictions = [
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

export const allowedRoadExceptions = [
  {
    road: "Garden State Parkway",
    region: "New Jersey",
    source: "Product rule exception",
    rule: "Allowed for this commercial van profile"
  }
];

export const destinationRiskProfiles = {
  "Peekskill, New York": {
    level: "high",
    summary:
      "Hudson Valley routing is vulnerable to Palisades, Taconic, Saw Mill, and Sprain Brook parkway mistakes.",
    roads: [
      "Palisades Interstate Parkway",
      "Taconic State Parkway",
      "Saw Mill River Parkway",
      "Sprain Brook Parkway"
    ],
    note:
      "Use a legal exit corridor before reaching restricted parkway segments and continue on permitted state or local roads."
  }
};

export function getRestrictedRoadRules() {
  return [...nycRestrictedRoads, ...regionalRestrictedRoads];
}

export function isAllowedParkwayException(road) {
  return allowedRoadExceptions.some((item) => item.road === road);
}

export function isRestrictedRoadName(road) {
  if (!road) {
    return false;
  }

  if (isAllowedParkwayException(road)) {
    return false;
  }

  return road.includes("Parkway") || getRestrictedRoadRules().some((item) => item.road === road);
}

export function getDestinationRiskProfile(destinationLabel) {
  return destinationRiskProfiles[destinationLabel] || null;
}
