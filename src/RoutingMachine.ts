// import { createControlComponent } from "@react-leaflet/core";
// import L from "leaflet";
// import "leaflet-routing-machine";
// import { ArrV2 } from "type-library";
// const createRoutingMachineLayer = (waypoints: ArrV2[]) => {
//   const instance = L.Routing.control({
//     waypoints: waypoints.map(([lat, lon]) => L.latLng(lat, lon)),
//     lineOptions: {
//       styles: [{ color: "#6FA1EC", weight: 4 }],
//     },
//     show: true,
//     addWaypoints: false,
//     routeWhileDragging: true,
//     draggableWaypoints: false,
//     fitSelectedRoutes: true,
//     showAlternatives: false,
//   });

//   return instance;
// };

// const useRoutingMachine = ({
//   waypoints,
// }: {
//   waypoints: ArrV2[];
// }): JSX.Element => createControlComponent(createRoutingMachineLayer(waypoints));

// export default useRoutingMachine;
