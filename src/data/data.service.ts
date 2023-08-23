import { ArrV2 } from "type-library";
import { Address, FreeFormAddress, IAddress } from "../Address";
import {
  Meter,
  Milliseconds,
  Minutes,
  Seconds,
  calcKMFromMeters,
  calcMilesFromKM,
  calcMinutesFromSeconds,
} from "../Units";
import { ThrottleableRequest } from "../throttleRequest";
import { generateID } from "./chars";
import {
  Coordinate,
  DataStore,
  DriverID,
  PathwayFromLastStop,
  RouteID,
  Stop,
  StopID,
  dataStore,
} from "./data.store";

export const TRIAL_MODE_ALLOWED_QUERIES = 10 as const;
const freeFormGuard = (address: IAddress): address is FreeFormAddress => {
  return !("zipCode" in address);
};
type OSRMGeometry = {
  coordinates: [longitude: number, latitude: number][];
  type: "LineString";
};

// type OSRMRouteReturnType = {
//   code: number;
//   routes: {
//     distance: number;
//     duration: Seconds;
//     geometry: {
//       coordinates: [longitude: number, latitude: number][];
//       type: "LineString";
//     };
//   }[];
//   waypoints: {
//     distance: number;
//     hint: string;
//     location: ArrV2;
//     name: string;
//   }[];
// };
type OSRMReturnType = {
  code: number;
  trips: {
    distance: Meter;
    legs: {
      distance: Meter;
      duration: Seconds;
      weight: number;
      steps: { geometry: OSRMGeometry }[];
    }[];
    duration: Seconds;
    geometry: OSRMGeometry;
  }[];
  waypoints: {
    waypoint_index: number;
    distance: Meter;
    hint: string;
    location: ArrV2;
    name: string;
  }[];
};
type NominatimReturnType = {
  display_name: string;
  lat: `${number}`;
  lon: `${number}`;
}[];

const HOME_BASE_DUMMY_STOP = (homeBase: Coordinate): Stop => ({
  id: "HOME" as StopID,
  coordinates: homeBase,
  address: { q: "HOME" },
  duration: 0 as Minutes,
  minNumberOfWorkers: 0,
  stopDescription: "home sweet home",
});

export class DataService {
  private requestThrottle: ThrottleableRequest;

  constructor(private dataStore: DataStore) {
    this.requestThrottle = new ThrottleableRequest(
      1000 as Milliseconds,
      TRIAL_MODE_ALLOWED_QUERIES,
      () => this.triggerTrialMode()
    );
  }

  // TODO abstract the common between
  public async getNominatim(
    address: Address | FreeFormAddress
  ): Promise<{ lat: number; lng: number; display_name: string } | null> {
    const {
      mapServiceURLs: { Nominatim: NOMINATIM_URL },
    } = this.dataStore.getValue();

    const result = await this.requestThrottle.get<NominatimReturnType>(
      buildNominatimURL(address, NOMINATIM_URL)
    );

    const { data, status } = result;
    if (status !== 200) {
      return null;
    }
    const { lat: latStr, lon: lonStr, display_name } = data[0];

    return {
      lat: Number.parseFloat(latStr),
      lng: Number.parseFloat(lonStr),
      display_name,
    };
  }
  public async getOSRM(stops: Stop[]): Promise<PathwayFromLastStop | null> {
    const {
      mapServiceURLs: { OSRM: OSRM_URL },
    } = this.dataStore.getValue();
    const OSRM_QUERY = DataService.buildOSRMQuery(OSRM_URL, stops);
    const result = await this.requestThrottle.get<OSRMReturnType>(OSRM_QUERY);
    const { data, status } = result;
    if (status !== 200) {
      return null;
    }
    const wayPointsAsStops = getWaypointsAsStops(data, stops);
    return DataService.formatData(data, wayPointsAsStops);
  }

  private static buildOSRMQuery(OSRM_URL: string, stops: Stop[]) {
    return `${OSRM_URL}${stops
      .map(({ coordinates: { lat, lng } }) => {
        return `${lng},${lat}`;
      })
      .join(";")}?geometries=geojson&steps=true&annotations=true&source=first`;
  }

  private static formatData(
    data: OSRMReturnType,
    wayPointsAsStops: ({
      waypoint_index: number;
      distance: Meter;
      hint: string;
      location: [number, number];
      name: string;
    } & { stopID: StopID })[]
  ): PathwayFromLastStop | PromiseLike<PathwayFromLastStop | null> | null {
    return Object.fromEntries(
      data.trips[0].legs.map((leg, ii) => {
        return [
          wayPointsAsStops.find((waypoint) => waypoint.waypoint_index === ii)
            ?.stopID,
          {
            coordinates: leg.steps
              .map((step) => step.geometry.coordinates)
              .flat(),
            travelDuration: calcMinutesFromSeconds(leg.duration),
            travelDistance: calcMilesFromKM(calcKMFromMeters(leg.distance)),
          },
        ];
      })
    );
  }

