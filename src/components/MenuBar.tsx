// /* eslint-disable */
// /* @ts-nocheck */

// import { Link, useNavigate, useLocation } from "react-router-dom"; // Add useLocation
// import { ToastContainer, toast } from "react-toastify";
// import Swal from "sweetalert2";
// import { useEffect, useState } from "react";
// import "react-toastify/dist/ReactToastify.css";
// import "sweetalert2/src/sweetalert2.scss";
// // import icon from "../../public/icon.svg";
// import vegalogo2 from "../../public/vegalogo2.png"

// declare global {
//   interface Window {
//     electronAPI?: {
//       minimize: () => void;
//       close: () => void;
//     };
//   }
// }

// export default function CustomTitleBar() {
//   const navigate = useNavigate();
//   const location = useLocation(); // Hook to get current route
//   const [currentTime, setCurrentTime] = useState<string>("");
//   const [user, setUser] = useState<string>("");

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const now = new Date();
//       setCurrentTime(now.toLocaleTimeString());
//     }, 1000);

//     const savedUser = localStorage.getItem("user") || "Vega Admin";
//     setUser(savedUser);

//     return () => clearInterval(interval);
//   }, []);

//   const handleMinimize = () => {
//     window.electronAPI?.minimize();
//   };

//   const handleClose = () => {
//     window.electronAPI?.close();
//   };

//   const handleRefresh = () => {
//     toast.info("Refreshing app...", {
//       position: "top-right",
//       autoClose: 1000,
//       theme: "light",
//     });
//     setTimeout(() => {
//       window.location.reload(); // Full app reload
//     }, 1000);
//   };

//   const handleLogout = () => {
//     Swal.fire({
//       title: "Are you sure?",
    
//       text: "You will be logged out of the app!",
//       imageUrl: vegalogo2,
//       showCancelButton: true,
//       confirmButtonColor: "#d33",
//       cancelButtonColor: "#3085d6",
//       confirmButtonText: "Yes, logout",
//       width: 400,
//       padding: "2rem",
//       background: "#f0f8ff",
//       imageHeight: 150,
//       imageWidth: 150,
//       focusConfirm: true,
//     }).then((result) => {
//       if (result.isConfirmed) {
//         localStorage.removeItem("isLoggedIn");
//         localStorage.removeItem("user");

//         toast.success("Redirecting to Login....", {
//           position: "top-right",
//           autoClose: 2000,
//           theme: "light",
          
//         });

//         setTimeout(() => {
//           navigate("/");
//         }, 2000);
//       }
//     });
//   };

//   return (
//     <>
//       <div
//         className="h-12 px-4 flex items-center justify-between backdrop-blur-md bg-gray-700/10 border-b border-cyan-300 text-gray-800 font-inter"
//         style={{ WebkitAppRegion: "drag" } as any}
//       >
//         {/* Left: Logo + Title */}
//         <div className="flex items-center gap-3">
//           <img src={vegalogo2} alt="Logo" className="w-13 h-13 rounded-xl" />
//           <span className="text-lg tracking-wide font-extrabold">
//             BMS TEST BENCH <span className="text-xs">@V 1.0.0</span>
//           </span>
//         </div>

//         {/* Center: Navigation */}
//         <div
//           className="flex gap-6 text-slate-950 font-bold mr-30"
//           style={{ WebkitAppRegion: "no-drag" } as any}
//         >
//           <Link
//             to="/dashboard"
//             className={`
//     relative transition duration-300 
//     ${
//       location.pathname === "/dashboard"
//         ? "text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-400 after:scale-x-100 after:origin-left after:transition-transform after:duration-300"
//         : "hover:text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-400 after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
//     }
//   `}
//           >
//             Dashboard
//           </Link>
//           <Link
//             to="/setting"
//             className={`
//     relative transition duration-300 
//     ${
//       location.pathname === "/setting"
//         ? "text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-400 after:scale-x-100 after:origin-left after:transition-transform after:duration-300"
//         : "hover:text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-400 after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
//     }
//   `}
//           >
//             Instructions
//           </Link>
//           <Link
//             to="/report"
//             className={`
//     relative transition duration-300 
//     ${
//       location.pathname === "/report"
//         ? "text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-400 after:scale-x-100 after:origin-left after:transition-transform after:duration-300"
//         : "hover:text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-400 after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
//     }
//   `}
//           >
//             Report
//           </Link>
//           <button
//             onClick={handleLogout}
//              className={`
//     relative transition duration-300 
//     ${
//       location.pathname === "/login"
//         ? "text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-red-400 after:scale-x-100 after:origin-left after:transition-transform after:duration-300"
//         : "hover:text-red-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-red-400 after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
//     }
//   `}
//           >
//             Logout
//           </button>
//         </div>

//         {/* Right: User Info + Time + Controls */}
//         <div
//           className="flex items-center gap-4"
//           style={{ WebkitAppRegion: "no-drag" } as any}
//         >
//           {/* User + Time */}
//           <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
//             <span className="flex items-center gap-1">
//               👤 <span className="font-semibold">{user}</span>
//             </span>
//             <span className="text-gray-500">|</span>
//             <span className="flex items-center gap-1">
//               🕒 <span>{currentTime}</span>
//             </span>
//           </div>

