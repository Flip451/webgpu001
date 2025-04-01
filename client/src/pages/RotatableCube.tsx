import { useRef } from "react";
import HomeLink from "../components/HomeLink";
import useRotatableCube from "../hooks/useRotatableCube";

export default function RotatableCube() {
  const ref = useRef<HTMLCanvasElement>(null)
  const { isLoading, message, phi, setPhi, theta, setTheta } = useRotatableCube(ref)

  return (
    <div>
      <h1>Simple Cube</h1>

      <h2>{message}</h2>
      {isLoading && <h2>Loading...</h2>}

      <div>
        <label>Phi</label>
        <input type="range" min={0} max={Math.PI * 2} step={Math.PI / 200} value={phi} onChange={(e) => setPhi(Number(e.target.value))} />
      </div>
      <div>
        <label>Theta</label>
        <input type="range" min={0} max={Math.PI} step={0.1} value={theta} onChange={(e) => setTheta(Number(e.target.value))} />
      </div>

      <div>
        <canvas ref={ref} width="640" height="480"></canvas>
      </div>

      <HomeLink />
    </div>
  )
}