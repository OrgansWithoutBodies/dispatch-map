import {
  LayerGroup,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { HexString, ObjV2 } from "type-library";
import { MapPin } from "../svgs/out";
import { JSXMarker } from "./JSXMarker";
import { Coordinate, Route, RouteID, Stop, StopID } from "./data/data.store";

function MapContents({
  routes,
  setSelected,
  stops,
  selectedStop,
}: {
  setSelected: (stop: StopID | null) => void;
  selectedStop: StopID | null;
  routes: JobMapType["routes"];
  stops: Record<StopID, Stop>;
}): JSX.Element {
  useMapEvents({
    click: (evt) => console.log(evt.latlng),
  });
  const routeAssignedToStop: Record<StopID, RouteID> = {};
  routes.forEach((route) =>
    route.routeStops.forEach(
      ({ id: stopID }) => (routeAssignedToStop[stopID] = route.id)
    )
  );
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {routes.map((route, ii) => {
        return (
          <LayerGroup key={`route-${ii}`}>
            {route.routeStops.map(({ id }, nn) => {
              const { pathwaysToGetToStops } = route;
              return (
                <LayerGroup>
                  <Polyline
                    key={`route-${ii}-path-${nn}`}
                    positions={pathwaysToGetToStops[id].coordinates.map(
                      ([lat, lon]) => [lon, lat]
                    )}
                    color={route.color}
                    weight={5}
                  />
                </LayerGroup>
              );
            })}
          </LayerGroup>
        );
      })}
      {Object.keys(stops).map((id) => {
        return (
          <JSXMarker
            key={`node-${id}`}
            position={stops[id].coordinates}
            iconOptions={{
              iconSize: [100, 100],
              className: "jsx-marker",
            }}
          >
            {/* this just tells svg currentcolor what to be */}
            <div
              style={{
                color:
                  id === selectedStop
                    ? "yellow"
                    : id in routeAssignedToStop
                    ? routes.find((val) => routeAssignedToStop[id] === val.id)
                        ?.color
                    : "gray",
              }}
            >
              <MapPin onClick={() => setSelected(id)} />
            </div>
          </JSXMarker>
        );
      })}
    </>
  );
}
export type JobMapType = {
  container: {
    sizePx: ObjV2;
    center: Coordinate;
  };
  homeBaseAddress: Coordinate;
  routes: (Route & { color: HexString })[];
  stops: Record<StopID, Stop>;
  setSelected: (stop: StopID | null) => void;
  selectedStop: StopID | null;
};

export function JobMap({
  // contents,
  homeBaseAddress,
  container: {
    center,
    sizePx: { x: width, y: height },
  },
  routes,
  stops,
  selectedStop,
  setSelected,
}: JobMapType): JSX.Element {
  return (
    <>
      <MapContainer
        style={{
          height: `${height}px`,
          width: `${width}px`,
        }}
        center={center}
        zoom={9}
        scrollWheelZoom={true}
        zoomControl={false}
        maxBoundsViscosity={1}
      >
        <MapContents
          routes={routes}
          stops={stops}
          selectedStop={selectedStop}
          setSelected={setSelected}
        />
        <Star center={homeBaseAddress} />
      </MapContainer>
    </>
  );
}

function Star({
  center,
  tineLength = 0.05,
  coreLength = 0.02,
}: {
  center: Coordinate;
  tineLength?: number;
  coreLength?: number;
}): JSX.Element {
  return (
    <Polygon
      fill
      color="black"
      fillColor="yellow"
      positions={[...new Array(10).keys()].map((ii) => {
        const r = ii % 2 === 1 ? tineLength : coreLength;
        return [
          center.lat + r * Math.cos((ii * Math.PI * 2) / 10),
          center.lng + r * Math.sin((ii * Math.PI * 2) / 10),
        ];
      })}
    />
  );
}
// Timeline nodes can be dragged as need be - they have a minimum distance based on expected travel time but have a buffer of flexibility
