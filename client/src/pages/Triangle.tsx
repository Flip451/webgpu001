import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import useRedTriangle from "../hooks/useRedTriangle";

export default function Triangle() {
  const [color, setColor] = useState({ r: 0, g: 0, b: 0, a: 1 });
  const ref = useRef<HTMLCanvasElement>(null)
  const { isLoading } = useRedTriangle(ref)

  return (
    <div>
      <h1>Triangle</h1>
      <div>
        <label>R</label>
        <input type="range" min={0} max={1} step={2 ** (-8)} value={color.r} onChange={(e) => setColor({ ...color, r: Number(e.target.value) })} />
      </div>
      <div>
        <label>G</label>
        <input type="range" min={0} max={1} step={2 ** (-8)} value={color.g} onChange={(e) => setColor({ ...color, g: Number(e.target.value) })} />
      </div>
      <div>
        <label>B</label>
        <input type="range" min={0} max={1} step={2 ** (-8)} value={color.b} onChange={(e) => setColor({ ...color, b: Number(e.target.value) })} />
      </div>
      <div>
        <label>A</label>
        <input type="range" min={0} max={1} step={2 ** (-8)} value={color.a} onChange={(e) => setColor({ ...color, a: Number(e.target.value) })} />
      </div>

      <div>
        <span>{`(R, G, B, A) = (${color.r}, ${color.g}, ${color.b}, ${color.a})`}</span>
      </div>

      {isLoading && <h2>Loading...</h2>}

      <div>
        <canvas ref={ref} width="640" height="480"></canvas>
      </div>
      <Link to="/">Home</Link>
    </div>
  )
}