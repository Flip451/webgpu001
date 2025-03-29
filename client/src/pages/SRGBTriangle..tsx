import { useRef } from "react";
import useSRGBTriangle from "../hooks/useSRGBTriangle";
import HomeLink from "../components/HomeLink";

export default function Triangle() {
  const ref = useRef<HTMLCanvasElement>(null)
  const { isLoading, color, changeColor } = useSRGBTriangle(ref)

  return (
    <div>
      <h1>Triangle</h1>
      <div>
        <label>R</label>
        <input type="range" min={0} max={1} step={2 ** (-8)} value={color.r} onChange={(e) => changeColor({ ...color, r: Number(e.target.value) })} />
      </div>
      <div>
        <label>G</label>
        <input type="range" min={0} max={1} step={2 ** (-8)} value={color.g} onChange={(e) => changeColor({ ...color, g: Number(e.target.value) })} />
      </div>
      <div>
        <label>B</label>
        <input type="range" min={0} max={1} step={2 ** (-8)} value={color.b} onChange={(e) => changeColor({ ...color, b: Number(e.target.value) })} />
      </div>
      <div>
        <label>A</label>
        <input type="range" min={0} max={1} step={2 ** (-8)} value={color.a} onChange={(e) => changeColor({ ...color, a: Number(e.target.value) })} />
      </div>

      <div>
        <span>{`(R, G, B, A) = (${color.r}, ${color.g}, ${color.b}, ${color.a})`}</span>
      </div>

      {isLoading && <h2>Loading...</h2>}

      <div>
        <canvas ref={ref} width="640" height="480"></canvas>
      </div>

      <HomeLink />
    </div>
  )
}