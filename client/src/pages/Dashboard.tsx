import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // <-- Imported Axios

// Create the Axios instance with credentials enabled
const api = axios.create({
  baseURL: "http://localhost:8000/api/auth",
  withCredentials: true, // <-- CRITICAL: This sends the HttpOnly cookie to /me and /logout
});

export default function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // 1. Verify Authentication via Backend Cookie Check
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Axios will automatically attach the HttpOnly cookie to this request
        const res = await api.get("/me");
        
        // If successful, store the username in state
        setUsername(res.data.username);
      } catch (err) {
        // If the backend returns 401 Unauthorized, redirect to login
        console.error("Session verification failed:", err);
        navigate("/login");
      } finally {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, [navigate]);

  // 2. Handle Logout via Backend Route
  const handleLogout = async () => {
    try {
      await api.post("/logout");
      // Redirect to login after backend clears the cookie
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
      navigate("/login"); // Force redirect anyway
    }
  };

  // 3. Show a loading spinner while checking the backend
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-slate-300 border-t-red-600"></div>
      </div>
    );
  }

  // 4. Render Dashboard once verified
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 selection:bg-red-500/20 selection:text-red-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-slate-800 shadow-sm relative flex items-center justify-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-red-500 to-red-600"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[#F8FAFC]"></div>
            <div className="w-full h-[2px] bg-slate-800 absolute top-1/2 -translate-y-1/2"></div>
            <div className="w-2.5 h-2.5 bg-slate-800 rounded-full z-10 flex items-center justify-center ring-[1px] ring-white">
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            PCL <span className="text-red-600 font-bold">Esports</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-600">
            Welcome, <span className="text-slate-900">{username || "Trainer"}</span>
          </span>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-8 max-w-6xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
            <p className="text-slate-500 mt-1">Manage your teams, view upcoming tournaments, and check your ladder ranking.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stat Card 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Current Rank</span>
              <span className="text-4xl font-extrabold text-slate-900">#1,402</span>
              <span className="text-xs font-semibold text-green-500 mt-2">↑ Up 42 spots this week</span>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Win Rate</span>
              <span className="text-4xl font-extrabold text-slate-900">64.2%</span>
              <span className="text-xs font-semibold text-slate-400 mt-2">128 Matches Played</span>
            </div>

            {/* Security Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border border-slate-700 shadow-md flex flex-col text-white">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Account Security
              </span>
              <span className="text-2xl font-bold mt-1">Passkey Active</span>
              <span className="text-xs font-medium text-slate-300 mt-auto leading-relaxed">
                Your account is cryptographically secured via your device's biometric module.
              </span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}