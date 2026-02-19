"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CircleMarker, LeafletMouseEvent, Map } from "leaflet";

interface LocationSelection {
  address: string;
  latitude: number;
  longitude: number;
}

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
type LocationPermissionState = "checking" | "prompt" | "granted" | "denied" | "unsupported";

interface GeolocationErrorLike {
  code?: number;
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      latitude.toString(),
    )}&lon=${encodeURIComponent(longitude.toString())}`,
  );

  if (!response.ok) {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  const payload = (await response.json()) as { display_name?: string };
  return payload.display_name ?? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function getCurrentBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 30000,
    });
  });
}

function mapPermissionState(value: PermissionState): LocationPermissionState {
  if (value === "granted") {
    return "granted";
  }

  if (value === "denied") {
    return "denied";
  }

  return "prompt";
}

export function LocationPickerMap({
  selectedLatitude,
  selectedLongitude,
  onLocationSelect,
}: {
  selectedLatitude: number | null;
  selectedLongitude: number | null;
  onLocationSelect: (location: LocationSelection) => void;
}) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  const autoLocateAttemptedRef = useRef(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [locationPermission, setLocationPermission] =
    useState<LocationPermissionState>("checking");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  onLocationSelectRef.current = onLocationSelect;

  const setMarkerOnMap = useCallback(
    (latitude: number, longitude: number) => {
      if (!mapRef.current || !leafletRef.current) {
        return;
      }

      const nextLatLng: [number, number] = [latitude, longitude];

      if (!markerRef.current) {
        markerRef.current = leafletRef.current
          .circleMarker(nextLatLng, {
            radius: 8,
            color: "#0ea5e9",
            weight: 2,
            fillColor: "#22c55e",
            fillOpacity: 0.85,
          })
          .addTo(mapRef.current);
      } else {
        markerRef.current.setLatLng(nextLatLng);
      }

      mapRef.current.panTo(nextLatLng);
      mapRef.current.setZoom(15);
    },
    [],
  );

  const applyLocationSelection = useCallback(
    async (latitude: number, longitude: number) => {
      setMarkerOnMap(latitude, longitude);
      const address = await reverseGeocode(latitude, longitude);

      onLocationSelectRef.current({
        address,
        latitude,
        longitude,
      });
    },
    [setMarkerOnMap],
  );

  const requestBrowserLocation = useCallback(
    async (triggerMode: "auto" | "manual") => {
      if (!navigator.geolocation) {
        setLocationPermission("unsupported");
        setLocationMessage("Location is not supported in this browser.");
        return;
      }

      setIsDetectingLocation(true);
      setLocationMessage("");

      try {
        const position = await getCurrentBrowserPosition();
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocationPermission("granted");
        await applyLocationSelection(latitude, longitude);
        setLocationMessage(
          triggerMode === "auto"
            ? "Location detected automatically. You can still adjust by clicking on map."
            : "Current location set successfully.",
        );
      } catch (error) {
        const geoError = error as GeolocationErrorLike;

        if (geoError.code === 1) {
          setLocationPermission("denied");
          setLocationMessage(
            "Location permission denied. Please allow location and try again.",
          );
        } else {
          setLocationMessage(
            "Unable to detect current location. Click on the map to set manually.",
          );
        }
      } finally {
        setIsDetectingLocation(false);
      }
    },
    [applyLocationSelection],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!navigator.geolocation) {
      setLocationPermission("unsupported");
      setLocationMessage("Geolocation is not supported in this browser.");
      return;
    }

    if (!navigator.permissions?.query) {
      setLocationPermission("prompt");
      return;
    }

    let mounted = true;
    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((status) => {
        if (!mounted) {
          return;
        }

        permissionStatus = status;
        setLocationPermission(mapPermissionState(status.state));
        permissionStatus.onchange = () => {
          setLocationPermission(mapPermissionState(status.state));
        };
      })
      .catch(() => {
        if (mounted) {
          setLocationPermission("prompt");
        }
      });

    return () => {
      mounted = false;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  useEffect(() => {
    if (autoLocateAttemptedRef.current) {
      return;
    }

    if (selectedLatitude !== null && selectedLongitude !== null) {
      return;
    }

    if (locationPermission === "prompt" || locationPermission === "granted") {
      autoLocateAttemptedRef.current = true;
      void requestBrowserLocation("auto");
    }
  }, [locationPermission, requestBrowserLocation, selectedLatitude, selectedLongitude]);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;
    let localMap: Map | null = null;

    const setupMap = async () => {
      try {
        const leaflet = await import("leaflet");
        leafletRef.current = leaflet;

        if (cancelled || !mapNodeRef.current) {
          return;
        }

        const center =
          selectedLatitude !== null && selectedLongitude !== null
            ? { lat: selectedLatitude, lng: selectedLongitude }
            : DEFAULT_CENTER;

        localMap = leaflet.map(mapNodeRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView(center, selectedLatitude !== null && selectedLongitude !== null ? 15 : 5);

        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19,
          })
          .addTo(localMap);

        if (selectedLatitude !== null && selectedLongitude !== null) {
          markerRef.current = leaflet
            .circleMarker([selectedLatitude, selectedLongitude], {
              radius: 8,
              color: "#0ea5e9",
              weight: 2,
              fillColor: "#22c55e",
              fillOpacity: 0.85,
            })
            .addTo(localMap);
        }

        localMap.on("click", async (event: LeafletMouseEvent) => {
          const latitude = event.latlng.lat;
          const longitude = event.latlng.lng;

          await applyLocationSelection(latitude, longitude);
        });

        mapRef.current = localMap;
        setLoadState("ready");
      } catch (error) {
        setLoadState("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load map picker. Check network connection and try again.",
        );
      }
    };

    void setupMap();

    return () => {
      cancelled = true;
      if (localMap) {
        localMap.remove();
      }
      mapRef.current = null;
      leafletRef.current = null;
      markerRef.current = null;
    };
  }, [applyLocationSelection, selectedLatitude, selectedLongitude]);

  useEffect(() => {
    if (selectedLatitude === null || selectedLongitude === null) {
      return;
    }

    setMarkerOnMap(selectedLatitude, selectedLongitude);
  }, [selectedLatitude, selectedLongitude, setMarkerOnMap]);

  if (loadState === "error") {
    return (
      <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
        <p className="font-semibold">Map is unavailable.</p>
        <p>{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700">Pickup Location Map</p>
      <p className="text-xs text-slate-500">
        Click on the map to pin exact pickup location.
      </p>

      <div className="rounded-xl border border-sky-100 bg-white/85 p-3">
        <p className="text-xs font-medium text-slate-700">
          Allow location access to auto-detect your current pickup point.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDetectingLocation || locationPermission === "unsupported"}
            onClick={() => void requestBrowserLocation("manual")}
            type="button"
          >
            {isDetectingLocation ? "Detecting..." : "Use Current Location"}
          </button>
          <span className="text-xs text-slate-500">
            Permission: {locationPermission}
          </span>
        </div>
        {locationMessage ? (
          <p className="mt-2 text-xs text-slate-600">{locationMessage}</p>
        ) : null}
      </div>

      <div className="relative h-64 w-full overflow-hidden rounded-xl border border-sky-200 bg-sky-50">
        <div ref={mapNodeRef} className="h-full w-full" />
        {loadState === "loading" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-sky-50/90 text-sm font-medium text-slate-500">
            Loading map...
          </div>
        ) : null}
      </div>
    </div>
  );
}
