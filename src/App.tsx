import { useEffect, useRef, useState } from "react";
import { ArrV2Inclusive, HexString } from "type-library";
import { FreeFormAddress } from "./Address";
import { BeadTimelines } from "./BeadTimelines";
import { JobMap } from "./JobMap";
import { Hours, Milliseconds, Minutes, Seconds } from "./Units";
import { TRIAL_MODE_ALLOWED_QUERIES, dataService } from "./data/data.service";
import { DriverID, RouteID, Stop, StopID } from "./data/data.store";
import { useData } from "./data/useAkita";
// TODO get closest gas station to route
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
// function SimpleLoadingComponent({ text }: { text: string }): JSX.Element {
//   const [numDots, setNumDots] = useState<1 | 2 | 3>(1);
//   useEffect(() => {
//     const interval = setInterval(
//       () => setNumDots((((numDots + 1) % 3) + 1) as 1 | 2 | 3),
//       1 * MS_IN_S
//     );
//     return () => {
//       clearInterval(interval);
//     };
//   }, []);
//   return (
//     <div>
//       {text}
//       {Array(numDots)
//         .map(() => ".")
//         .join()}
//     </div>
//   );
// }
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
    { routes, trialModeError, homeBaseAddress, drivers, daysStops, routeIDs },
  ] = useData([
    "routes",
    "trialModeError",
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
  const [selectedDriver, setSelectedDriver] = useState<null | DriverID>(null);
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
  const mapPerc = 0.6;
  const timelinePerc = 0.25;
  const DriverBarHeightPerc = 0.15;
  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;
  const [loading, setLoading] = useState<boolean>(false);
  // TODO reverse geocode using nominatim to add locations? ie click on map to add new
  // TODO star scales instead of fixed size
  return (
    <>
      {trialModeError && (
        <TrialModeError numQueries={TRIAL_MODE_ALLOWED_QUERIES} />
      )}
      {loading && !trialModeError && <LoadingBar />}
      {!homeBaseAddress ? (
        <AddressInput
          // onComplete={()=>setLoading(false)}
          setter={async (val) => {
            setLoading(true);
            await dataService.setHomeBase(val);
            setLoading(false);
          }}
          stopTypeName={"Home Base"}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            maxHeight: `${DriverBarHeightPerc}%`,
          }}
        >
          <div>
            <AddressInput
              setter={async (val) => {
                setLoading(true);
                await dataService.addDayStop(val);
                setLoading(false);
              }}
              stopTypeName={"Stop"}
            />
            A route needs at least 1 stop assigned to it before it can be
            optimized.
          </div>
          <button
            onClick={() => {
              dataService.addDriver();
            }}
          >
            Add Driver
          </button>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              overflow: "scroll",
              maxWidth: "100%",
            }}
          >
            {Object.keys(drivers).map((driverID) => (
              <div
                onClick={() =>
                  driverID === selectedDriver
                    ? setSelectedDriver(null)
                    : setSelectedDriver(driverID)
                }
                style={{
                  margin: 10,
                  padding: 10,
                  borderRadius: 10,
                  width: 100,
                  height: 100,
                  backgroundColor:
                    selectedDriver === driverID ? "yellow" : "white",
                  color: "black",
                }}
              >
                Driver: {driverID}
              </div>
            ))}
          </div>
        </div>
      )}
      {homeBaseAddress && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: `${mapPerc}%`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "row" }}>
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
                  x: (screenWidth * 4) / 5,
                  y: Math.floor(screenHeight * mapPerc),
                },
                center: homeBaseAddress,
              }}
              // contents={content}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              {([...Object.keys(daysStops)] as StopID[])
                .reduce<ArrV2Inclusive<keyof typeof daysStops>[]>(
                  (prev, curr) => {
                    console.log("TEST123-reduce", prev, curr);
                    const lastPartOfList = prev[prev.length - 1];
                    if (lastPartOfList.length === 2) {
                      return [...prev, [curr]];
                    }
                    return [...prev.slice(0, -1), [...lastPartOfList, curr]];
                  },
                  // TODO no as any
                  [[] as any as ArrV2Inclusive<keyof typeof daysStops>]
                )
                .map((stopKeys) => {
                  return (
                    <div style={{ display: "flex", flexDirection: "row" }}>
                      {stopKeys.map((stopKey) => {
                        return (
                          <StopCard
                            onSelect={(val) =>
                              setSelected(val ? stopKey : null)
                            }
                            margin={10}
                            padding={10}
                            isSelected={selected === stopKey}
                            stop={daysStops[stopKey]}
                            onUpdateDuration={(
                              stopID: StopID,
                              duration: Minutes
                            ) => {
                              dataService.updateDurationForStop(
                                stopID,
                                duration
                              );
                            }}
                          />
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          </div>

          <BeadTimelines
            selectedDriver={selectedDriver}
            drivers={drivers}
            addSelectedStopToRoute={(routeID) => {
              if (selected) {
                dataService.addStopToRoute(selected, routeID);
              }
            }}
            removeSelectedStopFromRoute={(routeID) => {
              if (selected) {
                dataService.removeSelectedStopFromRoute(selected, routeID);
              }
            }}
            setSelected={setSelected}
            selectedStop={selected}
            width={screenWidth}
            height={Math.ceil(timelinePerc * screenHeight)}
            // content={content}
            closingTime={((12 + 7) * MINUTES_IN_HOUR) as Minutes}
            currentTime={currentTime}
            routes={routes.map((route, ii) => ({
              ...route,
              color: COLORS[ii % (COLORS.length - 1)],
            }))}
            routeIDs={routeIDs}
            addNewRoute={() => dataService.addDayRoute()}
            addDriverToRoute={(driverID, routeID) =>
              dataService.addDriverToRoute(driverID, routeID)
            }
            removeDriverFromRoute={(driverID, routeID) =>
              dataService.removeDriverFromRoute(driverID, routeID)
            }
            optimizeRoute={async (routeID: RouteID) => {
              setLoading(true);
              await dataService.calculateRoutePath(routeID);
              setLoading(false);
            }}
          />
        </div>
      )}
    </>
  );
}
export const MINUTES_IN_HOUR = 60 as Minutes;
export const HOURS_IN_DAY = 24 as Hours;
function LoadingBar() {
  const [numDots, setNumDots] = useState<0 | 1 | 2>(1);

  useEffect(() => {
    const interval = setInterval(
      () => setNumDots(((numDots + 1) % 3) as 0 | 1 | 2),
      1 * MS_IN_S
    );
    return () => {
      clearInterval(interval);
    };
  }, []);
  return (
    <InfoBar
      text={`Loading${Array(numDots + 1)
        .map(() => ".")
        .join()}`}
      color={"#FFFFFF"}
      backgroundColor={"#0000FF"}
    />
  );
}

function StopCard({
  stop,
  onUpdateDuration,
  isSelected,
  onSelect,
  padding = 0,
  margin = 0,
}: {
  stop: Stop;
  onUpdateDuration: (stopID: StopID, duration: Minutes) => void;
  isSelected: boolean;
  onSelect: (val: boolean) => void;
  padding?: number;
  margin?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => {
        onSelect(!isSelected);
      }}
      style={{
        margin,
        padding,
        width: 100,
        height: 100,
        borderRadius: 10,
        backgroundColor: isSelected ? "yellow" : "white",
        color: "black",
      }}
    >
      {/* {stop.id} */}
      Expected Stop Duration:{" "}
      <input
        style={{ maxWidth: "100%" }}
        ref={ref}
        onChange={() =>
          ref.current &&
          !Number.isNaN(Number.parseInt(ref.current.value)) &&
          onUpdateDuration(
            stop.id,
            Number.parseInt(ref.current.value) as Minutes
          )
        }
        defaultValue={stop.duration}
        type={"number"}
      />{" "}
      Minutes
    </div>
  );
}

function TrialModeError({ numQueries }: { numQueries: number }): JSX.Element {
  return (
    <InfoBar
      text={`Demo Mode Limit Reached! Demo only allows ${numQueries} queries per
    session. If you want to use a full version, contact V to talk licensing`}
      backgroundColor={"#FF0000"}
      color={"#FFFFFF"}
    />
  );
}

function InfoBar({
  text,
  color,
  backgroundColor,
}: {
  text: string;
  backgroundColor: HexString;
  color: HexString;
}): JSX.Element {
  return (
    <div
      style={{
        backgroundColor,
        color,
        position: "fixed",
        top: 0,
        width: "100%",
      }}
    >
      {text}
    </div>
  );
}

// function FormButton<TEntryVal extends string, TMapVal extends string>({
//   entries,
//   mapVals,
//   entryString,
//   mapString,
//   onSubmit,
// }: {
//   entries: TEntryVal[];
//   mapVals: TMapVal[];

//   entryString: string;
//   mapString: string;
//   onSubmit: (args: { val1: TEntryVal; val2: TMapVal }) => void;
// }) {
//   const refVal1 = useRef<HTMLSelectElement | null>(null);
//   const refVal2 = useRef<HTMLSelectElement | null>(null);

//   return (
//     <div>
//       Add {entryString}{" "}
//       <select ref={refVal1}>
//         {entries.map((val) => (
//           <option>{val}</option>
//         ))}
//       </select>{" "}
//       to {mapString}{" "}
//       <select ref={refVal2}>
//         {mapVals.map((val) => (
//           <option>{val}</option>
//         ))}
//       </select>
//       <button
//         onClick={() => {
//           if (refVal1.current && refVal1.current.value) {
//             if (refVal2.current && refVal2.current.value) {
//               onSubmit({
//                 val1: refVal1.current?.value as TEntryVal,
//                 val2: refVal2.current?.value as TMapVal,
//               });
//             }
//           }
//         }}
//       >
//         Save
//       </button>
//     </div>
//   );
// }

function AddressInput({
  setter,
  stopTypeName,
}: // onComplete
{
  stopTypeName: string;
  setter: (val: FreeFormAddress) => Promise<void>;
  // onComplete:()=>void
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
            homeBaseRef.current.value = "";
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

export enum Placement {
  "TOP",
  "BOTTOM",
  "LEFT",
  "RIGHT",
}
