import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BatteryProvider } from "./BatteryContext";
import { SerialProvider } from "./SerialContext";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SerialProvider>
      <BatteryProvider>
        <App />
       
      </BatteryProvider>
    </SerialProvider>
  </React.StrictMode>
);
