import React from "react";
import { LayoutDashboard, Calendar, Compass, Settings, LogOut, Plane, ChevronRight } from "lucide-react";
import { auth } from "../firebase";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userName: string;
  userEmail: string;
}

export default function Sidebar({ currentView, onViewChange, userName, userEmail }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "儀表板首頁", icon: LayoutDashboard },
    { id: "trips", label: "我的行程規劃", icon: Compass },
    { id: "activities", label: "每日行程活動", icon: Calendar },
    { id: "profile", label: "個人資料設定", icon: Settings },
  ];

  const handleLogout = async () => {
    if (confirm("您確定要登出系統嗎？")) {
      try {
        await auth.signOut();
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 border-r border-slate-850 z-10 font-sans text-slate-300">
      {/* Brand logo */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-800">
        <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
          <Plane className="h-5 w-5 transform -rotate-45" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">智旅規劃系統</span>
      </div>

      {/* Navigation menu */}
      <div className="flex-1 flex flex-col justify-between pt-5 pb-4 overflow-y-auto">
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-indigo-400" />}
              </button>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-indigo-400 uppercase">
              {userName ? userName.charAt(0) : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{userName || "旅行探險家"}</p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-rose-450 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20"
          >
            <LogOut className="h-4 w-4 text-rose-400" />
            <span>登出系統</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
