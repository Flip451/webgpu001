import { useRef } from "react";
import useSimpleCube from "../hooks/useRotatingCube";
import HomeLink from "../components/HomeLink";

export default function SimpleCube() {
  const ref = useRef<HTMLCanvasElement>(null)
  const { isLoading, message } = useSimpleCube(ref)

  return (
    <div>
      <h1>Simple Cube</h1>

      <h2>{message}</h2>
      {isLoading && <h2>Loading...</h2>}

      <div>
        <canvas ref={ref} width="640" height="480"></canvas>
      </div>

      <HomeLink />
    </div>
  )
}