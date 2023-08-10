import { useState } from "react";
import { Group, Rect, Text } from "react-konva";
import { HexString } from "type-library";

export function KonvaButton({
  y = 0,
  x = 0,
  fill,
  onClick,
  text,
  fontSize = 20,
  textcolor,
  buttonHeight,
  buttonWidth,
  margin,
  disabled,
}: {
  y?: number;
  x?: number;
  disabled?: boolean;
  fill: HexString;
  fontSize?: number;
  margin: number;
  buttonWidth: number;
  buttonHeight: number;
  onClick: () => void;
  text: string;
  textcolor: HexString;
}) {
  const [pressing, setPressing] = useState<boolean>(false);
  return (
    <Group
      y={y}
      x={x}
      onMouseDown={() => {
        if (!disabled) {
          setPressing(true);
        }
      }}
      onMouseUp={() => {
        if (!disabled) {
          setPressing(false);
        }
      }}
      onClick={() => {
        if (!disabled) {
          onClick();
        }
      }}
    >
      <Rect
        cornerRadius={5}
        x={-margin / 2}
        y={-margin / 2}
        width={buttonWidth + margin}
        height={buttonHeight + margin}
        fill={pressing || disabled ? "gray" : fill}
      />
      <Text align={"center"} text={text} fill={textcolor} fontSize={fontSize} />
    </Group>
  );
}
