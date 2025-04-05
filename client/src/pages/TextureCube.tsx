import { useRef } from "react"
import HomeLink from "../components/HomeLink"
import useTextureCube from "../hooks/useTextureCube"

export default function TextureCube() {
  const ref = useRef<HTMLCanvasElement>(null)
  const { isLoading, message } = useTextureCube(ref)

  return (
    <div>
      <h1>Texture Cube</h1>

      <h2>{message}</h2>
      {isLoading && <h2>Loading...</h2>}

      <div>
        <canvas ref={ref} width="640" height="480"></canvas>
      </div>

      <HomeLink />
    </div>
  )
}
