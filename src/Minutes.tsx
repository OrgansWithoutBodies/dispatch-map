import { BrandedNumber } from "type-library";

// const icon = new L.Icon({
//   iconUrl: <MapPin />,
//   iconRetinaUrl: marker,
//   popupAnchor: [-0, -0],
//   iconSize: [32, 45],
// });
// TODO grab selection of stops, reassign to different technician
// type isnt quite right - each path should end in a node
// interface Stop {
//   coordinates: ArrV2;
//   name: string;
//   type: "JobSite" | "Gas" | "Base";
// }
// type Route = ({ type: "TRAVEL"; path: ArrV2[] } | { type: "WORK" })[];

export type Milliseconds = BrandedNumber<"MS">;
export type Seconds = BrandedNumber<"S">;
export type Minutes = BrandedNumber<"M">;
export type Hours = BrandedNumber<"H">;
export type Days = BrandedNumber<"D">;
export type Weeks = BrandedNumber<"W">;
export type Months = BrandedNumber<"Month">;
export type Years = BrandedNumber<"Y">;
// export function convertTime()
