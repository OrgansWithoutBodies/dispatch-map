import { Query } from "@datorama/akita";

import { Observable, combineLatest, map } from "rxjs";
import { Mile, Minutes, calcMiles } from "../Units";
import {
  DataState,
  DataStore,
  Route,
  RouteID,
  StopID,
  Vehicle,
  VehicleID,
  dataStore,
} from "./data.store";

export class DataQuery extends Query<DataState> {
  public static calculateNoGasPoint(
    vehicleRouteAssignments: Record<VehicleID, RouteID>,
    routes: Route[],
    vehicles: Record<VehicleID, Vehicle>
  ): (StopID | null | undefined)[] {
    return Object.keys(vehicleRouteAssignments).map((vehicleID) => {
      const route = routes.find(
        ({ id }) => id === vehicleRouteAssignments[vehicleID]
      );
      if (!route) {
        return;
      }
      // assume tank is full at beginning of route
      const availableMilesAtBeginningOfRoute = calcMiles(
        vehicles[vehicleID].milage,
        vehicles[vehicleID].tankVolume
      );
      let cumulativeDistance = 0 as Mile;
      let visitingStops = 0;
      // TODO this isnt in order
      const stopsInOrder = Object.keys(route.pathwaysToGetToStops);
      const numStops = stopsInOrder.length;
      const totalDistance = stopsInOrder.reduce(
        (prev, stopID) =>
          prev + route.pathwaysToGetToStops[stopID].travelDistance,
        0
      );

      let stopAfterWhichGasWillBeEmpty: null | StopID = null;
      while (
        cumulativeDistance < availableMilesAtBeginningOfRoute &&
        cumulativeDistance < totalDistance &&
        visitingStops < numStops
      ) {
        const currentStopID = stopsInOrder[visitingStops] as StopID;
        const currentStop = route.pathwaysToGetToStops[currentStopID];

        cumulativeDistance = (cumulativeDistance +
          currentStop.travelDistance) as Mile;
        if (cumulativeDistance > availableMilesAtBeginningOfRoute) {
          stopAfterWhichGasWillBeEmpty = currentStopID;
        }
        visitingStops = visitingStops + 1;
      }
      return stopAfterWhichGasWillBeEmpty;
    });
  }

  constructor(protected store: DataStore) {
    super(store);
  }
  public trialModeError = this.select("trialModeError");

  public drivers = this.select("drivers");
  public vehicles = this.select("vehicles");
  public addressRouteAssignments = this.select("addressRouteAssignments");
  public vehicleRouteAssignments = this.select("vehicleRouteAssignments");
  public daysStops = this.select("daysStops");
  public routeStops = this.select("routeStops");
  public routeDepartures = this.select("routeDepartures");
  public routeIDs = this.select("routes");
  public routePaths = this.select("routePaths");

  public homeBaseAddress = this.select("homeBase");
  public highlightedStop = this.select("highlightedStop");

  public routes: Observable<Route[]> = combineLatest([
    this.drivers,
    this.daysStops,
    this.routeStops,
    this.routeIDs,
    this.routeDepartures,
    this.routePaths,
  ]).pipe(
    map(
      ([drivers, stops, routeStops, routeIDs, routeDepartures, routePaths]) => {
        // console.log("TEST123-route", {
        //   drivers,
        //   stops,
        //   routeStops,
        //   routeIDs,
        //   routeDepartures,
        //   routePaths,
        // });
        // if (!(Object.keys(routePaths).length > 0)) {
        // return [];
        // }
        return routeIDs.map<Route>((id) => ({
          id,
          departureTime: routeDepartures[id] || (0 as Minutes),
          drivers: Object.keys(drivers).filter((key) =>
            drivers[key].includes(id)
          ),
          routeStops: (routeStops[id] || []).map((stopID) => ({
            ...stops[stopID],
          })),
          pathwaysToGetToStops: routePaths,
          assignedVehicle: null,
        }));
      }
    )
  );

  public timeWhenVehicleBecomesEmpty = combineLatest([
    this.routes,
    this.vehicles,
    this.vehicleRouteAssignments,
  ]).pipe(
    map(([routes, vehicles, vehicleRouteAssignments]) => {
      DataQuery.calculateNoGasPoint(vehicleRouteAssignments, routes, vehicles);
    })
  );
}
export const dataQuery = new DataQuery(dataStore);
