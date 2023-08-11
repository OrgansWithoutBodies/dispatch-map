import { ArrV2 } from "type-library";
import { Address, FreeFormAddress, IAddress } from "../Address";
import { Milliseconds, Minutes, Seconds } from "../Minutes";
import { ThrottleableRequest } from "../throttleRequest";
import { generateID } from "./chars";
import {
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
    distance: number;
    legs: {
      distance: number;
      duration: number;
      weight: number;
      steps: { geometry: OSRMGeometry }[];
    }[];
    duration: Seconds;
    geometry: OSRMGeometry;
  }[];
  waypoints: {
    waypoint_index: number;
    distance: number;
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
const requestThrottle = new ThrottleableRequest(
  1000 as Milliseconds,
  TRIAL_MODE_ALLOWED_QUERIES
);

export class DataService {
  constructor(private dataStore: DataStore) {}

  // TODO abstract the common between
  public async getNominatim(
    address: Address | FreeFormAddress
  ): Promise<{ lat: number; lng: number; display_name: string } | null> {
    const {
      mapServiceURLs: { Nominatim: NOMINATIM_URL },
    } = this.dataStore.getValue();

    console.log(buildNominatimURL(address, NOMINATIM_URL));
    const result = await requestThrottle
      .get<NominatimReturnType>(buildNominatimURL(address, NOMINATIM_URL))
      .catch(
        (error) =>
          error.message === "TRIAL MODE" &&
          this.dataStore.update(({ ...state }) => ({
            ...state,
            trialModeError: true,
          }))
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
    const OSRM_QUERY = `${OSRM_URL}${stops
      .map(({ coordinates: { lat, lng } }) => {
        return `${lng},${lat}`;
      })
      .join(";")}?geometries=geojson&steps=true&annotations=true&source=first`;
    const result = await requestThrottle.get<OSRMReturnType>(OSRM_QUERY);
    const { data, status } = result;
    if (status !== 200) {
      return null;
    }
    // console.log("TEST123-data", data.waypoints, stops);
    const wayPointsAsStops: ((typeof data)["waypoints"][number] & {
      stopID: StopID;
    })[] = data.waypoints.map((waypoint) => ({
      ...waypoint,
      stopID: stops.find(
        ({ coordinates: { lat, lng } }) =>
          Math.abs(lng - waypoint.location[0]) < 0.001 &&
          Math.abs(lat - waypoint.location[1]) < 0.001
      )!.id,
    }));
    return Object.fromEntries(
      data.trips[0].legs.map((leg, ii) => {
        // console.log(
        //   "TEST123-leg",
        //   wayPointsAsStops,
        //   wayPointsAsStops.find((waypoint) => waypoint.waypoint_index === ii)
        // );
        return [
          wayPointsAsStops.find((waypoint) => waypoint.waypoint_index === ii)
            ?.stopID,
          {
            coordinates: leg.steps
              .map((step) => step.geometry.coordinates)
              .flat(),
            travelDuration: (leg.duration / 60) as Minutes,
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
      {
        id: "HOME" as StopID,
        coordinates: homeBase,
        address: { q: "HOME" },
        duration: 0 as Minutes,
        minNumberOfWorkers: 0,
        stopDescription: "home sweet home",
      },
      ...routeStops[route].map((stop) => daysStops[stop]),
      // {
      //   id: "HOME" as StopID,
      //   coordinates: homeBase,
      //   address: {} as any,
      //   duration: 0 as Minutes,
      //   minNumberOfWorkers: 0,
      //   stopDescription: "home sweet home",
      // },
    ]).catch(
      (error) =>
        error.message === "TRIAL MODE" &&
        this.dataStore.update(({ ...s }) => ({ ...s, trialModeError: true }))
    );
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
