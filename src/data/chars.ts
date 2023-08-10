const chars = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
];
export function generateID<TType extends string = string>(
  len: number = 32
): TType {
  return [...Array(len).keys()]
    .map(
      (ii) =>
        chars[Math.round(Math.random() * (chars.length - 1))] +
        (ii === 7 || ii === 11 || ii === 15 || ii === 19 ? "-" : "")
    )
    .join("") as TType;
}
