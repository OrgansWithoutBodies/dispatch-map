import { Store, StoreConfig } from "@datorama/akita";
import { ArrV2, BrandedString } from "type-library";
import { FreeFormAddress } from "../Address";
import { Minutes } from "../Minutes";

export const DEFAULT_NOMINATIM_URL = "https://nominatim.openstreetmap.org/";
export const DEFAULT_OSRM_URL = `https://router.project-osrm.org/trip/v1/driving/`;

export type RouteID = BrandedString<"Route">;
export type StopID = BrandedString<"Stop">;
export type DriverID = BrandedString<"Driver">;

export type Vehicle = {
  alias: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  milage: number;
  storageCapacity: number;
};

export type Coordinate = { lat: number; lng: number };

export type PathwayFromLastStop = Record<
  StopID,
  {
    coordinates: ArrV2[];
    travelDuration: Minutes;
  }
>;

export type Route = {
  id: RouteID;
  drivers: DriverID[];
  departureTime: Minutes;
  routeStops: Stop[];
  pathwaysToGetToStops: PathwayFromLastStop;
};
// export interface CoordinateAddress extends Address {
//   coordinates: Coordinate;
// }
// export interface CoordinateAddressFreeform extends FreeFormAddress {
// }
export interface Stop {
  coordinates: Coordinate;
  address: FreeFormAddress;
  id: StopID;
  duration: Minutes;
  minNumberOfWorkers: number;
  stopDescription: string;
}
export interface DataState {
  highlightedStop: StopID | null;
  homeBase: Coordinate | null;

  routes: RouteID[];
  daysStops: Record<StopID, Stop>;
  addressRouteAssignments: Record<StopID, RouteID>;
  drivers: Record<DriverID, RouteID[]>;
  routeDepartures: Record<RouteID, Minutes>;
  routeStops: Record<RouteID, StopID[]>;
  routePaths: PathwayFromLastStop;

  addressCoordinateLookupCache: Record<string, Coordinate>;

  mapServiceURLs: Record<"OSRM" | "Nominatim", string>;

  trialModeError: boolean;
}

// TODO persist
export function createInitialState(): DataState {
  return {
    routeDepartures: {},
    routes: [],
    homeBase: null,
    highlightedStop: null,
    drivers: {},
    daysStops: {},
    routeStops: {},
    routePaths: {},
    addressRouteAssignments: {},

    addressCoordinateLookupCache: {},
    mapServiceURLs: {
      Nominatim: DEFAULT_NOMINATIM_URL,
      OSRM: DEFAULT_OSRM_URL,
    },
    trialModeError: false,
  };
}

@StoreConfig({ name: "dataStore" })
export class DataStore extends Store<DataState> {
  constructor() {
    super(createInitialState());
  }
}

export const dataStore = new DataStore();
export function numericalQCode<TNum extends number>(country: {
  item: { value: `Q${TNum}` };
}): TNum {
  return Number.parseInt(country.item.value.replace("Q", "")) as TNum;
}
