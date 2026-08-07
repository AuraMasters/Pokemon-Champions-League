import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center relative overflow-hidden font-sans text-slate-900 selection:bg-red-500/20 selection:text-red-900">
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMwMDAwMDAiLz48L3N2Zz4=')]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-red-100/40 to-slate-100/10 blur-[100px] rounded-full pointer-events-none z-0"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px] mx-4 p-10 bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] text-center flex flex-col items-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 120,
            damping: 15,
          }}
          className="w-20 h-20 mx-auto rounded-full border-4 border-slate-900 shadow-lg shadow-red-500/20 relative flex items-center justify-center mb-8 overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-red-500 to-red-600"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-slate-50"></div>
          <div className="w-full h-1.5 bg-slate-900 absolute top-1/2 -translate-y-1/2"></div>
          <div className="w-6 h-6 bg-slate-900 rounded-full z-10 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full"
        >
          <h1 className="text-2xl font-extrabold mb-2 tracking-tight text-slate-900">
            PCL <span className="text-red-600 font-bold">Esports</span>
          </h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
            The premier competitive battling platform.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="w-full flex flex-col gap-3"
        >
          <button className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-[0_2px_10px_rgb(220,38,38,0.2)] hover:shadow-[0_4px_15px_rgb(220,38,38,0.3)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer">
            Sign In to PCL
          </button>
          <div className="flex items-center gap-3 my-2 opacity-60">
            <div className="h-px w-full bg-slate-200"></div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Or
            </span>
            <div className="h-px w-full bg-slate-200"></div>
          </div>

          <button className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all hover:border-slate-300 hover:text-slate-900 active:scale-[0.98] cursor-pointer">
            Create an Account
          </button>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute bottom-8 w-full text-center flex flex-col items-center gap-2"
      >
        <div className="flex gap-4 text-xs font-medium text-slate-400">
          <a href="#" className="hover:text-slate-600 transition-colors">
            Privacy Policy
          </a>
          <span className="text-slate-300">•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">
            Terms of Service
          </a>
          <span className="text-slate-300">•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">
            Support
          </a>
        </div>
        <p className="text-[11px] text-slate-400/80">
          &copy; {new Date().getFullYear()} PCL Esports. Not affiliated with The
          Pokémon Company.
        </p>
      </motion.div>
    </div>
  );
}
