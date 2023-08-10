import { useEffect, useRef, useState } from "react";
import { Group, Rect, Text } from "react-konva";
import { HexString } from "type-library";
import { FreeFormAddress } from "./Address";
import { BeadTimelines } from "./BeadTimelines";
import { JobMap } from "./JobMap";
import { Hours, Milliseconds, Minutes, Seconds } from "./Minutes";
import { dataService } from "./data/data.service";
import { RouteID, StopID } from "./data/data.store";
import { useData } from "./data/useAkita";
// TODO 'which dispatch center is closest'
// division on zoom ->2hr>1hr>30m>15m>5m>1m
// move timeline details as own row?
// constraints: Maximum Number of Routes/Vehicles, Maximum Route Duration, Maximum Distance per Vehicle or Route, Maximum Pieces, Weight, Volume, or Revenue per Route, and Maximum Stops per Route. In addition to that, you can also use Time Windows to account for customer availability windows
// SKUs?
// Assign driver to route
// Unrouted Stops
// "Multi Stop Route Planner"

// var greenIcon = new L.Icon({
//   iconUrl:
//     "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
//   shadowUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
//   iconSize: [25, 41],

//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41],
// });
export const COLORS = [
  "#22CC80",
  "#FB7185",
  "#4B9BF2",
  "#A0A1E5",
  "#EF8940",
  "#330910",
] as const;
export const BUFFER_LEN = 15 as Minutes;

// const BusinessName = "Napa Mobile RV Repair";
const MS_IN_S = 1000 as Milliseconds;
const S_IN_MIN = 60 as Seconds;
function minutesSinceMidnight(d: Date): Minutes {
  const e = new Date(d);
  return (((d.getTime() - e.setHours(0, 0, 0, 0)) as Milliseconds) /
    (MS_IN_S * S_IN_MIN)) as Minutes;
}
function App(): JSX.Element {
  const [currentTime, setTime] = useState<Minutes>(
    minutesSinceMidnight(new Date())
  );
  const [selected, setSelected] = useState<StopID | null>(null);
  const [
    { routes, homeBaseAddress, drivers, routeStops, daysStops, routeIDs },
  ] = useData([
    "routes",
    "routeStops",
    "homeBaseAddress",
    "daysStops",
    "drivers",
    "routeIDs",
  ]);
  // tick timeline forward
  useEffect(() => {
    const interval = setInterval(
      () => setTime(minutesSinceMidnight(new Date())),
      30 * MS_IN_S
    );
    return () => {
      clearInterval(interval);
    };
  }, []);
  // void buildRouteList(
  //   Object.values(routeStops).map((idList)=>idList.map((id)=>daysStops[id])),
  //   (routes) => dataService.setRoutes(routes),
  //   requests
  //   // setC
  // );
  // const interval = setInterval(
  //   () => setTime(minutesSinceMidnight(new Date())),
  //   5000
  // );
  // return () => {
  //   clearInterval(interval);
  // };
  const mapPerc = 0.7;
  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;
  // TODO reverse geocode using nominatim to add locations?
  return (
    <>
      {!homeBaseAddress && (
        <AddressInput
          setter={(val) => dataService.setHomeBase(val)}
          stopTypeName={"Home Base"}
        />
      )}
      {homeBaseAddress && (
        <>
          <JobMap
            stops={daysStops}
            homeBaseAddress={homeBaseAddress}
            setSelected={setSelected}
            selectedStop={selected}
            routes={routes.map((route, ii) => {
              return {
                ...route,
                color: COLORS[ii % (COLORS.length - 1)],
              };
            })}
            container={{
              sizePx: {
                x: screenWidth,
                y: Math.floor(screenHeight * mapPerc),
              },
              center: homeBaseAddress,
            }}
            // contents={content}
          />

          <BeadTimelines
            drivers={drivers}
            addSelectedStopToRoute={(routeID) => {
              if (selected) {
                dataService.addStopToRoute(selected, routeID);
              }
            }}
            setSelected={setSelected}
            selectedStop={selected}
            width={screenWidth}
            height={Math.ceil((1 - mapPerc) * screenHeight)}
            // content={content}
            closingTime={((12 + 7) * MINUTES_IN_HOUR) as Minutes}
            currentTime={currentTime}
            routes={routes.map((route, ii) => ({
              ...route,
              color: COLORS[ii % (COLORS.length - 1)],
            }))}
            routeIDs={routeIDs}
          />
        </>
      )}
      {routeIDs && (
        <>
          <div>
            <button
              onClick={() => {
                dataService.addDayRoute();
              }}
            >
              Add Route
            </button>
            <button
              onClick={() => {
                dataService.addDriver();
              }}
            >
              Add Driver
            </button>
            <AddressInput
              setter={(val) => dataService.addDayStop(val)}
              stopTypeName={"Stop"}
            />
          </div>
          <FormButton
            entries={Object.keys(drivers)}
            mapVals={routeIDs}
            entryString={"Driver"}
            mapString={"Route"}
            onSubmit={({ val1, val2 }) =>
              dataService.addDriverToRoute(val1, val2)
            }
          />
          <FormButton
            entries={Object.keys(daysStops)}
            entryString={"Stop"}
            mapVals={routeIDs}
            mapString={"Route"}
            onSubmit={({ val1, val2 }) =>
              dataService.addStopToRoute(val1, val2)
            }
          />
          <OptimizeButton routes={routeIDs} />
        </>
      )}
    </>
  );
}
export const MINUTES_IN_HOUR = 60 as Minutes;
export const HOURS_IN_DAY = 24 as Hours;
function FormButton<TEntryVal extends string, TMapVal extends string>({
  entries,
  mapVals,
  entryString,
  mapString,
  onSubmit,
}: {
  entries: TEntryVal[];
  mapVals: TMapVal[];

  entryString: string;
  mapString: string;
  onSubmit: (args: { val1: TEntryVal; val2: TMapVal }) => void;
}) {
  const refVal1 = useRef<HTMLSelectElement | null>(null);
  const refVal2 = useRef<HTMLSelectElement | null>(null);

  return (
    <div>
      Add {entryString}{" "}
      <select ref={refVal1}>
        {entries.map((val) => (
          <option>{val}</option>
        ))}
      </select>{" "}
      to {mapString}{" "}
      <select ref={refVal2}>
        {mapVals.map((val) => (
          <option>{val}</option>
        ))}
      </select>
      <button
        onClick={() => {
          if (refVal1.current && refVal1.current.value) {
            if (refVal2.current && refVal2.current.value) {
              onSubmit({
                val1: refVal1.current?.value as TEntryVal,
                val2: refVal2.current?.value as TMapVal,
              });
            }
          }
        }}
      >
        Save
      </button>
    </div>
  );
}

