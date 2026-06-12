import React, { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { User, Lock, Mail, UserPlus, LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";

interface AuthProps {
  onSuccess: () => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (isRegister && !name.trim()) {
      setError("請輸入姓名");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("密碼長度至少需 6 個字元");
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update Firebase Auth details
        await updateProfile(user, { displayName: name });
        
        // Write to Firestore /profiles
        const profilePath = `profiles/${user.uid}`;
        try {
          await setDoc(doc(db, "profiles", user.uid), {
            userId: user.uid,
            name: name,
            email: email,
            updatedAt: new Date().toISOString()
          });
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.CREATE, profilePath);
        }
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error("Auth error:", err);
      let localizedError = "發生錯誤，請稍後再試";
      if (err.code === "auth/email-already-in-use") {
        localizedError = "此電子信箱已被註冊";
      } else if (err.code === "auth/invalid-email") {
        localizedError = "無效的電子信箱格式";
      } else if (err.code === "auth/weak-password") {
        localizedError = "密碼強度不夠（至少 6 個字元）";
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        localizedError = "電子信箱或密碼輸入錯誤";
      } else if (err.code === "auth/network-request-failed") {
        localizedError = "網路連線失敗，請檢查網路狀態";
      }
      setError(localizedError);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill demo credentials for quick preview exploration
  const handleQuickDemo = async () => {
    setError(null);
    setLoading(true);
    // Dynamic generation of demo profile if doesn't exist, otherwise sign in
    const demoEmail = "demo@trip-planner.com";
    const demoPass = "demo123456";
    
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      onSuccess();
    } catch (err: any) {
      // If user doesn't exist, register them
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          const user = userCredential.user;
          await updateProfile(user, { displayName: "旅行探險家" });
          
          await setDoc(doc(db, "profiles", user.uid), {
            userId: user.uid,
            name: "旅行探險家",
            email: demoEmail,
            updatedAt: new Date().toISOString()
          });
          onSuccess();
        } catch (signupErr) {
          console.error("Demo registration failed:", signupErr);
          setError("體驗帳號登入失敗，請嘗試手動註冊");
        }
      } else {
        setError("快速體驗登入失敗：" + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-800">
          行程規劃系統
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          為旅行愛好者量身打造的專屬自由行規劃神器
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-100 rounded-2xl sm:px-10 border border-slate-100">
          <div className="flex border-b border-slate-100 pb-4 mb-6">
            <button
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`flex-1 text-center py-2 font-medium transition-colors ${!isRegister ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              登入帳號
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`flex-1 text-center py-2 font-medium transition-colors ${isRegister ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              註冊新帳號
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start gap-2.5 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleAuth}>
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  您的姓名
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                    placeholder="例如：張大明"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                電子信箱 (Email)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                密碼 (Password)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                  placeholder="請輸入密碼（至少 6 碼）"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md shadow-blue-100 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isRegister ? (
                  <>
                    <UserPlus className="w-5 h-5" />
                    立即註冊
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    登入系統
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative flex justify-center text-xs uppercase mb-4">
              <span className="bg-white px-2 text-slate-400">或</span>
            </div>
            <button
              onClick={handleQuickDemo}
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none transition-all "
            >
              ✨ 快速體驗（免註冊登入）
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
