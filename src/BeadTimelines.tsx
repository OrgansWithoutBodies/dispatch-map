import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import { HexString } from "type-library";
import { HOURS_IN_DAY, MINUTES_IN_HOUR } from "./App";
import { ButtonList } from "./ButtonList";
import { Hours, Minutes, calcMinutesFromHours } from "./Units";
import { DriverID, Route, RouteID, StopID } from "./data/data.store";

const bubblePerc = 0.7;

type ColorfulRoute = Route & {
  color: HexString;
};

// TODO can double add drivers or stops
export function BeadTimelines({
  width,
  height,
  // content,
  closingTime,
  routeIDs,
  currentTime,
  routes,
  selectedStop,
  setSelected,
  // drivers,
  addSelectedStopToRoute,
  removeSelectedStopFromRoute,
  selectedDriver,
  addNewRoute,
  addDriverToRoute,
  removeDriverFromRoute,
  optimizeRoute,
}: {
  selectedDriver: DriverID | null;
  width: number;
  selectedStop: StopID | null;
  setSelected: (stop: StopID | null) => void;
  addNewRoute: () => void;
  drivers: Record<DriverID, RouteID[]>;
  height: number;
  //` content: JobContentsType;
  routes: ColorfulRoute[];
  routeIDs: RouteID[];
  // number in minutes since midnight
  closingTime: Minutes;
  currentTime: Minutes;
  addSelectedStopToRoute: (routeID: RouteID) => void;
  removeSelectedStopFromRoute: (routeID: RouteID) => void;
  addDriverToRoute: (driverID: DriverID, routeID: RouteID) => void;
  removeDriverFromRoute: (driverID: DriverID, routeID: RouteID) => void;
  optimizeRoute: (routeID: RouteID) => void;
}): JSX.Element {
  // TODO end at closing hour start at opening hour
  // const [dragging, setDragging] = useState<number | null>(null);
  const headerPerc = 0.1;
  const headerHeight = headerPerc * height;

  const timelineStartPerc = 0.2;
  const timelineStartPix = timelineStartPerc * width;
  const timelineWidthPix = width - timelineStartPix;
  const lineHeight = (height * (1 - headerPerc)) / routeIDs.length;

  const minSinceMidnightToPixels = (mins: Minutes) =>
    (timelineWidthPix * mins) / (HOURS_IN_DAY * MINUTES_IN_HOUR);
  function Beads({ route }: { route: ColorfulRoute }): JSX.Element {
    let lastFinishTime = route.departureTime;

    return (
      <Group x={timelineStartPix} y={((1 - bubblePerc) / 2) * lineHeight}>
        <Rect
          x={minSinceMidnightToPixels(lastFinishTime)}
          width={10}
          height={lineHeight * bubblePerc}
          fill="green"
        />
        {route.routeStops.map(({ duration, id }) => {
          const localLastFinishTime = lastFinishTime;
          if (!route.pathwaysToGetToStops[id]) {
            return <></>;
          }
          const { travelDuration } = route.pathwaysToGetToStops[id];
          const expectedArrivalTime = (localLastFinishTime +
            travelDuration) as Minutes;
          lastFinishTime = (expectedArrivalTime + duration) as Minutes;
          const isSelected = selectedStop === id;
          return (
            <Group>
              {/* <Rect
                x={minSinceMidnightToPixels(
                  (expectedArrivalTime - BUFFER_LEN) as Minutes
                )}
                width={minSinceMidnightToPixels(BUFFER_LEN)}
                height={lineHeight * bubblePerc}
                fill={"#cccccc"}
              /> */}
              <Rect
                x={minSinceMidnightToPixels(
                  (expectedArrivalTime - travelDuration) as Minutes
                )}
                y={(lineHeight * bubblePerc) / 2}
                fill={route.color}
                height={10}
                width={minSinceMidnightToPixels(travelDuration)}
              />
              <Group x={minSinceMidnightToPixels(expectedArrivalTime)}>
                <Rect
                  strokeWidth={2}
                  stroke={"black"}
                  // TODO alternate hour slot colors?
                  onMouseDown={() => setSelected(id)}
                  width={minSinceMidnightToPixels(duration)}
                  height={lineHeight * bubblePerc}
                  fill={isSelected ? "yellow" : route.color}
                />
                {/* {isSelected && (
                            <KonvaTooltip
                              text={`Stop at ${stopID} for ${expectedStopDuration} minutes`}
                              placement={
                                ii === 0 ? Placement.BOTTOM : Placement.TOP
                              }
                              stopID={stopID}
                            />
                          )} */}
              </Group>
              {/* <Rect
                x={minSinceMidnightToPixels(
                  (expectedArrivalTime + duration) as Minutes
                )}
                width={minSinceMidnightToPixels(BUFFER_LEN)}
                height={lineHeight * bubblePerc}
                fill={"#cccccc"}
              /> */}
            </Group>
          );
        })}
      </Group>
    );
  }
  function TimelineLine({
    stroke,
    minuteMark,
    strokeWidth,
  }: {
    minuteMark: Minutes;
    stroke: HexString;
    strokeWidth: number;
  }): JSX.Element {
    const pixMark = minSinceMidnightToPixels(minuteMark);
    return (
      <Line
        points={[pixMark, 0, pixMark, height]}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    );
  }
  // const url = "/lock.svg";
  // const [lockImage] = useImage(url);
  // console.log("TEST123-routes", routeIDs);

  return (
    <div
      style={{
        height,
      }}
    >
      <Stage height={height} width={width}>
        <Layer>
          <Rect width={width} height={headerHeight} fill="gray" />
          <ButtonList
            y={5}
            x={20}
            buttons={[
              {
                text: "Add New Route",
                fill: "#008800",
                color: "#FFFFFF",
                onClick: addNewRoute,
              },
            ]}
            padding={10}
            margin={10}
          />
          {/* <Text
              x={2}
              y={2}
              text={"+"}
              onClick={() => addNewRoute()}
              fontSize={20}
            /> */}
          <Group>
            {routeIDs.map((_, ii) => {
              console.log("test", headerHeight, ii, lineHeight);
              return (
                <Rect
                  y={headerHeight + ii * lineHeight}
                  width={width}
                  strokeWidth={2}
                  stroke="#888888"
                  fill={ii % 2 === 0 ? "#ffffff" : "#ccccff"}
                  height={lineHeight}
                />
              );
            })}
          </Group>
        </Layer>
        <Layer x={timelineStartPix}>
          <TimelineLine
            minuteMark={closingTime}
            stroke={"#FF0000"}
            strokeWidth={3}
          />
          <TimelineLine
            minuteMark={currentTime}
            stroke={"#FF0000"}
            strokeWidth={3}
          />
          {([...Array.from({ length: HOURS_IN_DAY }).keys()] as Hours[]).map(
            (H) => {
              return (
                <Group x={minSinceMidnightToPixels(calcMinutesFromHours(H))}>
                  <Text text={`${H}:00`} fontSize={20} fill={"white"} />
                  <TimelineLine
                    minuteMark={0 as Minutes}
                    stroke={"#AAAAAA"}
                    strokeWidth={1}
                  />
                </Group>
              );
            }
          )}
        </Layer>
        <Layer>
          {routeIDs.map((id, ii) => {
            const route = routes.find((route) => route.id === id);
            if (!route) {
              return <></>;
            }
            console.log("TEST123-drivers", route.routeStops, route?.drivers);
            return (
              <>
                <Group y={headerHeight + ii * lineHeight}>
                  {/* <Image width={50} height={50} image={lockImage} /> */}
                  {/* <Text
                    text={Object.keys(drivers)
                      .filter((driverID) => drivers[driverID]?.includes(id))
                      .join(", ")}
                  /> */}
                  <Text
                    text={`${route.drivers.length} Driver${
                      route.drivers.length === 1 ? "" : "s"
                    } Assigned`}
                  />
                  <Text
                    y={10}
                    text={`${route.routeStops.length} Stop${
                      route.routeStops.length === 1 ? "" : "s"
                    } Assigned`}
                  />
                  {
                    <Group x={-40} y={10}>
                      <ButtonList
                        x={timelineStartPix / 2}
                        padding={15}
                        margin={10}
                        buttons={[
                          {
                            fill: "#00FF00",
                            onClick: () => addSelectedStopToRoute(id),
                            text: "+Stop",
                            disabled:
                              selectedStop === null ||
                              route.routeStops.filter(
                                (stop) => stop.id === selectedStop
                              ).length > 0,
                          },
                          {
                            fill: "#FF0000",
                            onClick: () => removeSelectedStopFromRoute(id),
                            text: "-Stop",
                            disabled:
                              selectedStop === null ||
                              route.routeStops.filter(
                                (stop) => stop.id === selectedStop
                              ).length === 0,
                          },
                        ]}
                      />
                      <Group x={70}>
                        <ButtonList
                          x={timelineStartPix / 2}
                          padding={15}
                          margin={10}
                          buttons={[
                            {
                              fill: "#0000FF",
                              onClick: () =>
                                selectedDriver &&
                                addDriverToRoute(selectedDriver, id),
                              text: "+Driver",
                              disabled:
                                selectedDriver === null ||
                                route.drivers.includes(selectedDriver),
                            },
                            {
                              fill: "#DD0000",
                              onClick: () =>
                                selectedDriver &&
                                removeDriverFromRoute(selectedDriver, id),
                              text: "-Driver",
                              disabled:
                                selectedDriver === null ||
                                !route.drivers.includes(selectedDriver),
                            },
                          ]}
                        />
                      </Group>
                      <ButtonList
                        y={70}
                        x={130}
                        padding={10}
                        margin={10}
                        buttons={[
                          {
                            fill: "#FF00FF",
                            onClick: () => optimizeRoute(id),
                            text: "Optimize",
                            disabled: route.routeStops.length === 0,
                          },
                        ]}
                      />
                    </Group>
                  }
                  {/* <Group
                    x={timelineStartPix}
                    y={((1 - bubblePerc) / 2) * lineHeight}
                  > */}
                  {route && <Beads route={route} />}
                </Group>
              </>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
