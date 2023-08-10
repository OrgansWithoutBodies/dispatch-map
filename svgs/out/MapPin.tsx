import type { SVGProps } from "react";
const SvgMapPin = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={100}
    height={100}
    viewBox="0 0 132.292 132.292"
    {...props}
  >
    <circle
      cx={65.612}
      cy={115.728}
      r={0.023}
      style={{
        fill: "#000",
        stroke: "#000",
        strokeWidth: 0.264583,
      }}
    />
    <circle
      cx={65.612}
      cy={115.728}
      r={0.023}
      style={{
        fill: "#000",
        stroke: "#000",
        strokeWidth: 0.264583,
      }}
    />
    <path
      d="M250 110c-250 0 0 300 0 300s250-300 0-300zm0 42.283a43.513 45 0 0 1 43.514 45 43.513 45 0 0 1-43.514 45 43.513 45 0 0 1-43.514-45 43.513 45 0 0 1 43.514-45z"
      style={{
        fill: "currentColor",
        stroke: "#000",
        strokeWidth: 9.9,
        strokeLinecap: "butt",
        strokeLinejoin: "miter",
        strokeOpacity: 1,
        strokeMiterlimit: 4,
        strokeDasharray: "none",
      }}
      transform="scale(.26458)"
    />
  </svg>
);
export default SvgMapPin;
