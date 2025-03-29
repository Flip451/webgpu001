import { useRef } from "react";
import { Link } from "react-router-dom";
import useSRGBRectangle from "../hooks/useSRGBRectangle";
export default function SRGBRectangle() {
  const ref = useRef<HTMLCanvasElement>(null)
  const { isLoading, message } = useSRGBRectangle(ref)

  return (
    <div>
      <h1>SRGB Quadrangle</h1>

      <h2>{message}</h2>
      {isLoading && <h2>Loading...</h2>}

      <div>
        <canvas ref={ref} width="640" height="480"></canvas>
      </div>
      <div>
        <Link to="/">Home</Link>
      </div>
    </div>
  )
}