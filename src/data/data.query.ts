import { Query } from "@datorama/akita";

import { Observable, combineLatest, map } from "rxjs";
import { Minutes } from "../Minutes";
import { DataState, DataStore, Route, dataStore } from "./data.store";

export class DataQuery extends Query<DataState> {
  constructor(protected store: DataStore) {
    super(store);
  }
  public drivers = this.select("drivers");
  public addressRouteAssignments = this.select("addressRouteAssignments");
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
        if (
          !(Object.keys(drivers).length > 0) ||
          !(Object.keys(stops).length > 0) ||
          !(Object.keys(routeStops).length > 0) ||
          !(Object.keys(routePaths).length > 0)
        ) {
          return [];
        }
        return routeIDs.map<Route>((id) => ({
          id,
          departureTime: routeDepartures[id] || (0 as Minutes),
          drivers: Object.keys(drivers).filter((key) =>
            drivers[key].includes(id)
          ),
          routeStops: routeStops[id].map((stopID) => ({ ...stops[stopID] })),
          pathwaysToGetToStops: routePaths,
        }));
      }
    )
  );
}
export const dataQuery = new DataQuery(dataStore);
