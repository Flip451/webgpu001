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
          <Link to="/triangle">Triangle</Link>
        </li>
        <li>
          <Link to="/srgb-triangle">SRGB Triangle</Link>
        </li>
        <li>
          <Link to="/triangle-msaa">Triangle MSAA</Link>
        </li>
      </ul>
    </div>
  )
}