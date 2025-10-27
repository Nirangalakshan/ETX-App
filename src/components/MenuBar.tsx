// /* eslint-disable */
// /* @ts-nocheck */

// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { ToastContainer, toast } from "react-toastify";
// import Swal from "sweetalert2";
// import { useEffect, useState } from "react";
// import "react-toastify/dist/ReactToastify.css";
// import "sweetalert2/src/sweetalert2.scss";
// import vegalogo1 from "/vegalogo1.png";

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
//   const location = useLocation();
//   const [currentTime, setCurrentTime] = useState<string>("");
//   const [user, setUser] = useState<string>("");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const now = new Date();
//       setCurrentTime(
//         now.toLocaleTimeString([], {
//           hour: "2-digit",
//           minute: "2-digit",
//           second: "2-digit",
//         })
//       );
//     }, 1000);

//     const savedUser = localStorage.getItem("user") || "Vega Admin";
//     setUser(savedUser);

//     return () => clearInterval(interval);
//   }, []);

//   const handleMinimize = () => {
//     window.electronAPI?.minimize();
//   };

//   const handleClose = () => {
//     Swal.fire({
//       text: "Are you sure you want to close the app?",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#0ea5e9",
//       cancelButtonColor: "#6b7280",
//       confirmButtonText: "Yes, close",
//       width: 400,
//       padding: "2rem",
//       background: "#f9fafb",
//     }).then((result) => {
//       if (result.isConfirmed) {
//         toast.info("Closing app...", {
//           position: "top-right",
//           autoClose: 1000,
//           theme: "light",
//         });
//         setTimeout(() => {
//           window.electronAPI?.close();
//         }, 1000);
//       }
//     });
//   };

//   const handleRefresh = () => {
//     Swal.fire({
//       title: "Refresh Application?",
//       text: "All updated data will be lost!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#0ea5e9",
//       cancelButtonColor: "#6b7280",
//       confirmButtonText: "Yes, refresh",
//       background: "#f9fafb",
//       width: 400,
//       padding: "2rem",
//     }).then((result) => {
//       if (result.isConfirmed) {
//         toast.info("Refreshing app...", {
//           position: "top-right",
//           autoClose: 1000,
//           theme: "light",
//         });
//         setTimeout(() => {
//           window.location.reload();
//         }, 1000);
//       }
//     });
//   };

//   const handleLogout = async () => {
//     Swal.fire({
//       title: "Are you sure?",
//       text: "You will be logged out of the app!",
//       imageUrl: vegalogo1,
//       showCancelButton: true,
//       confirmButtonColor: "#d33",
//       cancelButtonColor: "#3085d6",
//       confirmButtonText: "Yes, logout",
//       width: 400,
//       padding: "2rem",
//       background: "#f0f8ff",
//       imageHeight: 200,
//       imageWidth: 200,
//       focusConfirm: true,
//     }).then((result) => {
//       if (result.isConfirmed) {
//         localStorage.removeItem("isLoggedIn");
//         localStorage.removeItem("user");

//         toast.success("Logged out—see you soon! 👋", {
//           position: "top-right",
//           autoClose: 1500,
//           theme: "light",
//         });

//         setTimeout(() => {
//           navigate("/");
//         }, 1500);
//       }
//     });
//   };

//   return (
//     <>
//       <div
//         className="h-14 px-6 flex items-center justify-between backdrop-blur-lg bg-white/70 border-b border-cyan-400 shadow-sm text-gray-900 font-inter"
//         style={{ WebkitAppRegion: "drag" } as any}
//       >
//         {/* Left: Logo + Title */}
//         <div className="flex items-center gap-3">
//           <img
//             src={vegalogo1}
//             alt="Logo"
//             className="w-10 h-10 rounded-lg shadow"
//           />
//           <span className="text-lg tracking-wide font-serif font-semibold">
//             BMS TEST BENCH{" "}
//             <span className="text-xs text-gray-500">@ V1.0.0</span>
//           </span>
//         </div>

//         {/* Center: Navigation with animated underline */}
//         <div className="h-10 w-120 bg-sky-100 items-center border-black border rounded-full flex justify-center px-4 shadow-md">
//           <div
//             className="flex gap-6 text-gray-700 font-semibold font-serif"
//             style={{ WebkitAppRegion: "no-drag" } as any}
//           >
//             {[
//               { to: "/dashboard", label: "Dashboard" },
//               { to: "/setting", label: "Instructions" },
//               { to: "/report", label: "Report" },
//             ].map((item) => (
//               <Link
//                 key={item.to}
//                 to={item.to}
//                 className={`relative transition duration-300
//                 ${
//                   location.pathname === item.to
//                     ? "text-blue-500 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-500 after:scale-x-100 after:origin-left"
//                     : "hover:text-blue-500 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-500 after:scale-x-0 after:origin-right hover:after:scale-x-100 hover:after:origin-left"
//                 }
//                 after:transition-transform after:duration-300
//               `}
//               >
//                 {item.label}
//               </Link>
//             ))}

