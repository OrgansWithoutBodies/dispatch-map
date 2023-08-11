import { Group, Rect, Text } from "react-konva";
import { COLORS, Placement } from "./App";
import { KonvaButton } from "./KonvaButton";
import { StopID } from "./data/data.store";

export function KonvaTooltip({
  text,
  placement,
  stopID,
}: {
  placement: Placement;
  text: string;
  stopID: StopID;
}) {
  const { width, height } = { width: 300, height: 100 };
  const spoutSize = 20;
  const { width: spoutWidth, height: spoutHeight } = {
    width: spoutSize,
    height: spoutSize,
  };
  const tooltipColor = "silver";
  const buttonHeight = 20;
  return (
    <Group y={placement === Placement.BOTTOM ? height : -height}>
      <Rect
        y={
          placement === Placement.BOTTOM
            ? -spoutSize / 2
            : height - spoutSize / 2
        }
        x={spoutSize}
        fill={tooltipColor}
        width={spoutWidth}
        height={spoutHeight}
        cornerRadius={5}
        rotationDeg={45}
      />
      <Rect
        fill={tooltipColor}
        width={width}
        cornerRadius={5}
        height={height}
      />
      <Group y={height / 2} x={10}>
        <Text text={text} fontSize={30} />
        <KonvaButton
          onClick={() => console.log("TEST-click", stopID)}
          y={height / 2 - buttonHeight}
          buttonWidth={width / 2}
          buttonHeight={buttonHeight}
          fill={COLORS[0]}
          margin={0}
          text={""}
          textcolor={"#FFFFFF"}
        />
      </Group>
    </Group>
  );
}
