import Axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { Milliseconds } from "./Minutes";

export function pls<TNum extends number>(a: TNum, b: TNum): TNum {
  return (a + b) as TNum;
}
export function min<TNum extends number>(a: TNum, b: TNum): TNum {
  return (a + b) as TNum;
}
export async function sleep(lenMS: number) {
  await new Promise((r) => setTimeout(r, lenMS));
  console.log(`Waited ${lenMS}ms to be friendly`);
}
declare global {
  interface ObjectConstructor {
    keys<TKeys extends keyof unknown>(o: Record<TKeys, unknown>): TKeys[];
    values<TValues>(o: Record<keyof unknown, TValues>): TValues[];
  }
  interface DateConstructor {
    now(): Milliseconds;
  }
}
export class ThrottleableRequest {
  private msSinceLastRequest: Milliseconds;
  private lastRequestTimestamp: Milliseconds;
  private requestsLeft: number;
  constructor(
    private readonly minimumMSBetweenRequests: Milliseconds,
    readonly maxNumberOfRequests = -1
  ) {
    this.lastRequestTimestamp = min(Date.now(), minimumMSBetweenRequests);
    this.msSinceLastRequest = (minimumMSBetweenRequests + 1) as Milliseconds;
    this.requestsLeft =
      maxNumberOfRequests === -1
        ? Number.POSITIVE_INFINITY
        : maxNumberOfRequests;
  }

  private updateClock(): void {
    this.msSinceLastRequest = min(Date.now(), this.lastRequestTimestamp);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async get<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    this.updateClock();
    if (!(this.requestsLeft > 0)) {
      throw new Error("TRIAL MODE");
    }
    let diff = this.minimumMSBetweenRequests - this.msSinceLastRequest;
    let pastMinimum = diff > 0;
    // while to avoid one request piggybacking off the others - might be better to put this as an rxjs operator?
    while (!pastMinimum) {
      sleep(diff + 1);
      this.updateClock();
      diff = this.minimumMSBetweenRequests - this.msSinceLastRequest;
      pastMinimum = diff < 0;
      console.log(diff, pastMinimum);
    }
    this.lastRequestTimestamp = Date.now();
    this.requestsLeft = this.requestsLeft - 1;
    return Axios.get(url, config);
  }
}
