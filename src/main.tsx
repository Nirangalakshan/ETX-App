// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App.tsx";
// import "./index.css";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import Setting from "./pages/Setting.tsx";
// import Login from "./pages/Login.tsx";
// import { SerialProvider } from "./SerialContext.tsx";
// import Report from "./pages/Report.tsx";
// import { BatteryProvider } from "./BatteryContext.tsx";

// // Auth guard for protected routes
// function RequireAuth({ children }: { children: JSX.Element }) {
//   const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
//   return isLoggedIn ? children : <Navigate to="/login" replace />;
// }

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <SerialProvider>
//       <BatteryProvider>
//         <BrowserRouter>
//           <Routes>
//             <Route path="/" element={<Login />} />
//             <Route path="/login" element={<Login />} />
//             <Route
//               path="/dashboard"
//               element={
//                 <RequireAuth>
//                   <App />
//                 </RequireAuth>
//               }
//             />
//             <Route
//               path="/setting"
//               element={
//                 <RequireAuth>
//                   <Setting />
//                 </RequireAuth>
//               }
//             />
//             <Route
//               path="/report"
//               element={
//                 <RequireAuth>
//                   <Report />
//                 </RequireAuth>
//               }
//             />
//             <Route path="*" element={<Navigate to="/login" replace />} />
//           </Routes>
//         </BrowserRouter>
//       </BatteryProvider>
//     </SerialProvider>
//   </React.StrictMode>
// );

// // Use contextBridge
// // @ts-ignore
// window.ipcRenderer?.on("main-process-message", (_event, message) => {
//   console.log(message);
// });










import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import Setting from "./pages/Setting.tsx";
import Report from "./pages/Report.tsx";
import { SerialProvider } from "./SerialContext.tsx";
import { BatteryProvider } from "./BatteryContext.tsx";

// Remove RequireAuth and Login-related routes

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SerialProvider>
      <BatteryProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<App />} /> {/* Default to App/DashBoard */}
            <Route path="/dashboard" element={<App />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="/report" element={<Report />} />
            <Route path="*" element={<App />} /> {/* Fallback to App */}
          </Routes>
        </HashRouter>
      </BatteryProvider>
    </SerialProvider>
  </React.StrictMode>
);

// Use contextBridge
// @ts-ignore
window.ipcRenderer?.on("main-process-message", (_event, message) => {
  console.log(message);
});