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

export type TimeUnits =
  | Milliseconds
  | Seconds
  | Minutes
  | Hours
  | Days
  | Weeks
  | Months
  | Years;

export type KM = BrandedNumber<"KM">;
export type Meter = BrandedNumber<"Meter">;
export type Mile = BrandedNumber<"Mile">;
export type SpaceUnits = Meter | KM | Mile;
export type Gallon = BrandedNumber<"Gallon">;
export type Liter = BrandedNumber<"Liter">;
export type VolumeUnits = Gallon | Liter;

type AnyUnits = VolumeUnits | SpaceUnits | TimeUnits;

export type QuotientUnit<
  TNumerator extends AnyUnits = AnyUnits,
  TDenominator extends AnyUnits = AnyUnits
> = number & { numerator: TNumerator; denominator: TDenominator };
export type FlipQuotient<TQuotient extends QuotientUnit> = QuotientUnit<
  TQuotient["denominator"],
  TQuotient["numerator"]
>;

export type MPG = QuotientUnit<Mile, Gallon>;
export type GPM = FlipQuotient<MPG>;
export function flipQuotient<TQuotient extends QuotientUnit>(
  unit: TQuotient
): FlipQuotient<TQuotient> {
  return (1 / unit) as FlipQuotient<TQuotient>;
}
export function unitMultiplication<TQuotient extends QuotientUnit>(
  a: TQuotient,
  b: TQuotient["denominator"]
): TQuotient["numerator"] {
  return (a * b) as TQuotient["numerator"];
}
export function calcGallons(mpg: MPG, distance: Mile | KM): Gallon {
  return unitMultiplication(
    flipQuotient(mpg),
    distance["__brand"] === "Mile"
      ? distance
      : unitMultiplication(flipQuotient(KM_TO_MILE), distance)
  );
}
export function calcMiles(mpg: MPG, gallons: Gallon): Mile {
  return unitMultiplication(mpg, gallons);
}
export function calcMinutesFromHours(hours: Hours): Minutes {
  return unitMultiplication(flipQuotient(HOURS_TO_MINUTES), hours);
}
export function calcMinutesFromSeconds(secs: Seconds): Minutes {
  return unitMultiplication(MINUTES_TO_SECONDS, secs);
}
export function calcKMFromMeters(m: Meter): KM {
  return unitMultiplication(flipQuotient(M_TO_KM), m);
}
export function calcMilesFromKM(km: KM): Mile {
  return unitMultiplication(flipQuotient(KM_TO_MILE), km);
}
// export function literPerKMToMPG(lpkm:QuotientUnit<Liter, KM>):MPG{
//   return unitMultiplication(lpkm)
// }
// export type UnitConversion<
// SourceUnit extends AnyUnits,
// TargetUnit extends AnyUnits
// > = number & GenericArrow<SourceUnit, TargetUnit>;

export const KM_TO_MILE: QuotientUnit<KM, Mile> = 0.621371 as QuotientUnit<
  KM,
  Mile
>;
export const HOURS_TO_MINUTES: QuotientUnit<Hours, Minutes> =
  60 as QuotientUnit<Hours, Minutes>;
export const MINUTES_TO_SECONDS: QuotientUnit<Minutes, Seconds> =
  60 as QuotientUnit<Minutes, Seconds>;
export const M_TO_KM: QuotientUnit<Meter, KM> = (1 / 1000) as QuotientUnit<
  Meter,
  KM
>;
export const LITER_TO_GALLON: QuotientUnit<KM, Liter> =
  0.264172 as QuotientUnit<KM, Liter>;
