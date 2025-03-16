import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Triangle from "../pages/Triangle";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/triangle" element={<Triangle />} />
    </Routes>
  )
}