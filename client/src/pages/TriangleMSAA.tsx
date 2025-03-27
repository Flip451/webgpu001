import { useRef } from "react";
import { Link } from "react-router-dom";
import useTriangleMSAA from "../hooks/useTriangleMSAA";

const TriangleMSAA = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { message } = useTriangleMSAA(canvasRef);

  return (
    <>
      <h1>TriangleMSAA</h1>
      <h2>{message}</h2>
      <canvas ref={canvasRef} width={640} height={480} />
      <div>
        <Link to="/">Home</Link>
      </div>
    </>
  );
};

export default TriangleMSAA;
