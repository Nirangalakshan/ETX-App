// import React, { useState, useEffect } from "react";
// // import MenuBar from "../components/MenuBar";
// import { useNavigate } from "react-router-dom";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import icon from "../../public/icon.svg";

// localStorage.removeItem("IsLoggedIn");

// const Login: React.FC = () => {
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
//     <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-blue-100 to-purple-200 flex flex-col">
//       {/* <MenuBar /> */}
//       <ToastContainer
//         position="top-center"
//         autoClose={3000}
//         hideProgressBar={false}
//         newestOnTop
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//         theme="light"
//       />
//       <div className="flex-1 flex items-center justify-center px-4 py-8">
//         <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 transition-all duration-300 hover:shadow-3xl">
//           <img
//             src={icon}
//             alt="Logo"
//             className="mx-auto mb-6 w-16 h-16 sm:w-20 sm:h-20 transition-transform duration-300 hover:scale-110 rounded-4xl"
//           />
//           <h1 className="text-2xl sm:text-3xl font-semibold text-center text-gray-900 mb-6 tracking-tight font-inter">
//             Welcome Back
//           </h1>

//           <div className="space-y-5">
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium font-inter text-gray-700 mb-1.5">
//                   Username
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Enter username"
//                   value={username}
//                   onChange={(e) => setUsername(e.target.value)}
//                   className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 transition-all duration-200"
//                   disabled={isLoading}
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium font-inter text-gray-700 mb-1.5">
//                   Password
//                 </label>
//                 <input
//                   type="password"
//                   placeholder="Enter password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 transition-all duration-200"
//                   disabled={isLoading}
//                   required
//                 />
//               </div>
//               <button
//                 type="button"
//                 onClick={handleLogin}
//                 disabled={isLoading}
//                 className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
//               >
//                 {isLoading ? (
//                   <span className="flex items-center">
//                     <svg
//                       className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
//                         className="opacity-75 "
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
//               <div className="text-red-500 text-sm text-center animate-fade-in">
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
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import icon from "../../public/icon.svg";
import vegalogo2 from "../../public/vegalogo2.png"
import vega from "../../public/vega.png"

// Remove old login state
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
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setError(null);

    try {
      // Hardcoded credentials
      if (username === "vega" && password === "vega123") {
        localStorage.setItem("isLoggedIn", "true");
        toast.success("Hey! Welcome back, you’re in! 😎", {
          position: "top-center",
          autoClose: 2000,
        });
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        const message = "Login failed, check your credentials! 😕";
        setError(message);
        toast.warning(message, { position: "top-center" });
      }
    } catch {
      setError("Unexpected error occurred");
      toast.error("Unexpected error occurred", { position: "top-center" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-100 overflow-hidden flex flex-col">
  {/* Tech animated background */}
  <canvas
    id="tech-bg"
    className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
  ></canvas>

  {/* Custom Menubar */}
  <nav className="relative z-10 w-full py-4 px-6 flex justify-between items-center bg-white/70 backdrop-blur-md border-b border-cyan-400/30 shadow-md">
    <div className="flex items-center space-x-3">
      <img src={vega} alt="Logo" className="w-12 h-12 rounded-xl" />
      <span className="text-cyan-600 font-semibold text-lg tracking-wide">
        VegaTech
      </span>
    </div>
    <div className="flex space-x-4">
      <button className="text-gray-700 hover:text-cyan-500 transition-colors duration-200">
        Support
      </button>
    </div>
  </nav>

  <ToastContainer />

  {/* Login card */}
  <div className="flex-1 flex items-center justify-center px-4">
    <div className="relative z-10 w-full max-w-sm sm:max-w-md p-8 bg-white/90 backdrop-blur-lg border border-cyan-400/30 rounded-2xl shadow-xl hover:shadow-cyan-400/30 transition-transform duration-500 ">
      <div className="flex flex-col items-center mb-4">
        <img
          src={vegalogo2}
          alt="Logo"
          className="w-40 h-20 sm:w-58 sm:h-55 mb-4"
        />
        <h1 className="text-3xl font-bold text-cyan-600 text-center mb-1 tracking-wide font-inter">
          Welcome Back
        </h1>
        <p className="text-sm font-bold text-gray-600 text-center opacity-90">
          Admin Login
        </p>
      </div>

      <form className="space-y-5">
        <div className="relative">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder=" "
            disabled={isLoading}
            className="peer w-full px-4 pt-5 pb-2 text-sm sm:text-base rounded-xl border border-cyan-500/30 bg-white placeholder-transparent focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-gray-800 transition-all duration-300"
            required
          />
          <label className="absolute left-4 top-2 text-gray-500 text-xs font-medium transition-all duration-300 peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-xs peer-focus:top-2 peer-focus:text-cyan-600 peer-focus:text-xs">
            Username
          </label>
        </div>

        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder=" "
            disabled={isLoading}
            className="peer w-full px-4 pt-5 pb-2 text-sm sm:text-base rounded-xl border border-cyan-500/30 bg-white placeholder-transparent focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-gray-800 transition-all duration-300"
            required
          />
          <label className="absolute left-4 top-2 text-gray-500 text-xs font-medium transition-all duration-300 peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-xs peer-focus:top-2 peer-focus:text-cyan-600 peer-focus:text-xs">
            Password
          </label>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-cyan-400/50 transform transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Checking credentials...
            </span>
          ) : (
            "Log In"
          )}
        </button>

        {error && (
          <div className="text-red-500 text-center text-sm mt-2 animate-fade-in">
            {error}
          </div>
        )}
      </form>
    </div>
  </div>

  {/* Footer */}
  <footer className="relative z-10 py-4 text-center text-gray-600 border-t border-cyan-400/20 bg-white/80 backdrop-blur-md">
    &copy; {new Date().getFullYear()} VegaTech. All rights reserved.
  </footer>

  <style>{`
    @keyframes fade-in { from { opacity:0; } to { opacity:1; } }
    .animate-fade-in { animation: fade-in 0.3s ease-out; }
  `}</style>

  {/* Tech particle animation */}
  <script>
    {`
      const canvas = document.getElementById('tech-bg');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const lines = [];
        for (let i = 0; i < 80; i++) {
          lines.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            length: Math.random() * 100 + 20,
            speed: Math.random() * 0.5 + 0.2
          });
        }

        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          lines.forEach((l) => {
            ctx.beginPath();
            ctx.moveTo(l.x, l.y);
            ctx.lineTo(l.x, l.y + l.length);
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
            l.y += l.speed;
            if (l.y > canvas.height) l.y = -l.length;
          });
          requestAnimationFrame(animate);
        }
        animate();

        window.addEventListener('resize', () => {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        });
      }
    `}
  </script>
</div>

  );
};

export default Login;
