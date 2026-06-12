import React, { useState } from "react";
import { Trip, Activity } from "../types";
import { 
  Compass, 
  CalendarDays, 
  Route, 
  Bell, 
  Plus, 
  MapPin, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  Building,
  Train
} from "lucide-react";

interface DashboardProps {
  trips: Trip[];
  activities: Activity[];
  onQuickAddTrip: () => void;
  onQuickAddActivity: () => void;
  onNavigate: (view: string) => void;
}

export default function Dashboard({ 
  trips, 
  activities, 
  onQuickAddTrip, 
  onQuickAddActivity,
  onNavigate 
}: DashboardProps) {

  // Statistics Calculation
  const todayStr = new Date().toISOString().split("T")[0];
  
  // 1. 即將出發的行程 (planning status OR startDate in the future)
  const upcomingTrips = trips.filter(
    trip => trip.status === "planning" || trip.startDate > todayStr
  );

  // 2. 累計旅行天數 (sum of duration of all trips)
  const calculateDuration = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 300 * 288 * 100)) + 1; // 1000 * 60 * 60 * 24 = 86400000 ms
  };

  const totalTravelDays = trips.reduce((sum, trip) => {
    return sum + (trip.startDate && trip.endDate ? calculateDuration(trip.startDate, trip.endDate) : 0);
  }, 0);

  // 3. 已安排的活動數量
  const totalActivities = activities.length;

  // 4. 交通或住宿提醒數量 (activities with isTransportAccom === true)
  const remindersCount = activities.filter(act => act.isTransportAccom === true).length;

  // Get recent 3 trips & recently added 3 activities
  const recentTrips = [...trips]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 3);

  const upcomingActivities = [...activities]
    .filter(act => act.date >= todayStr && act.status === "pending")
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 4);

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100/10">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            歡迎回來！開啟您的完美旅行
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            透過整合式行程規劃系統，幫助您預先打理出發、目的地、每日觀光景點及交通住宿細節，拒絕零散遗漏。
          </p>
        </div>
        {/* Abstract decorative graphic */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-4">
          <svg width="400" height="400" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="2" />
            <path d="M50 10v80M10 50h80" stroke="white" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1 */}
        <div id="stat-upcoming-trips" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">即將出發行程</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{upcomingTrips.length} <span className="text-xs font-normal text-slate-400">個</span></p>
          </div>
        </div>

        {/* Stat 2 */}
        <div id="stat-total-days" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">累計旅行天數</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalTravelDays} <span className="text-xs font-normal text-slate-400">天</span></p>
          </div>
        </div>

        {/* Stat 3 */}
        <div id="stat-activities" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <Route className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">已規劃活動數量</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalActivities} <span className="text-xs font-normal text-slate-400">個</span></p>
          </div>
        </div>

        {/* Stat 4 */}
        <div id="stat-reminders" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="h-12 w-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">交通住宿提醒</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{remindersCount} <span className="text-xs font-normal text-slate-400">個</span></p>
          </div>
        </div>
      </div>

      {/* Quick Action Area */}
      <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100/40">
        <h3 className="text-lg font-bold mb-4">⚡ 快速操作與規劃</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onQuickAddTrip}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl py-3.5 px-4 flex items-center justify-between transition-all text-left font-semibold text-sm cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <span className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">+</span>
              <span>新增全新行程規劃</span>
            </span>
            <ChevronRight className="w-5 h-5 text-indigo-300" />
          </button>
          
          <button
            onClick={onQuickAddActivity}
            disabled={trips.length === 0}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl py-3.5 px-4 flex items-center justify-between transition-all text-left font-semibold text-sm cursor-pointer disabled:opacity-40 disabled:bg-indigo-500 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-3">
              <span className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-lg">+</span>
              <span>
                {trips.length === 0 ? "需先有行程才可新增活動" : "新增每日特定活動"}
              </span>
            </span>
            <ChevronRight className="w-5 h-5 text-indigo-100" />
          </button>
        </div>
      </div>

      {/* Double Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Recently added trips */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-800">📌 我的近期行程</h3>
            <button 
              onClick={() => onNavigate("trips")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              檢視所有
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {recentTrips.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl space-y-2">
                <p className="text-sm text-slate-400 font-medium">目前尚無規劃的行程</p>
                <button
                  onClick={onQuickAddTrip}
                  className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  立即規劃第一個行程 ➔
                </button>
              </div>
            ) : (
              recentTrips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/20 hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 truncate text-sm sm:text-base">{trip.name}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                        trip.status === "planning" ? "bg-amber-100 text-amber-750" :
                        trip.status === "ongoing" ? "bg-indigo-100 text-indigo-705" :
                        "bg-emerald-100 text-emerald-755"
                      }`}>
                        {trip.status === "planning" ? "規劃中" :
                         trip.status === "ongoing" ? "進行中" : "已完成"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {trip.destination}
                      </span>
                      <span>•</span>
                      <span>{trip.startDate} ~ {trip.endDate}</span>
                    </div>
                  </div>
                  <ChevronRight 
                    className="w-5 h-5 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0 transition-colors" 
                    onClick={() => onNavigate("trips")}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Upcoming activities */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-800">⏱️ 即將到來的活動</h3>
            <button 
              onClick={() => onNavigate("activities")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              檢視所有
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {upcomingActivities.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-sm text-slate-400 font-medium">近期沒有即將到來的活動</p>
                {trips.length > 0 && (
                  <button
                    onClick={onQuickAddActivity}
                    className="text-xs text-indigo-600 font-semibold hover:underline mt-2 cursor-pointer"
                  >
                    安排行程活動 ➔
                  </button>
                )}
              </div>
            ) : (
              upcomingActivities.map((act) => (
                <div 
                  key={act.id} 
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{act.name}</span>
                        {act.isTransportAccom && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-medium border border-amber-100 shrink-0">
                            {act.name.includes("住") || act.location.includes("住") || act.name.includes("飯") ? (
                              <Building className="w-2.5 h-2.5" />
                            ) : (
                              <Train className="w-2.5 h-2.5" />
                            )}
                            提醒
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {act.location}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                        <Clock className="w-3 h-3" />
                        {act.date.substring(5)} {act.time}
                      </span>
                    </div>
                  </div>
                  {act.notes && (
                    <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 truncate">
                      備註：{act.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
