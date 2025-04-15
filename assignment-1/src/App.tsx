import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect, useRef, useState } from "react";
import WaypointList from "./components/waypointlist";
import { colorsPalette, MAPBOX_TOKEN } from "./contants";
import { Waypoint, createWaypoint } from "./types";

mapboxgl.accessToken = MAPBOX_TOKEN;

const App: React.FC = () => {
  console.log("Mapbox Token:", MAPBOX_TOKEN);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(
    null
  );
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (map.current) return;

    if (mapContainer.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [76, 28],
        zoom: 4,
      });
      map.current.on("load", () => {
        map.current?.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });

        map.current?.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.current.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        const elevation =
          map.current?.queryTerrainElevation([lng, lat], {
            exaggerated: false,
          }) || 0;

        addWaypoint(lng, lat, elevation);
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    waypoints.forEach((waypoint) => {
      createMarker(waypoint);
    });

    updatePathLine();
  }, [waypoints]);

  const createMarker = (waypoint: Waypoint) => {
    if (!map.current) return;

    const el = document.createElement("div");
    el.className = "flex flex-col items-center";

    const markerCircle = document.createElement("div");
    markerCircle.className = `border text-white font-bold rounded-full w-8 h-8 flex items-center justify-center`;
    markerCircle.style.backgroundColor =
      colorsPalette[Number(waypoint.id) % colorsPalette.length].dark;
    markerCircle.style.color = "white";
    markerCircle.style.borderColor = "black";
    markerCircle.textContent = waypoint.sequence.toString();

    const markerPointer = document.createElement("div");
    markerPointer.className =
      "w-0 h-0 border-l-4 border-r-4 border-t-8 border-blue-500 border-l-transparent border-r-transparent";

    el.appendChild(markerCircle);
    el.appendChild(markerPointer);

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      setSelectedWaypoint(waypoint);
    });

    const marker = new mapboxgl.Marker(el)
      .setLngLat([waypoint.longitude, waypoint.latitude])
      .addTo(map.current);

    markersRef.current[waypoint.id] = marker;
  };

  const updatePathLine = () => {
    if (!map.current) return;

    if (map.current.getLayer("route")) {
      map.current.removeLayer("route");
    }
    if (map.current.getSource("route")) {
      map.current.removeSource("route");
    }

    if (waypoints.length > 1) {
      const orderedWaypoints = [...waypoints].sort(
        (a, b) => a.sequence - b.sequence
      );

      const lineString = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: orderedWaypoints.map((wp) => [
            wp.longitude,
            wp.latitude,
          ]),
        },
      };

      map.current.addSource("route", {
        type: "geojson",
        data: lineString as any,
      });

      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#f1f5f9",
          "line-width": 2,
          "line-dasharray": [0.3, 1.8],
        },
      });
    }
  };

  const addWaypoint = (
    longitude: number,
    latitude: number,
    elevation: number
  ) => {
    setWaypoints((prevWaypoints) => {
      const newWaypoint = createWaypoint(
        prevWaypoints.length + 1,
        latitude,
        longitude,
        elevation
      );
      return [...prevWaypoints, newWaypoint];
    });
  };

  const deleteWaypoint = (id: string) => {
    setWaypoints((prevWaypoints) => {
      const filtered = prevWaypoints.filter((wp) => wp.id !== id);

      return filtered.map((wp, idx) => ({ ...wp, sequence: idx + 1 }));
    });

    setSelectedWaypoint(null);
  };

  const moveWaypointUp = (id: string) => {
    setWaypoints((prevWaypoints) => {
      const waypointIndex = prevWaypoints.findIndex((wp) => wp.id === id);
      if (waypointIndex <= 0) return prevWaypoints;

      const newWaypoints = [...prevWaypoints];

      [newWaypoints[waypointIndex], newWaypoints[waypointIndex - 1]] = [
        newWaypoints[waypointIndex - 1],
        newWaypoints[waypointIndex],
      ];
      return newWaypoints.map((wp, idx) => ({ ...wp, sequence: idx + 1 }));
    });
  };

  const moveWaypointDown = (id: string) => {
    setWaypoints((prevWaypoints) => {
      const waypointIndex = prevWaypoints.findIndex((wp) => wp.id === id);
      if (waypointIndex >= prevWaypoints.length - 1) return prevWaypoints;

      const newWaypoints = [...prevWaypoints];
      [newWaypoints[waypointIndex], newWaypoints[waypointIndex + 1]] = [
        newWaypoints[waypointIndex + 1],
        newWaypoints[waypointIndex],
      ];

      return newWaypoints.map((wp, idx) => ({ ...wp, sequence: idx + 1 }));
    });
  };

  const handleWaypointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedWaypoint) return;

    const { name, value } = e.target;
    const numValue = parseFloat(value);

    setSelectedWaypoint((prev: any) => {
      if (!prev) return null;

      const updated = {
        ...prev,
        [name]:
          name === "sequence"
            ? Math.max(1, Math.min(waypoints.length, numValue))
            : numValue,
      };

      return updated;
    });
  };

  const saveWaypoint = () => {
    if (!selectedWaypoint) return;

    setWaypoints((prevWaypoints) =>
      prevWaypoints.map((wp) =>
        wp.id === selectedWaypoint.id ? selectedWaypoint : wp
      )
    );

    const marker = markersRef.current[selectedWaypoint.id];
    if (marker) {
      marker.setLngLat([selectedWaypoint.longitude, selectedWaypoint.latitude]);
    }

    setSelectedWaypoint(null);
  };

  const exportMission = () => {
    const sortedWaypoints = [...waypoints].sort(
      (a, b) => a.sequence - b.sequence
    );
    const missionData = JSON.stringify(sortedWaypoints, null, 2);

    const blob = new Blob([missionData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "uav-mission.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative" ref={mapContainer}></div>

        {/* Sidebar */}
        <div className="w-100 bg-neutral-900 p-4 overflow-y-auto">
          {waypoints.length > 0 && (
            <div className="absolute bottom-4 right-4 z-10">
              <button
                onClick={exportMission}
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
              >
                Export Mission
              </button>
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Waypoints</h2>
            {waypoints.length > 0 && (
              <button
                className="cursor-pointer bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
                onClick={() => setWaypoints([])}
              >
                Delete all waypoints
              </button>
            )}
          </div>
          {selectedWaypoint && (
            <div className="mb-4 p-4 bg-white rounded shadow">
              <h3 className="font-medium mb-2">
                Edit Waypoint #{selectedWaypoint.sequence}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={selectedWaypoint.latitude}
                    onChange={handleWaypointChange}
                    step="0.000001"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={selectedWaypoint.longitude}
                    onChange={handleWaypointChange}
                    step="0.000001"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Altitude (meters)
                  </label>
                  <input
                    type="number"
                    name="altitude"
                    value={selectedWaypoint.altitude}
                    onChange={handleWaypointChange}
                    step="1"
                    disabled={true}
                    className="mt-1  block w-full px-3 py-2 border border-gray-300 rounded shadow-sm text-sm"
                  />
                </div>

                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={saveWaypoint}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setSelectedWaypoint(null)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="mb-12">
            <WaypointList
              selectedWaypoint={selectedWaypoint}
              setSelectedWaypoint={setSelectedWaypoint}
              waypoints={waypoints}
              setWaypoints={setWaypoints}
              moveWaypointUp={moveWaypointUp}
              moveWaypointDown={moveWaypointDown}
              deleteWaypoint={deleteWaypoint}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
