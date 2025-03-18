import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Triangle from "../pages/Triangle";
import SRGBTriangle from "../pages/SRGBTriangle.";
import Test from "../pages/Test";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/triangle" element={<Triangle />} />
      <Route path="/srgb-triangle" element={<SRGBTriangle />} />
    </Routes>
  )
}