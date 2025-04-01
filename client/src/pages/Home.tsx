import useCheckWebGPU from "../hooks/useCheckWebGPU";
import { Link } from "react-router-dom";

export default function Home() {
  const { message } = useCheckWebGPU();

  return (
    <div>
      <h1>Check WebGPU</h1>
      <h2>{message}</h2>
      <ul>
        <li>
          <Link to="/red-triangle">Red Triangle</Link>
        </li>
        <li>
          <Link to="/srgb-rectangle">SRGB Rectangle</Link>
        </li>
        <li>
          <Link to="/colorful-rectangle">Colorful Rectangle</Link>
        </li>
        <li>
          <Link to="/srgb-triangle">SRGB Triangle</Link>
        </li>
        <li>
          <Link to="/rotating-cube">Rotating Cube</Link>
        </li>
        <li>
          <Link to="/rotatable-cube">Rotatable Cube</Link>
        </li>
      </ul>
    </div>
  )
}