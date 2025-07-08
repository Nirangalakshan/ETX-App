// import { Link, useNavigate } from "react-router-dom";
// import { ToastContainer, toast } from "react-toastify";
// import Swal from "sweetalert2";
// import 'react-toastify/dist/ReactToastify.css';
// import 'sweetalert2/src/sweetalert2.scss';

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

//   const handleMinimize = () => {
//     window.electronAPI?.minimize();
//   };

//   const handleClose = () => {
//     window.electronAPI?.close();
//   };

//   const handleLogout = () => {
//     Swal.fire({
//       title: 'Are you sure?',
//       text: 'You will be logged out of the system!',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#d33',
//       cancelButtonColor: '#3085d6',
//       confirmButtonText: 'Yes, logout',
//     }).then((result) => {
//       if (result.isConfirmed) {
//         localStorage.removeItem("isLoggedIn");

//         toast.success("Logout successful", {
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
//         className="h-13 bg-white border-b-2 border-black text-black flex justify-between items-center px-4"
//         style={{ WebkitAppRegion: "drag" } as any}
//       > <img src="/icon.svg" alt="Logo" className="w-12 h-8" />
//         <span className="text-xl">ETX BATTERY TESTER</span>
//         <div
//           className="flex gap-4"
//           style={{ WebkitAppRegion: "no-drag" } as any}
//         >
//           <Link to="/" className="hover:underline cursor-pointer ml-120">
//             Dashboard
//           </Link>
//           <Link to="/setting" className="hover:underline cursor-pointer ml-15">
//             Settings
//           </Link>
//           <button
//             onClick={handleLogout}
//             className="hover:underline cursor-pointer ml-15 bg-transparent border-none text-black"
//           >
//             Logout
//           </button>
//         </div>

//         <div
//           className="flex space-x-2"
//           style={{ WebkitAppRegion: "no-drag" } as any}
//         >
//           <button
//             onClick={handleMinimize}
//             className="w-4 h-4 bg-yellow-400 rounded"
//             title="Minimize"
//           >
//             <span className="sr-only">Minimize</span>
//           </button>
//           <button
//             onClick={handleClose}
//             className="w-4 h-4 bg-red-600 rounded"
//             title="Close"
//           >
//             <span className="sr-only">Close</span>
//           </button>
//         </div>
//       </div>

//       <ToastContainer />
//     </>
//   );
// }




import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import 'react-toastify/dist/ReactToastify.css';
import 'sweetalert2/src/sweetalert2.scss';

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
  const [currentTime, setCurrentTime] = useState<string>("");
  const [user, setUser] = useState<string>("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    }, 1000);

    const savedUser = localStorage.getItem("user") || "Guest";
    setUser(savedUser);

    return () => clearInterval(interval);
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.minimize();
  };

  const handleClose = () => {
    window.electronAPI?.close();
  };

  const handleRefresh = () => {
    toast.info("Refreshing app...", {
      position: "top-right",
      autoClose: 1000,
      theme: "light",
    });
    setTimeout(() => {
      window.location.reload(); // Full app reload
    }, 1000);
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out of the system!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, logout',
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("user");

        toast.success("Logout successful", {
          position: "top-right",
          autoClose: 2000,
          theme: "light",
        });

        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    });
  };

  return (
    <>
      <div
        className="h-12 px-4 flex items-center justify-between backdrop-blur-md bg-white/60 border-b border-gray-300 text-gray-800"
        style={{ WebkitAppRegion: "drag" } as any}
      >
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <img src="/icon.svg" alt="Logo" className="w-8 h-8" />
          <span className="text-lg font-semibold tracking-wide">ETX Battery Tester</span>
        </div>

        {/* Center: Navigation */}
        <div
          className="flex gap-6 text-sm font-medium"
          style={{ WebkitAppRegion: "no-drag" } as any}
        >
          <Link to="/" className="hover:text-blue-600 transition">
            Dashboard
          </Link>
          <Link to="/setting" className="hover:text-blue-600 transition">
            Settings
          </Link>
          <Link to="/report" className="hover:text-blue-600 transition">
            Report
          </Link>
          <button
            onClick={handleLogout}
            className="hover:text-red-600 transition text-sm"
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
          <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
            <span className="flex items-center gap-1">
              👤 <span className="font-semibold">{user}</span>
            </span>
            <span className="text-gray-500">|</span>
            <span className="flex items-center gap-1">
              🕒 <span>{currentTime}</span>
            </span>
          </div>

          {/* Refresh + Window Controls */}
          <div className="flex items-center space-x-2 ml-2">
            <button
              onClick={handleRefresh}
              title="Refresh App"
              className="w-3.5 h-3.5 bg-blue-500 hover:bg-blue-400 rounded-full transition-all"
            >
              <span className="sr-only">Refresh</span>
            </button>
            <button
              onClick={handleMinimize}
              title="Minimize"
              className="w-3.5 h-3.5 bg-yellow-400 hover:bg-yellow-300 rounded-full transition-all"
            >
              <span className="sr-only">Minimize</span>
            </button>
            <button
              onClick={handleClose}
              title="Close"
              className="w-3.5 h-3.5 bg-red-500 hover:bg-red-400 rounded-full transition-all"
            >
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
      </div>

      <ToastContainer />
    </>
  );
}

