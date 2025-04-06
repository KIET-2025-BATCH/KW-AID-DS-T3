import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Homepage/Homepage";
import Documentation from "./pages/Documentation/Documentation";
import Contact from "./pages/Contact/Contact";
import Navbar from "./pages/Navbar/Navbar";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/documentation" element={<Documentation />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  );
}

export default App;