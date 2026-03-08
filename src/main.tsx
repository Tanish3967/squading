import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import JoinActivityScreen from "./pages/JoinActivityScreen.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/join/:activityId" element={<JoinActivityScreen />} />
      <Route path="*" element={<App />} />
    </Routes>
  </BrowserRouter>
);
