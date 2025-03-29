import { useRef } from "react";
import { Link } from "react-router-dom";
import useRedTriangle from "../hooks/useRedTriangle";
import HomeLink from "../components/HomeLink";

export default function RedTriangle() {
  const ref = useRef<HTMLCanvasElement>(null)
  const { isLoading, message } = useRedTriangle(ref)

  return (
    <div>
      <h1>Triangle</h1>

      <h2>{message}</h2>
      {isLoading && <h2>Loading...</h2>}

      <div>
        <canvas ref={ref} width="640" height="480"></canvas>
      </div>

      <HomeLink />
    </div>
  )
}