import { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

let Mapbox;

if (Platform.OS !== "web") {
  try {
    Mapbox = require("@rnmapbox/maps");
  } catch {
    Mapbox = null;
  }
}

function buildRouteFeature(routeCoordinates) {
  if (!routeCoordinates || routeCoordinates.length < 2) {
    return null;
  }

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: routeCoordinates.map((point) => [point.longitude, point.latitude])
    }
  };
}

function getBounds(routeCoordinates) {
  if (!routeCoordinates || routeCoordinates.length === 0) {
    return null;
  }

  let minLat = routeCoordinates[0].latitude;
  let maxLat = routeCoordinates[0].latitude;
  let minLng = routeCoordinates[0].longitude;
  let maxLng = routeCoordinates[0].longitude;

  routeCoordinates.forEach((point) => {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  });

  return {
    ne: [maxLng, maxLat],
    sw: [minLng, minLat]
  };
}

export default function MapboxLayer({
  accessToken,
  currentLocation,
  deviceLocation,
  recenterCoordinate,
  recenterTrigger = 0,
  originCoordinate,
  destinationCoordinate,
  activeSegmentCoordinates = [],
  routeCoordinates = [],
  followUser = true,
  followZoomLevel = 14,
  followPitch = 45,
  overviewPadding = { top: 80, right: 40, bottom: 140, left: 40 },
  styleURL,
  onMapReady,
  children
}) {
  const cameraRef = useRef(null);
  const routeFeature = useMemo(() => buildRouteFeature(routeCoordinates), [routeCoordinates]);
  const activeSegmentFeature = useMemo(() => buildRouteFeature(activeSegmentCoordinates), [activeSegmentCoordinates]);
  const routeBounds = useMemo(() => getBounds(routeCoordinates), [routeCoordinates]);

  useEffect(() => {
    if (Mapbox && accessToken) {
      Mapbox.setAccessToken(accessToken);
    }
  }, [accessToken]);


  useEffect(() => {
    if (!cameraRef.current || !recenterCoordinate) {
      return;
    }

    cameraRef.current.setCamera({
      centerCoordinate: [recenterCoordinate.longitude, recenterCoordinate.latitude],
      zoomLevel: followZoomLevel,
      pitch: followPitch,
      animationDuration: 500
    });
  }, [recenterCoordinate, recenterTrigger, followZoomLevel, followPitch]);

  useEffect(() => {
    if (!cameraRef.current || !routeBounds || followUser) {
      return;
    }

    cameraRef.current.fitBounds(
      routeBounds.ne,
      routeBounds.sw,
      [
        overviewPadding.top,
        overviewPadding.right,
        overviewPadding.bottom,
        overviewPadding.left
      ],
      500
    );
  }, [followUser, overviewPadding.bottom, overviewPadding.left, overviewPadding.right, overviewPadding.top, routeBounds]);

  if (Platform.OS === "web") {
    return (
      <View style={[styles.fallback, styles.webFallback]}>
        <Text style={styles.fallbackTitle}>MapboxLayer is native-only</Text>
        <Text style={styles.fallbackBody}>
          This component renders the engine polyline and follow camera inside Expo Go or a native build.
        </Text>
      </View>
    );
  }

  if (!Mapbox) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Mapbox dependency missing</Text>
        <Text style={styles.fallbackBody}>
          Install `@rnmapbox/maps` before wiring MapboxLayer into the app shell.
        </Text>
      </View>
    );
  }

  const { MapView, Camera, ShapeSource, LineLayer, LocationPuck, StyleURL } = Mapbox;
  const initialCenter = currentLocation
    ? [currentLocation.longitude, currentLocation.latitude]
    : [-73.9855, 40.758];

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        styleURL={styleURL || StyleURL.Street}
        compassEnabled
        scaleBarEnabled={false}
        onDidFinishLoadingMap={onMapReady}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initialCenter,
            zoomLevel: currentLocation ? followZoomLevel : 10,
            pitch: currentLocation ? followPitch : 0
          }}
          followUserLocation={Boolean(followUser && currentLocation)}
          followZoomLevel={followUser ? followZoomLevel : undefined}
          followPitch={followUser ? followPitch : undefined}
          followHeading={followUser ? 0 : undefined}
          centerCoordinate={!followUser && currentLocation ? initialCenter : undefined}
        />

        {deviceLocation ? (
          <LocationPuck
            visible
            puckBearingEnabled
            puckBearing="heading"
            pulsing={{ isEnabled: true, color: "#2da8ff" }}
          />
        ) : null}

        {routeFeature ? (
          <ShapeSource id="routeSource" shape={routeFeature}>
            <LineLayer
              id="routeHalo"
              style={{
                lineColor: "rgba(15, 23, 42, 0.14)",
                lineWidth: 16,
                lineBlur: 1.1,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
            <LineLayer
              id="routeCasing"
              style={{
                lineColor: "rgba(255,255,255,0.98)",
                lineWidth: 11,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
            <LineLayer
              id="routeLine"
              style={{
                lineColor: "#20a4ff",
                lineWidth: 7,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
            <LineLayer
              id="routeSheen"
              style={{
                lineColor: "rgba(255,255,255,0.32)",
                lineWidth: 2.4,
                lineOffset: -1,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
          </ShapeSource>
        ) : null}

        {activeSegmentFeature ? (
          <ShapeSource id="activeSegmentSource" shape={activeSegmentFeature}>
            <LineLayer
              id="activeSegmentGlow"
              style={{
                lineColor: "rgba(250, 204, 21, 0.24)",
                lineWidth: 20,
                lineBlur: 1.4,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
            <LineLayer
              id="activeSegmentCasing"
              style={{
                lineColor: "rgba(255,255,255,0.95)",
                lineWidth: 11,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
            <LineLayer
              id="activeSegmentLine"
              style={{
                lineColor: "#facc15",
                lineWidth: 8,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
          </ShapeSource>
        ) : null}

        {children}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
    overflow: "hidden",
    borderRadius: 16
  },
  map: {
    flex: 1
  },
  fallback: {
    minHeight: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d0d4d1",
    backgroundColor: "#f5f6f5",
    padding: 16,
    justifyContent: "center",
    gap: 8
  },
  webFallback: {
    minHeight: 260
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#18231d"
  },
  fallbackBody: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4c5a50"
  }
});
