// import { Link } from "react-router-dom";
// import Battery from './Battery';

// declare global {
//   interface Window {
//     electronAPI?: {
//       minimize: () => void;
//       close: () => void;
//     };
//   }
// }

// export default function CustomTitleBar() {
//   const handleMinimize = () => {
//     window.electronAPI?.minimize();
//   };

//   const handleClose = () => {
//     window.electronAPI?.close();
//   };

//   return (
//     <div
//       className="h-13 bg-white border-b-2 border-black text-black flex justify-between items-center px-4"
//       style={{ WebkitAppRegion: "drag" } as any}
//     >
//       <span className="text-2xl ">ETX BATTERY TESTER</span>
//       <div
//         className="flex gap-4"
//         style={{ WebkitAppRegion: "no-drag" } as any} // allow interaction here
//       >
//         <Link to="/" className="hover:underline cursor-pointer ml-120">
//           Dashboard
//         </Link>
//         <Link to="/setting" className="hover:underline cursor-pointer ml-15">
//           Settings
//         </Link>
//       </div>

//       <div
//         className="flex space-x-2"
//         style={{ WebkitAppRegion: "no-drag" } as any}
//       >
//         <button
//           onClick={handleMinimize}
//           className="w-4 h-4 bg-yellow-400 rounded"
//           title="Minimize"
//         >
//           <span className="sr-only">Minimize</span>
//         </button>
//         <button
//           onClick={handleClose}
//           className="w-4 h-4 bg-red-600 rounded"
//           title="Close"
//         >
//           <span className="sr-only">Close</span>
//         </button>
//       </div>
//     </div>
//   );
// }



import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Swal from "sweetalert2";
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

  const handleMinimize = () => {
    window.electronAPI?.minimize();
  };

  const handleClose = () => {
    window.electronAPI?.close();
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
        className="h-13 bg-white border-b-2 border-black text-black flex justify-between items-center px-4"
        style={{ WebkitAppRegion: "drag" } as any}
      >
        <span className="text-2xl">ETX BATTERY TESTER</span>
        <div
          className="flex gap-4"
          style={{ WebkitAppRegion: "no-drag" } as any}
        >
          <Link to="/" className="hover:underline cursor-pointer ml-120">
            Dashboard
          </Link>
          <Link to="/setting" className="hover:underline cursor-pointer ml-15">
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="hover:underline cursor-pointer ml-15 bg-transparent border-none text-black"
          >
            Logout
          </button>
        </div>

        <div
          className="flex space-x-2"
          style={{ WebkitAppRegion: "no-drag" } as any}
        >
          <button
            onClick={handleMinimize}
            className="w-4 h-4 bg-yellow-400 rounded"
            title="Minimize"
          >
            <span className="sr-only">Minimize</span>
          </button>
          <button
            onClick={handleClose}
            className="w-4 h-4 bg-red-600 rounded"
            title="Close"
          >
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>

      <ToastContainer />
    </>
  );
}