//           {/* Refresh + Window Controls */}
//           <div className="flex items-center space-x-2 ml-2">
//             <button
//               onClick={handleRefresh}
//               title="Refresh App"
//               // className="w-3.5 h-3.5 bg-blue-500 hover:bg-blue-400 rounded-full transition-all"
//             >
//               ↺<span className="sr-only">Refresh</span>
//             </button>
//             <button
//               onClick={handleMinimize}
//               title="Minimize"
//               // className="w-3.5 h-3.5 bg-yellow-400 hover:bg-yellow-300 rounded-full transition-all"
//               className="justify-center items-center flex"
//             >
//               ─<span className="sr-only">Minimize</span>
//             </button>
//             <button
//               onClick={handleClose}
//               title="Close"
            
//             >
//               🗙
//               <span className="sr-only">Close</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       <ToastContainer />
//     </>
//   );
// }









/* eslint-disable */
/* @ts-nocheck */

import { Link, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import "sweetalert2/src/sweetalert2.scss";
import vegalogo1 from "../../public/vegalogo1.png";

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      close: () => void;
    };
  }
}

export default function CustomTitleBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);

    const savedUser = localStorage.getItem("user") || "Vega Admin";
    setUser(savedUser);

    return () => clearInterval(interval);
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimize();
  };

  const handleClose = () => {

    Swal.fire({
      text: "Are you sure you want to close the app?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0ea5e9",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, close",
      width: 400,
      padding: "2rem",
      background: "#f9fafb",
    }).then((result) => {
      if (result.isConfirmed) {
        toast.info("Closing app...", {
          position: "top-right",
          autoClose: 1000,
          theme: "light",
        });
        setTimeout(() => {
          window.electronAPI?.close();
        }, 1000);
      }
    });
  };

  const handleRefresh = () => {
    Swal.fire({
      title: "Refresh Application?",
      text: "All updated data will be lost!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0ea5e9",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, refresh",
      background: "#f9fafb",
      width: 400,
      padding: "2rem",
    }).then((result) => {
      if (result.isConfirmed) {
        toast.info("Refreshing app...", {
          position: "top-right",
          autoClose: 1000,
          theme: "light",
        });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    });
  };

  const handleLogout = async () => {
    
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of the app!",
      imageUrl: vegalogo1,
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, logout",
      width: 400,
      padding: "2rem",
      background: "#f0f8ff",
      imageHeight: 200,
      imageWidth: 200,
      focusConfirm: true,
    }).then((result) => {
      if (result.isConfirmed) {
      
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");

        toast.success("Logged out—see you soon! 👋", {
          position: "top-right",
          autoClose: 1500,
          theme: "light",
        });
       
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    });
   
  };

  return (
    <>
      <div
        className="h-14 px-6 flex items-center justify-between backdrop-blur-lg bg-white/70 border-b border-cyan-400 shadow-sm text-gray-900 font-inter"
        style={{ WebkitAppRegion: "drag" } as any}
      >
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <img src={vegalogo1} alt="Logo" className="w-10 h-10 rounded-lg shadow" />
          <span className="text-lg tracking-wide font-extrabold">
            BMS TEST BENCH{" "}
            <span className="text-xs text-gray-500">@ V1.0.0</span>
          </span>
        </div>

        {/* Center: Navigation with animated underline */}
        <div
          className="flex gap-6 text-gray-700 font-semibold"
          style={{ WebkitAppRegion: "no-drag" } as any}
        >
          {[
            { to: "/dashboard", label: "Dashboard" },
            { to: "/setting", label: "Instructions" },
            { to: "/report", label: "Report" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`relative transition duration-300
                ${
                  location.pathname === item.to
                    ? "text-blue-500 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-500 after:scale-x-100 after:origin-left"
                    : "hover:text-blue-500 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-500 after:scale-x-0 after:origin-right hover:after:scale-x-100 hover:after:origin-left"
                }
                after:transition-transform after:duration-300
              `}
            >
              {item.label}
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className={`relative transition duration-300
              ${
                location.pathname === "/login"
                  ? "text-red-500 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-red-500 after:scale-x-100 after:origin-left"
                  : "hover:text-red-500 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-red-500 after:scale-x-0 after:origin-right hover:after:scale-x-100 hover:after:origin-left"
              }
              after:transition-transform after:duration-300
            `}
          >
            Logout
          </button>
        </div>

        {/* Right: User Info + Time + Controls */}
        <div
          className="flex items-center gap-4"
          style={{ WebkitAppRegion: "no-drag" } as any}
        >
          {/* User + Time */}
          <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
            <span className="flex items-center gap-1">
              👤 <span className="font-semibold">{user}</span>
            </span>
            <span className="text-gray-400">|</span>
            <span className="flex items-center gap-1">
              🕒 <span>{currentTime}</span>
            </span>
          </div>

          {/* Refresh + Window Controls */}
          <div className="flex items-center space-x-3 ml-2">
            <button
              onClick={handleRefresh}
              title="Refresh App"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100 transition"
            >
              ↺
            </button>
            <button
              onClick={handleMinimize}
              title="Minimize"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-yellow-100 transition"
            >
              ─
            </button>
            <button
              onClick={handleClose}
              title="Close"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 transition"
            >
              🗙
            </button>
          </div>
        </div>
      </div>

      <ToastContainer />
    </>
  );
}
