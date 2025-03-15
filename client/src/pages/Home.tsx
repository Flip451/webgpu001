import React from "react";
import useCheckWebGPU from "../hooks/helper";

export default function Home() {
  const { result } = useCheckWebGPU();

  return (
    <div>
      <h1>Check WebGPU</h1>
      <h2>{result}</h2>
    </div>
  )
}