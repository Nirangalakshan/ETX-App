// import "./index.css";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import DashBoard from "./pages/DashBoard";
// import Login from "./pages/Login";
// import Setting from "./pages/Setting";
// import Report from "./pages/Report";
// import { SerialProvider } from "./SerialContext";
// import { BatteryProvider } from "./BatteryContext";

// function RequireAuth({ children }: { children: JSX.Element }) {
//   const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
//   return isLoggedIn ? children : <Navigate to="/login" replace />;
// }

// function App() {
//   return (
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
//                   <DashBoard />
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
//   );
// }

// export default App;









import "./index.css";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashBoard from "./pages/DashBoard";
import Login from "./pages/Login";
import Setting from "./pages/Setting";
import Report from "./pages/Report";


function RequireAuth({ children }: { children: JSX.Element }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashBoard />
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
            <Route
              path="/report"
              element={
                <RequireAuth>
                  <Report />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      
  );
}

export default App;