  public addDriver(): void {
    this.dataStore.update((state) => {
      const newID = generateID<DriverID>();
      return {
        ...state,
        drivers: { ...state.drivers, [newID]: [] },
      };
    });
  }
  public updateDurationForStop(stop: StopID, duration: Minutes): void {
    this.dataStore.update((state) => {
      return {
        ...state,
        daysStops: {
          ...state.daysStops,
          [stop]: { ...state.daysStops[stop], duration },
        },
      };
    });
  }

  public async addDayStop(address: FreeFormAddress): Promise<void> {
    const data = await this.getNominatim(address);

    const newID = generateID<StopID>();
    this.dataStore.update((state) => {
      return {
        ...state,
        daysStops: {
          ...state.daysStops,
          [newID]: {
            id: newID,
            duration: 10 as Minutes,
            minNumberOfWorkers: 1,
            coordinates: data,
            stopDescription: "TEST DESCRIPTION",
          },
        },
      };
    });
  }

  public addDriverToRoute(driver: DriverID, route: RouteID): void {
    this.dataStore.update((state) => {
      return {
        ...state,
        drivers: {
          ...state.drivers,
          [driver]: [...state.drivers[driver], route],
        },
      };
    });
  }
  public removeDriverFromRoute(driver: DriverID, route: RouteID): void {
    this.dataStore.update((state) => {
      return {
        ...state,
        drivers: {
          ...state.drivers,
          [driver]: [
            ...state.drivers[driver].filter((routeID) => routeID !== route),
          ],
        },
      };
    });
  }
  public addDayRoute(): void {
    const newID = generateID<RouteID>();
    this.dataStore.update((state) => {
      return {
        ...state,
        routes: [...state.routes, newID],
      };
    });
  }
  public setRouteDeparture(route: RouteID, departure: Minutes): void {
    this.dataStore.update((state) => {
      return {
        ...state,
        routeDepartures: { ...state.routeDepartures, [route]: departure },
      };
    });
  }
  public async calculateRoutePath(route: RouteID): Promise<void> {
    const { routeStops, daysStops, homeBase } = this.dataStore.getValue();
    console.log("TEST123-calculating");
    if (!homeBase) {
      return;
    }
    const data = await this.getOSRM([
      HOME_BASE_DUMMY_STOP(homeBase),
      ...routeStops[route].map((stop) => daysStops[stop]),
    ]);
    if (!data) {
      throw new Error("whoops");
    }
    this.dataStore.update((state) => {
      const newRoutePath: (typeof state)["routePaths"] = data;
      return {
        ...state,
        routePaths: { ...state.routePaths, ...newRoutePath },
      };
    });
  }
  private triggerTrialMode() {
    console.log("TEST123-trigger");
    return this.dataStore.update(({ ...s }) => ({
      ...s,
      trialModeError: true,
    }));
  }

  public async setHomeBase(address: FreeFormAddress): Promise<void> {
    const data = await this.getNominatim(address);
    if (!data) {
      throw new Error("whoops");
    }
    const { lat, lng } = data;
    this.dataStore.update((state) => {
      return {
        ...state,
        homeBase: { lat, lng },
      };
    });
    if (this.dataStore.getValue().routes.length === 0) {
      this.addDayRoute();
      this.addDriver();
    }
  }
  // TODO if already exists in one, remove from that one & add to new one
  public addStopToRoute(stop: StopID, route: RouteID): void {
    this.dataStore.update((state) => {
      return {
        ...state,
        routeStops: {
          ...state.routeStops,
          [route]: state.routeStops[route]
            ? [...state.routeStops[route], stop]
            : [stop],
        },
        highlightedStop: null,
      };
    });
    console.log(this.dataStore.getValue().routeStops);
  }
  public removeSelectedStopFromRoute(stop: StopID, route: RouteID): void {
    this.dataStore.update((state) => {
      return {
        ...state,
        routeStops: {
          ...state.routeStops,
          [route]: state.routeStops[route]
            ? [
                ...state.routeStops[route].filter(
                  (stopToFilter) => stopToFilter !== stop
                ),
              ]
            : [],
        },
        highlightedStop: null,
      };
    });
    console.log(this.dataStore.getValue().routeStops);
  }
}

export const dataService = new DataService(dataStore);
function getWaypointsAsStops(
  data: OSRMReturnType,
  stops: Stop[]
): ((typeof data)["waypoints"][number] & {
  stopID: StopID;
})[] {
  return data.waypoints.map((waypoint) => ({
    ...waypoint,
    stopID: stops.find(
      ({ coordinates: { lat, lng } }) =>
        Math.abs(lng - waypoint.location[0]) < 0.001 &&
        Math.abs(lat - waypoint.location[1]) < 0.001
    )!.id,
  }));
}

function buildNominatimURL(
  address: Address | FreeFormAddress,
  NOMINATIM_URL: string
): string {
  const isFreeform = freeFormGuard(address);
  if (isFreeform) {
    return `${NOMINATIM_URL}search?q=${address.q}&format=json`
      .split(" ")
      .join("%20");
  }
  return `${NOMINATIM_URL}search?street=${address.street.replace(
    " ",
    "+"
  )}&city=${address.city.replace(" ", "+")}&state=${address.state.replace(
    " ",
    "+"
  )}&postalcode=${address.zipCode}&country=US&format=json`;
}
