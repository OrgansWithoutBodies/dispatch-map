import { Coordinate } from "./data/data.store";

export type Address = {
  street: string;
  city: string;
  state: string;
  zipCode: number;
};

export interface FreeFormAddress {
  q: string;
}

export type IAddress = Address | FreeFormAddress;

export interface CoordinateAddress<TAdress extends IAddress> {
  address: TAdress;
  coordinates: Coordinate;
}
