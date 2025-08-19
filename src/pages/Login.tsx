// import React, { useState, useEffect } from "react";
// import MenuBar from "../components/MenuBar";
// import { useNavigate } from "react-router-dom";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const Login = () => {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (localStorage.getItem("isLoggedIn") === "true") {
//       navigate("/dashboard", { replace: true });
//     }
//   }, [navigate]);

//   const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
//     e.preventDefault();
//     if (!username || !password) {
//       setError("Please fill in all fields");
//       toast.warning("Please fill in all fields", { position: "top-center" });
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       // Hardcoded credentials check
//       if (username === "vega" && password === "vega123") {
//         localStorage.setItem("isLoggedIn", "true");

//         toast.success("Login successful! Redirecting...", {
//           position: "top-center",
//           autoClose: 2000,
//         });

//         setTimeout(() => {
//           navigate("/dashboard");
//         }, 2000);
//       } else {
//         const message = "Invalid credentials";
//         setError(message);
//         toast.warning(message, {
//           position: "top-center",
//         });
//       }
//     } catch (err) {
//       setError("An unexpected error occurred");
//       toast.error("Unexpected error occurred", { position: "top-center" });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
//       <MenuBar />
//       <ToastContainer />
//       <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
//         <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl transform transition-all hover:scale-[1.02]">
//           <img
//             src="/icon.svg"
//             alt="Logo"
//             className="mx-auto mb-6 w-30 h-30"
//           />
//           <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
//             Hey! Welcome
//           </h1>

//           <div className="space-y-6">
//             <div className="flex flex-col gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Username
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Enter username"
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value)}
//                   className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//                   disabled={isLoading}
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Password
//                 </label>
//                 <input
//                   type="password"
//                   placeholder="Enter password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//                   disabled={isLoading}
//                   required
//                 />
//               </div>
//               <button
//                 type="button"
//                 onClick={handleLogin}
//                 disabled={isLoading}
//                 className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isLoading ? (
//                   <span className="flex items-center justify-center">
//                     <svg
//                       className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       ></circle>
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                       ></path>
//                     </svg>
//                     Logging in...
//                   </span>
//                 ) : (
//                   "Log In"
//                 )}
//               </button>
//             </div>
//             {error && (
//               <div className="text-red-500 text-sm text-center animate-pulse">
//                 {error}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;






import React, { useState, useEffect } from "react";
import MenuBar from "../components/MenuBar";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

localStorage.removeItem("IsLoggedIn");

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields");
      toast.warning("Please fill in all fields", { position: "top-center" });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Hardcoded credentials check
      if (username === "vega" && password === "vega123") {
        localStorage.setItem("isLoggedIn", "true");

        toast.success("Login successful! Redirecting...", {
          position: "top-center",
          autoClose: 2000,
        });

        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        const message = "Invalid credentials";
        setError(message);
        toast.warning(message, {
          position: "top-center",
        });
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("Unexpected error occurred", { position: "top-center" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-blue-100 to-purple-200 flex flex-col">
      <MenuBar />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 transition-all duration-300 hover:shadow-3xl">
          <img
            src="/icon.svg"
            alt="Logo"
            className="mx-auto mb-6 w-16 h-16 sm:w-20 sm:h-20 transition-transform duration-300 hover:scale-110 rounded-4xl"
          />
          <h1 className="text-2xl sm:text-3xl font-semibold text-center text-gray-900 mb-6 tracking-tight font-inter">
            Welcome Back
          </h1>

          <div className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium font-inter text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 transition-all duration-200"
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium font-inter text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 transition-all duration-200"
                  disabled={isLoading}
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75 "
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  "Log In"
                )}
              </button>
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center animate-fade-in">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;