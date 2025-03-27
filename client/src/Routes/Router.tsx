import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Triangle from "../pages/Triangle";
import SRGBTriangle from "../pages/SRGBTriangle.";
import TriangleMSAA from "../pages/TriangleMSAA";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/triangle" element={<Triangle />} />
      <Route path="/srgb-triangle" element={<SRGBTriangle />} />
      <Route path="/triangle-msaa" element={<TriangleMSAA />} />
    </Routes>
  )
}