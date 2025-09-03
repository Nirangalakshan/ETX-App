/* eslint-disable */
/* @ts-nocheck */

import { Link, useNavigate, useLocation } from "react-router-dom"; // Add useLocation
import { ToastContainer, toast } from "react-toastify";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import "react-toastify/dist/ReactToastify.css";
import "sweetalert2/src/sweetalert2.scss";
import icon from "../../public/icon.svg";

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
  const location = useLocation(); // Hook to get current route
  const [currentTime, setCurrentTime] = useState<string>("");
  const [user, setUser] = useState<string>("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    }, 1000);

    const savedUser = localStorage.getItem("user") || "Vega Admin";
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
      title: "Are you sure?",
      text: "You will be logged out of the system!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, logout",
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
        className="h-12 px-4 flex items-center justify-between backdrop-blur-md bg-gray-200 border-b border-gray-300 text-gray-800 font-inter"
        style={{ WebkitAppRegion: "drag" } as any}
      >
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <img src={icon} alt="Logo" className="w-8 h-8 rounded-2xl" />
          <span className="text-lg tracking-wide font-extrabold">
            ETX BATTERY TESTER <span className="text-xs">@V 1.0.0</span>
          </span>
        </div>

        {/* Center: Navigation */}
        <div
          className="flex gap-6 text-slate-950 font-bold mr-30"
          style={{ WebkitAppRegion: "no-drag" } as any}
        >
          <Link
            to="/dashboard"
            className={`
    relative transition duration-300 
    ${
      location.pathname === "/dashboard"
        ? "text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-400 after:scale-x-100 after:origin-left after:transition-transform after:duration-300"
        : "hover:text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-400 after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
    }
  `}
          >
            Dashboard
          </Link>
          <Link
            to="/setting"
            className={`
    relative transition duration-300 
    ${
      location.pathname === "/setting"
        ? "text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-400 after:scale-x-100 after:origin-left after:transition-transform after:duration-300"
        : "hover:text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-400 after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
    }
  `}
          >
            Instructions
          </Link>
          <Link
            to="/report"
            className={`
    relative transition duration-300 
    ${
      location.pathname === "/report"
        ? "text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-400 after:scale-x-100 after:origin-left after:transition-transform after:duration-300"
        : "hover:text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-blue-400 after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
    }
  `}
          >
            Report
          </Link>
          <button
            onClick={handleLogout}
             className={`
    relative transition duration-300 
    ${
      location.pathname === "/login"
        ? "text-blue-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-red-400 after:scale-x-100 after:origin-left after:transition-transform after:duration-300"
        : "hover:text-red-400 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-red-400 after:scale-x-0 after:origin-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-left"
    }
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
              // className="w-3.5 h-3.5 bg-blue-500 hover:bg-blue-400 rounded-full transition-all"
            >
              ↺<span className="sr-only">Refresh</span>
            </button>
            <button
              onClick={handleMinimize}
              title="Minimize"
              // className="w-3.5 h-3.5 bg-yellow-400 hover:bg-yellow-300 rounded-full transition-all"
              className="justify-center items-center flex"
            >
              ─<span className="sr-only">Minimize</span>
            </button>
            <button
              onClick={handleClose}
              title="Close"
              // className="w-3.5 h-3.5 bg-red-500 hover:bg-red-400 rounded-full transition-all"
            >
              🗙
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
      </div>

      <ToastContainer />
    </>
  );
}
