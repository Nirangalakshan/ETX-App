// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App.tsx";
// import "./index.css";
// import { BrowserRouter} from "react-router-dom";
// import { Route, Routes } from "react-router-dom";
// import Setting from "./pages/Setting.tsx";
// import Login from "./pages/Login.tsx";

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <BrowserRouter>
      
//       <Routes>
//         <Route path="/" element={<App />} />
//         <Route path="/Setting" element={<Setting />} />
//         <Route path="/login" element={<Login />} />
//       </Routes>
//    </BrowserRouter>
//   </React.StrictMode>
// );

// // Use contextBridge
// window.ipcRenderer.on("main-process-message", (_event, message) => {
//   console.log(message);
// });




// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App.tsx";
// import "./index.css";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import Setting from "./pages/Setting.tsx";
// import Login from "./pages/Login.tsx";

// // Auth guard for protected routes
// function RequireAuth({ children }: { children: JSX.Element }) {
//   const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
//   return isLoggedIn ? children : <Navigate to="/login" replace />;
// }

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/login" element={<Login />} />
//         <Route
//           path="/dashboard"
//           element={
//             <RequireAuth>
//               <App />
//             </RequireAuth>
//           }
//         />
//         <Route
//           path="/setting"
//           element={
//             <RequireAuth>
//               <Setting />
//             </RequireAuth>
//           }
//         />
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     </BrowserRouter>
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
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Setting from "./pages/Setting.tsx";
import Login from "./pages/Login.tsx";

// Always require login on app start
// localStorage.removeItem("isLoggedIn");

// Auth guard for protected routes
function RequireAuth({ children }: { children: JSX.Element }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <App />
            </RequireAuth>
          }
        />
        <Route
          path="/setting"
          element={
            <RequireAuth>
              <Setting />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// Use contextBridge
// @ts-ignore
window.ipcRenderer?.on("main-process-message", (_event, message) => {
  console.log(message);
});