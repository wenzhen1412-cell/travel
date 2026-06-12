import React, { useState } from "react";
import { Menu, X, Plane, Compass, Calendar, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { auth } from "../firebase";

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userName: string;
  userEmail: string;
  pageTitle: string;
}

export default function Navbar({ currentView, onViewChange, userName, userEmail, pageTitle }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleMobileNav = (viewId: string) => {
    onViewChange(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 z-30 font-sans md:relative">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side: Page Title (for tablets & desktop) / Brand (for mobile) */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-600 hover:bg-slate-50 md:hidden transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Desktop/Tablet view title */}
          <h1 className="hidden md:block text-xl font-bold text-slate-800 tracking-tight">
            {pageTitle}
          </h1>

          {/* Mobile brand logo */}
          <div className="flex md:hidden items-center gap-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Plane className="h-4.5 w-4.5 transform -rotate-45" />
            </div>
            <span className="text-base font-bold text-slate-800 tracking-tight">
              {pageTitle}
            </span>
          </div>
        </div>

        {/* Right side: Welcome badge & user initial */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">目前登入</span>
            <span className="text-sm font-semibold text-slate-700">{userName || "旅行探險家"}</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-100 uppercase">
            {userName ? userName.charAt(0) : "U"}
          </div>
        </div>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile side menu drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-72 max-w-xs bg-slate-900 text-slate-300 shadow-2xl z-40 md:hidden flex flex-col justify-between transition-transform duration-300 ease-in-out transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Mobile brand header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                <Plane className="h-4.5 w-4.5 transform -rotate-45" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">智旅規劃系統</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="px-4 py-4 space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMobileNav(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <IconComponent className={`h-5 w-5 shrink-0 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

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
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20"
          >
            <LogOut className="h-4 w-4 text-rose-400" />
            <span>登出系統</span>
          </button>
        </div>
      </div>
    </header>
  );
}
