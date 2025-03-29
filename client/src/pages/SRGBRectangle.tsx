import { useRef } from "react";
import { Link } from "react-router-dom";
import useSRGBRectangle from "../hooks/useSRGBRectangle";
export default function SRGBRectangle() {
  const ref = useRef<HTMLCanvasElement>(null)
  const { isLoading, message, color, setColor } = useSRGBRectangle(ref)

  return (
    <div>
      <h1>SRGB Quadrangle</h1>

      <h2>{message}</h2>
      {isLoading && <h2>Loading...</h2>}

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


      <div>
        <canvas ref={ref} width="640" height="480"></canvas>
      </div>
      <div>
        <Link to="/">Home</Link>
      </div>
    </div>
  )
}