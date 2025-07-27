// src/App.jsx
import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import WebhookProcessor from "./components/WebhookProcessor";

function App() {
  const [currentPage, setCurrentPage] = useState("landing");

  const navigate = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="App">
      {currentPage === "landing" && <LandingPage onNavigate={navigate} />}
      {currentPage === "demo" && <WebhookProcessor onNavigate={navigate} />}
    </div>
  );
}

export default App;