function AddressInput({
  setter,
  stopTypeName,
}: {
  stopTypeName: string;
  setter: (val: FreeFormAddress) => Promise<void>;
}) {
  const homeBaseRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      Please input address of {stopTypeName}:
      <input ref={homeBaseRef} />
      <button
        onClick={() => {
          if (homeBaseRef.current && homeBaseRef.current.value) {
            setter({ q: homeBaseRef.current.value });
          }
        }}
      >
        Submit
      </button>
    </div>
  );
}

export function sleep(ms: Milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export const NOMINATIM_MINIMUM_WAIT = 1 * MS_IN_S;
// total distance
// user decides KM or miles (django DB - sent via rest to each frontend request)
// running late

export default App;
export function HOURS_TO_MINUTES(H: Hours): Minutes {
  return (H * 60) as Minutes;
}
export enum Placement {
  "TOP",
  "BOTTOM",
  "LEFT",
  "RIGHT",
}
export function KonvaButton({
  y = 0,
  buttonWidth,
  buttonHeight,
  fill,
  onClick,
  text,
  textcolor,
}: {
  y?: number;
  buttonWidth: number;
  buttonHeight: number;
  fill: HexString;
  onClick: () => void;
  text: string;
  textcolor: HexString;
}) {
  const [pressing, setPressing] = useState<boolean>(false);
  return (
    <Group
      y={y}
      onMouseDown={() => {
        setPressing(true);
      }}
      onMouseUp={() => {
        setPressing(false);
      }}
      onClick={onClick}
    >
      <Rect
        width={buttonWidth}
        height={buttonHeight}
        fill={pressing ? "gray" : fill}
      />
      <Text x={buttonWidth / 2} text={text} fill={textcolor} fontSize={20} />
    </Group>
  );
}
function OptimizeButton({ routes }: { routes: RouteID[] }): JSX.Element {
  const selectRef = useRef<HTMLSelectElement | null>(null);
  return (
    <div>
      Optimize Route
      <select ref={selectRef}>
        {routes.map((routeID) => (
          <option>{routeID}</option>
        ))}
      </select>
      <button
        onClick={() => {
          if (selectRef.current && selectRef.current.value) {
            dataService.calculateRoutePath(selectRef.current.value as RouteID);
          }
        }}
      >
        Submit
      </button>
    </div>
  );
}