//             <button
//               onClick={handleLogout}
//               className={`relative transition duration-300
//               ${
//                 location.pathname === "/login"
//                   ? "text-red-500 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-red-500 after:scale-x-100 after:origin-left"
//                   : "hover:text-red-500 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-red-500 after:scale-x-0 after:origin-right hover:after:scale-x-100 hover:after:origin-left"
//               }
//               after:transition-transform after:duration-300
//             `}
//             >
//               Logout
//             </button>
//           </div>
//         </div>

//         {/* Right: User Info + Time + Controls */}
//         <div
//           className="flex items-center gap-4"
//           style={{ WebkitAppRegion: "no-drag" } as any}
//         >
//           {/* User + Time */}
//           <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
//             <span className="flex items-center gap-1">
//               👤 <span className="font-semibold">{user}</span>
//             </span>
//             <span className="text-gray-400">|</span>
//             {/* <span className="flex items-center gap-1">
//               🕒 <span>{currentTime}</span>
//             </span> */}
//           </div>

//           {/* Refresh + Window Controls */}
//           <div className="w-34 h-10 bg-sky-200 items-center rounded-full flex justify-center gap-1 shadow-md">
//             <div className="flex items-center justify-center space-x-3 ml-2">
//               <button
//                 onClick={handleRefresh}
//                 title="Refresh App"
//                 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100 transition"
//               >
//                 ↺
//               </button>
//               <button
//                 onClick={handleMinimize}
//                 title="Minimize"
//                 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-yellow-100 transition"
//               >
//                 ─
//               </button>
//               <button
//                 onClick={handleClose}
//                 title="Close"
//                 className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 transition"
//               >
//                 🗙
//               </button>
//             </div>
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
import vegalogo1 from "/vegalogo1.png";

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

  const handleMinimize = () => window.electronAPI?.minimize();
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
    }).then((r) => {
      if (r.isConfirmed) {
        toast.info("Closing app...", { autoClose: 1000, theme: "light" });
        setTimeout(() => window.electronAPI?.close(), 1000);
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
    }).then((r) => {
      if (r.isConfirmed) {
        toast.info("Refreshing app...", { autoClose: 1000, theme: "light" });
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  };

  const handleLogout = () => {
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
    }).then((r) => {
      if (r.isConfirmed) {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");
        toast.success("Logged out—see you soon! 👋", { autoClose: 1500 });
        setTimeout(() => navigate("/"), 1500);
      }
    });
  };

  return (
    <>
      <div
        className="h-15 px-3 sm:px-4 md:px-6 flex flex-wrap md:flex-nowrap items-center justify-between backdrop-blur-lg bg-white/70 border-b border-cyan-400 shadow-sm text-gray-900 font-inter select-none"
        style={{ WebkitAppRegion: "drag" } as any}
      >
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-[8rem]">
          <img
            src={vegalogo1}
            alt="Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg shadow"
          />
          <span className="text-sm sm:text-base md:text-lg font-semibold font-serif tracking-wide whitespace-nowrap">
            BMS TEST BENCH{" "}
            <span className="text-[10px] sm:text-xs text-gray-500">@ V1.0.0</span>
          </span>
        </div>

        {/* Center: Navigation */}
        <div
          className="hidden sm:flex flex-wrap justify-center items-center bg-sky-100 border border-black rounded-full py-1 px-3 md:px-5 shadow-md"
          style={{ WebkitAppRegion: "no-drag" } as any}
        >
          <div className="flex flex-wrap gap-4 md:gap-6 text-gray-700 font-semibold font-serif text-xs sm:text-sm md:text-base">
            {[{ to: "/dashboard", label: "Dashboard" },
              { to: "/setting", label: "Instructions" },
              { to: "/report", label: "Report" }].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`relative transition-colors duration-300 ${
                  location.pathname === item.to
                    ? "text-blue-500 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-500 after:scale-x-100 after:origin-left"
                    : "hover:text-blue-500 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-500 after:scale-x-0 after:origin-right hover:after:scale-x-100 hover:after:origin-left"
                } after:transition-transform after:duration-300`}
              >
                {item.label}
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className={`relative transition-colors duration-300 ${
                location.pathname === "/login"
                  ? "text-red-500 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-red-500 after:scale-x-100 after:origin-left"
                  : "hover:text-red-500 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-red-500 after:scale-x-0 after:origin-right hover:after:scale-x-100 hover:after:origin-left"
              } after:transition-transform after:duration-300`}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Right: Controls */}
        <div
          className="flex items-center gap-2 sm:gap-4 mt-2 md:mt-0"
          style={{ WebkitAppRegion: "no-drag" } as any}
        >
          {/* User */}
          <div className="hidden sm:flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
            <span>👤</span>
            <span className="font-semibold truncate max-w-[5rem] sm:max-w-[8rem]">{user}</span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center bg-sky-200 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 gap-1 sm:gap-2 shadow-md">
            <button
              onClick={handleRefresh}
              title="Refresh"
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full hover:bg-blue-100 transition"
            >
              ↺
            </button>
            <button
              onClick={handleMinimize}
              title="Minimize"
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full hover:bg-yellow-100 transition"
            >
              ─
            </button>
            <button
              onClick={handleClose}
              title="Close"
              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full hover:bg-red-100 transition"
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
