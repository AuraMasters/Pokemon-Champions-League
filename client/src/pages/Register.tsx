// Register.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Register() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const totalSteps = 3;

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(step + 1);
    }, 800);
  };

  const slideVariants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
    exit: { x: -40, opacity: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  };

  const fadeVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center relative overflow-hidden font-sans text-slate-900 selection:bg-red-500/20 selection:text-red-900">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMwMDAwMDAiLz48L3N2Zz4=')]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-red-100/40 to-slate-100/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px] mx-4 bg-white/90 backdrop-blur-2xl border border-slate-200/80 rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] overflow-hidden min-h-[500px] flex flex-col"
      >
        {/* Progress Bar */}
        <div className="h-1 w-full bg-slate-100 relative">
          <motion.div
            className="absolute top-0 left-0 h-full bg-red-500"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        <div className="p-8 sm:p-10 flex-grow flex flex-col relative">
          {/* Logo */}
          <motion.div
            animate={{ scale: step === 1 ? 1 : 0.8, y: step === 1 ? 0 : -10, opacity: step > totalSteps ? 0 : 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center mb-6 origin-top"
          >
            <div className="w-12 h-12 rounded-full border-[2.5px] border-slate-800 shadow-sm relative flex items-center justify-center mb-4 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-red-500 to-red-600"></div>
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[#F8FAFC]"></div>
              <div className="w-full h-[3px] bg-slate-800 absolute top-1/2 -translate-y-1/2"></div>
              <div className="w-3.5 h-3.5 bg-slate-800 rounded-full z-10 flex items-center justify-center ring-[1.5px] ring-white">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
            {step === 1 && (
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                PCL <span className="text-red-600 font-bold">Esports</span>
              </h1>
            )}
          </motion.div>

          {/* Form Content Area */}
          <div className="flex-grow relative flex items-center justify-center w-full">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: ACCOUNT DETAILS */}
              {step === 1 && (
                <motion.form
                  key="register-step1"
                  variants={slideVariants}
                  initial="enter" animate="center" exit="exit"
                  onSubmit={handleNextStep}
                  className="w-full flex flex-col gap-4"
                >
                  <div className="text-center mb-1">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Create Account</h2>
                    <p className="text-sm font-medium text-slate-500">Join the competitive ladder today.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="Choose a trainer name"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !username || !email}
                    className="w-full mt-2 py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-xl transition-all shadow-[0_2px_10px_rgb(220,38,38,0.2)] hover:shadow-[0_4px_15px_rgb(220,38,38,0.3)] active:scale-[0.98] flex justify-center"
                  >
                    {isLoading ? <Spinner /> : "Continue"}
                  </button>

                  <p className="text-center text-xs font-medium text-slate-500 mt-2">
                    Already have an account? <a href="#" className="text-slate-800 hover:text-red-600 transition-colors">Sign in here</a>
                  </p>
                </motion.form>
              )}

              {/* STEP 2: VERIFICATION CODE */}
              {step === 2 && (
                <motion.form
                  key="register-step2"
                  variants={slideVariants}
                  initial="enter" animate="center" exit="exit"
                  onSubmit={handleNextStep}
                  className="w-full flex flex-col gap-5"
                >
                  <div className="text-center mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Verify Email</h2>
                    <p className="text-sm font-medium text-slate-500">
                      Code sent to <span className="text-slate-800 font-bold">{email || "your email"}</span>.
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1 text-center block">6-Digit Code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      placeholder="• • • • • •"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-2xl tracking-[0.5em] text-center font-bold text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || code.length < 6}
                    className="w-full mt-2 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-all shadow-sm active:scale-[0.98] flex justify-center"
                  >
                    {isLoading ? <Spinner /> : "Verify Identity"}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    ← Back to edit details
                  </button>
                </motion.form>
              )}

              {/* STEP 3: MANDATORY PASSKEY */}
              {step === 3 && (
                <motion.div
                  key="register-step3"
                  variants={slideVariants}
                  initial="enter" animate="center" exit="exit"
                  className="w-full flex flex-col gap-5 text-center"
                >
                  <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-2 border border-red-100">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest mb-3">
                      Required
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Setup Passkey</h2>
                    <p className="text-sm font-medium text-slate-500 px-2">
                      We require passkeys for all accounts to guarantee competitive integrity and prevent account theft. 
                    </p>
                  </div>
                  <div className="flex flex-col mt-4">
                    <button
                      onClick={() => handleNextStep()}
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-[0_2px_10px_rgb(220,38,38,0.2)] hover:shadow-[0_4px_15px_rgb(220,38,38,0.3)] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Spinner /> : "Register Device Passkey"}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-4 leading-relaxed px-4">
                      By registering a passkey, you agree to PCL Esports' terms of competitive authentication.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* SUCCESS STATE */}
              {step > totalSteps && (
                <motion.div
                  key="register-success"
                  variants={fadeVariants}
                  initial="initial" animate="animate"
                  className="w-full flex flex-col items-center justify-center gap-4 text-center py-10"
                >
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-2 border border-green-100">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">Registration Complete!</h2>
                    <p className="text-sm font-medium text-slate-500">Redirecting to your dashboard...</p>
                  </div>
                  <Spinner className="text-green-500 mt-4" />
                </motion.div>
              )}
              
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Spinner({ className = "text-white" }: { className?: string }) {
  return (
    <svg className={`animate-spin h-5 w-5 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}