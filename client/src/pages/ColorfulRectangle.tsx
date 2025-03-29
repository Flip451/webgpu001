import { useRef } from "react";
import useColorfulRectangle, { Color } from "../hooks/useColorfulRectangle";
import HomeLink from "../components/HomeLink";
export default function ColorfulRectangle() {
  const ref = useRef<HTMLCanvasElement>(null)
  const {
    isLoading,
    message,
    leftTopColor,
    setLeftTopColor,
    rightTopColor,
    setRightTopColor,
    leftBottomColor,
    setLeftBottomColor,
    rightBottomColor,
    setRightBottomColor,
  } = useColorfulRectangle(ref)

  return (
    <div>
      <h1>Colorful Rectangle</h1>

      <h2>{message}</h2>
      {isLoading && <h2>Loading...</h2>}

      <ColorInput label="Left Top" color={leftTopColor} setColor={setLeftTopColor} />
      <ColorInput label="Right Top" color={rightTopColor} setColor={setRightTopColor} />
      <ColorInput label="Left Bottom" color={leftBottomColor} setColor={setLeftBottomColor} />
      <ColorInput label="Right Bottom" color={rightBottomColor} setColor={setRightBottomColor} />

      <div>
        <canvas ref={ref} width="640" height="480"></canvas>
      </div>

      <HomeLink />
    </div>
  )
}

const ColorInput = ({ label, color, setColor }: { label: string, color: Color, setColor: (color: Color) => void }) => {
  return (
    <>
      <h3>{label}</h3>
      <div>
        <label>R</label>
        <input type="range" min={0} max={255} step={1} value={color.r} onChange={(e) => setColor({ ...color, r: Number(e.target.value) })} />
      </div>
      <div>
        <label>G</label>
        <input type="range" min={0} max={255} step={1} value={color.g} onChange={(e) => setColor({ ...color, g: Number(e.target.value) })} />
      </div>
      <div>
        <label>B</label>
        <input type="range" min={0} max={255} step={1} value={color.b} onChange={(e) => setColor({ ...color, b: Number(e.target.value) })} />
      </div>
      <div>
        <label>A</label>
        <input type="range" min={0} max={255} step={1} value={color.a} onChange={(e) => setColor({ ...color, a: Number(e.target.value) })} />
      </div>
    </>
  )
}