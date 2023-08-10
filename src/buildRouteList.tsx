// import { Address } from "./Address";
// import { COLORS, MINUTES_IN_HOUR, NOMINATIM_MINIMUM_WAIT, sleep } from "./App";
// import { Milliseconds, Minutes } from "./Minutes";
// import { dataService } from "./data/data.service";
// import { Coordinate, Route, StopID } from "./data/data.store";

// async function getAddressListCoords(
//   addresses: Address[]
// ): Promise<(null | ({ display_name: string } & Coordinate))[]> {
//   const totalData = [];
//   for (const address of addresses) {
//     const data = await dataService.getNominatim(address);
//     totalData.push(data);
//     await sleep((1.2 * NOMINATIM_MINIMUM_WAIT) as Milliseconds);
//   }
//   return totalData;
// }
// async function getRouteListCoords(coords: Coordinate[][]): Promise<
//   ({
//     coordinates: [longitude: number, latitude: number][];
//     duration: Minutes;
//   } | null)[]
// > {
//   const totalData = [];
//   for (const address of coords) {
//     const data = await dataService.getOSRM(address);
//     totalData.push(data);
//     await sleep((1.2 * NOMINATIM_MINIMUM_WAIT) as Milliseconds);
//   }
//   return totalData;
// }

// async function getRouteBetweenAddresses(
//   addresses: Address[],

//   aa: number
// ): Promise<null | Route> {
//   const data = await getAddressListCoords(addresses);
//   if (data.filter((val) => val === null).length > 0) {
//     return null;
//   }
//   const routeData = await getRouteListCoords(
//     data.slice(0, data.length - 1).map((_, ii) => [data[ii]!, data[ii + 1]!])
//   );
//   if (routeData.filter((val) => val === null).length > 0) {
//     return null;
//   }

//   // TODO cache lookups
//   const route: Route = {
//     driverNames: ["test1", "test2"],
//     color: COLORS[aa],
//     departureTime: MINUTES_IN_HOUR,
//     routeStops: data.slice(0, data.length - 1).map((_, ii) => {
//       return {
//         stopID: `${aa}-${ii}` as StopID,
//         coordinates: data[ii + 1],
//         expectedStopDuration: MINUTES_IN_HOUR,
//         pathwayToGetToStop: {
//           path: routeData.map((route) => route!.coordinates)[ii],
//           travelDuration: routeData.flatMap((route) => route!.duration)[ii],
//         },
//       };
//     }),
//   };
//   return route;
// }
// export async function buildRouteList(
//   addressesList: Address[][],
//   setRoutes: (route: Route[]) => void
// ): Promise<null | void> {
//   const totalData = [];
//   for (const aa of addressesList.keys()) {
//     const data = await getRouteBetweenAddresses(addressesList[aa], aa);
//     if (totalData === null) {
//       return;
//     }
//     totalData.push(data as Route);
//   }
//   setRoutes(totalData);
// }
