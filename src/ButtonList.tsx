import Konva from "konva";
import { Group } from "react-konva";
import { HexString } from "type-library";
import { KonvaButton } from "./KonvaButton";

export function ButtonList({
  x = 0,
  y = 0,
  buttons,
  padding,
  margin,
}: {
  x?: number;
  y?: number;
  padding: number;
  margin: number;
  buttons: {
    text: string;
    color: HexString;
    onClick: () => void;
    disabled?: boolean;
  }[];
}) {
  const sizes = buttons.map((button) =>
    new Konva.Text({
      text: button.text,
      fontSize: 20,
      align: "center",
    }).getSize()
  );
  return (
    <Group x={x} y={y}>
      {sizes.map((size, ii) => {
        console.log("TEST123", ii);
        return (
          <KonvaButton
            disabled={buttons[ii].disabled === true ? true : false}
            margin={margin}
            x={(Math.max(...sizes.map((size) => size.width)) - size.width) / 2}
            y={[...sizes]
              .slice(0, ii)
              .reduce((a, b) => a + b.height + padding, 0)}
            buttonHeight={size.height}
            buttonWidth={size.width}
            fill={buttons[ii].color}
            text={buttons[ii].text}
            onClick={() => buttons[ii].onClick()}
            textcolor={"#ffffff"}
          />
        );
      })}
    </Group>
  );
}
