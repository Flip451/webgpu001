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

      {isLoading && <h2>Loading...</h2>}

      <div>
        <canvas ref={ref} width="640" height="480"></canvas>
      </div>
      <Link to="/">Home</Link>
    </div>
  )
}