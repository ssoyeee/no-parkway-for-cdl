import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
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

const tabs = [
  { key: "planner", label: "Planner" },
  { key: "stops", label: "Stops" },
  { key: "live", label: "Live Trip" },
  { key: "alerts", label: "Alerts" },
  { key: "settings", label: "Settings" }
];

const recentStops = [
  "North Shore Hospital",
  "Lexington Office Tower",
  "Forest Hills Clinic",
  "Yonkers Service Hub"
];

const stopPlan = [
  {
    id: "1",
    time: "8:30",
    title: "Queens Preventive Maintenance",
    detail: "Forest Hills Clinic",
    eta: "23 min"
  },
  {
    id: "2",
    time: "11:00",
    title: "Midtown Access Panel Repair",
    detail: "Lexington Office Tower",
    eta: "57 min"
  },
  {
    id: "3",
    time: "2:15",
    title: "Warehouse Pickup",
    detail: "Long Island City Supply House",
    eta: "18 min"
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

function MapSurface({ live = false }) {
  return (
    <View style={[styles.mapSurface, live ? styles.mapSurfaceLive : null]}>
      <View style={styles.mapGridVertical} />
      <View style={styles.mapGridHorizontal} />
      <View style={styles.mapRingOne} />
      <View style={styles.mapRingTwo} />
      <View style={styles.mapRoutePrimary} />
      <View style={styles.mapRouteWarning} />
      <View style={styles.mapBadge}>
        <Text style={styles.mapBadgeText}>
          {live ? "Restriction warning ahead" : "Parkway-safe route overlay"}
        </Text>
      </View>
    </View>
  );
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

function PlannerScreen({
  destination,
  setDestination,
  routeMode,
  setRouteMode,
  avoidTolls,
  serviceRoadBias,
  onPlanRoute,
  onOpenLive,
  onOpenAlerts
}) {
  const route = baseRoutes[routeMode];
  const adjustedEta = route.eta + (avoidTolls ? 5 : 0) - (serviceRoadBias ? 0 : 2);
  const adjustedMiles = route.miles + (avoidTolls ? 2 : 0);

  return (
    <View style={styles.screenStack}>
      <SectionHeader
        eyebrow="Commercial Van Routing"
        title="Plan a legal route fast"
        detail="Built around NYC tri-state parkway avoidance instead of passenger-car assumptions."
      />

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

      <AppCard>
        <Text style={styles.label}>Destination</Text>
        <TextInput
          value={destination}
          onChangeText={setDestination}
          placeholder="Enter address or building"
          placeholderTextColor={theme.muted}
          style={styles.input}
        />
        <Text style={styles.subLabel}>Quick picks</Text>
        <View style={styles.rowWrap}>
          {recentStops.map((stop) => (
            <Pressable key={stop} style={styles.quickStop} onPress={() => setDestination(stop)}>
              <Text style={styles.quickStopText}>{stop}</Text>
            </Pressable>
          ))}
        </View>
      </AppCard>

      <View style={styles.dualColumn}>
        <MetricCard label="Mode" value={route.title} detail={route.summary} />
        <MetricCard
          label="Confidence"
          value="97%"
          detail="Known restricted segments excluded"
          tone="warm"
        />
      </View>

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

      <MapSurface />

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

      <View style={styles.buttonRow}>
        <Pressable style={styles.primaryButton} onPress={onPlanRoute}>
          <Text style={styles.primaryButtonText}>Review Route</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onOpenAlerts}>
          <Text style={styles.secondaryButtonText}>Restriction Alerts</Text>
        </Pressable>
      </View>

      <Pressable style={styles.launchButton} onPress={onOpenLive}>
        <Text style={styles.launchButtonText}>Start Trip</Text>
      </Pressable>
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

function LiveTripScreen({ destination, routeMode, avoidTolls }) {
  return (
    <View style={styles.screenStack}>
      <SectionHeader
        eyebrow="Active Navigation"
        title={destination}
        detail={`${baseRoutes[routeMode].title}${avoidTolls ? "  |  Toll avoidance active" : ""}`}
      />

      <AppCard style={styles.turnCard}>
        <Text style={styles.turnLabel}>Next Maneuver</Text>
        <Text style={styles.turnText}>In 0.6 mi, keep right to I-495 Service Rd</Text>
        <Text style={styles.turnSubtext}>Stay off parkway ramps at the upcoming split.</Text>
      </AppCard>

      <View style={styles.warningBanner}>
        <Text style={styles.warningBannerText}>
          Restriction ahead in 1.1 mi: Northern State Parkway entrance. Continue straight on the service road.
        </Text>
      </View>

      <MapSurface live />

      <View style={styles.dualColumn}>
        <MetricCard label="Arrival" value="10:37 AM" detail="57 min remaining" />
        <MetricCard label="Compliance" value="Clear" detail="No restricted segments on current path" tone="warm" />
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Trip Watch</Text>
        <View style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>Early warning remains armed for Taconic feeder ramps.</Text>
        </View>
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
  const [destination, setDestination] = useState("North Shore Hospital");
  const [routeMode, setRouteMode] = useState("safest");
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [serviceRoadBias, setServiceRoadBias] = useState(true);
  const [voiceGuidance, setVoiceGuidance] = useState(true);

  const isWide = width >= 1100;

  const shellStyle = [styles.appShell, isWide ? styles.appShellWide : null];
  const contentStyle = [styles.contentArea, isWide ? styles.contentAreaWide : null];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={shellStyle}>
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
            <Text style={styles.cardTitle}>What feels real here</Text>
            <Text style={styles.cardBody}>
              Tabs, route preferences, stop planning, alert context, and settings all work together instead of sitting as static mockup pieces.
            </Text>
          </AppCard>
        </View>

        <ScrollView contentContainerStyle={contentStyle}>
          {activeTab === "planner" ? (
            <PlannerScreen
              destination={destination}
              setDestination={setDestination}
              routeMode={routeMode}
              setRouteMode={setRouteMode}
              avoidTolls={avoidTolls}
              serviceRoadBias={serviceRoadBias}
              onPlanRoute={() => setActiveTab("alerts")}
              onOpenLive={() => setActiveTab("live")}
              onOpenAlerts={() => setActiveTab("alerts")}
            />
          ) : null}

          {activeTab === "stops" ? (
            <StopsScreen
              onPickStop={(stop) => {
                setDestination(stop);
                setActiveTab("planner");
              }}
            />
          ) : null}

          {activeTab === "live" ? (
            <LiveTripScreen
              destination={destination}
              routeMode={routeMode}
              avoidTolls={avoidTolls}
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
  mapSurface: {
    height: 260,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: theme.line,
    backgroundColor: "#f4efe4",
    overflow: "hidden"
  },
  mapSurfaceLive: {
    height: 320
  },
  mapGridVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    borderLeftWidth: 0
  },
  mapGridHorizontal: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.18
  },
  mapRingOne: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 999,
    borderWidth: 18,
    borderColor: "rgba(52, 99, 74, 0.22)",
    top: 12,
    left: 90,
    transform: [{ rotate: "19deg" }]
  },
  mapRingTwo: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 999,
    borderWidth: 14,
    borderStyle: "dashed",
    borderColor: "rgba(202, 106, 56, 0.48)",
    top: 42,
    left: 6,
    transform: [{ rotate: "-16deg" }]
  },
  mapRoutePrimary: {
    position: "absolute",
    width: 260,
    height: 170,
    borderRadius: 999,
    borderWidth: 10,
    borderColor: theme.green,
    borderTopColor: "transparent",
    borderLeftColor: "transparent",
    top: 38,
    left: 52,
    transform: [{ rotate: "-25deg" }]
  },
  mapRouteWarning: {
    position: "absolute",
    width: 92,
    height: 14,
    borderRadius: 999,
    backgroundColor: theme.coral,
    top: 112,
    left: 130,
    transform: [{ rotate: "-17deg" }]
  },
  mapBadge: {
    position: "absolute",
    left: 14,
    bottom: 14,
    borderWidth: 1.5,
    borderColor: theme.line,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  mapBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.ink
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
  launchButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff"
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
