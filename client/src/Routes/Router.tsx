import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import RedTriangle from "../pages/RedTriangle";
import SRGBRectangle from "../pages/SRGBRectangle";
import SRGBTriangle from "../pages/SRGBTriangle.";
import ColorfulRectangle from "../pages/ColorfulRectangle";
import RotatingCube from "../pages/RotatingCube";
import RotatableCube from "../pages/RotatableCube";
import TextureCube from "../pages/TextureCube";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/red-triangle" element={<RedTriangle />} />
      <Route path="/srgb-rectangle" element={<SRGBRectangle />} />
      <Route path="/colorful-rectangle" element={<ColorfulRectangle />} />
      <Route path="/srgb-triangle" element={<SRGBTriangle />} />
      <Route path="/rotating-cube" element={<RotatingCube />} />
      <Route path="/rotatable-cube" element={<RotatableCube />} />
      <Route path="/texture-cube" element={<TextureCube />} />
    </Routes>
  )
}