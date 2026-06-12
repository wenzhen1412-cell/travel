import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { User, Mail, Save, CheckCircle, AlertTriangle, UserCheck, Shield } from "lucide-react";
import { UserProfile } from "../types";

interface ProfilePageProps {
  userId: string;
  userEmail: string;
  userName: string;
  onProfileUpdated: (newName: string) => void;
}

export default function ProfilePage({ 
  userId, 
  userEmail, 
  userName,
  onProfileUpdated 
}: ProfilePageProps) {
  const [name, setName] = useState(userName);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Load latest profile from firestore just in case
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "profiles", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          if (data.name) {
            setName(data.name);
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!name.trim()) {
      setError("姓名不能為空白");
      setLoading(false);
      return;
    }

    try {
      // 1. Update Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      // 2. Clear or update Firestore profiles/{userId}
      const profilePath = `profiles/${userId}`;
      try {
        await setDoc(doc(db, "profiles", userId), {
          userId: userId,
          name: name,
          email: userEmail,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        handleFirestoreError(dbErr, OperationType.UPDATE, profilePath);
      }

      // 3. Inform parent layout
      onProfileUpdated(name);
      setSuccess(true);
      
      // Auto-hide success alert
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError("儲存個人設定時發生錯誤：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Profile Header Block */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-10 text-white relative">
          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
            <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/10 text-white font-bold flex items-center justify-center text-3xl uppercase shadow-inner">
              {name ? name.charAt(0) : userEmail.charAt(0)}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-xl font-extrabold">{name || "旅行探險家"}</h3>
              <p className="text-blue-100 text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-1">
                <Shield className="w-3.5 h-3.5" />
                行程規劃系統 • 獨立帳戶安全保護
              </p>
            </div>
          </div>
          {/* Abstract graphic */}
          <div className="absolute right-0 bottom-0 top-0 w-32 opacity-10 bg-[radial-gradient(circle_at_right,rgba(255,255,255,0.4),transparent)] pointer-events-none" />
        </div>

        {/* Edit fields */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-center gap-2.5 text-xs">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              <span>個人基本資料已成功更新儲存！</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-center gap-2.5 text-xs">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Display Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                您的名稱 / 暱稱
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
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                  placeholder="輸入您的顯示姓名"
                />
              </div>
            </div>

            {/* Email Address Readonly */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                <span>帳號信箱 (唯讀)</span>
                <span className="text-[10px] text-slate-400 font-normal">信箱不可變更</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  readOnly
                  disabled
                  value={userEmail}
                  className="block w-full rounded-xl border border-slate-250 bg-slate-100 py-2.5 pl-10 pr-4 text-slate-450 focus:outline-none text-sm cursor-not-allowed select-none"
                />
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-slate-50 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-xl font-bold text-sm shadow-md shadow-blue-100 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  儲存修改
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Safety info tip */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-start gap-3">
        <UserCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-800">登入安全性提示</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            此為端對端安全整合之 Firestore 資料庫。所有登錄行程及每日活動卡片均透過各帳號獨有的 User ID 對稱鎖在雲端隔離存取，其他旅行者或未授權用戶無法存取您的行蹤，請放心規劃。
          </p>
        </div>
      </div>
    </div>
  );
}
