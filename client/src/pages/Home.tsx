import useCheckWebGPU from "../hooks/useCheckWebGPU";
import { Link } from "react-router-dom";

export default function Home() {
  const { message } = useCheckWebGPU();

  return (
    <div>
      <h1>Check WebGPU</h1>
      <h2>{message}</h2>
      <div>
        <Link to="/triangle">Triangle</Link>
      </div>
      <div>
        <Link to="/srgb-triangle">SRGB Triangle</Link>
      </div>
    </div>
  )
}