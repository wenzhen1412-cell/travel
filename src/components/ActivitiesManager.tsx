import React, { useState } from "react";
import { Activity, Trip, ActivityStatus } from "../types";
import { 
  Plus, 
  MapPin, 
  Clock, 
  Trash2, 
  Edit3, 
  Calendar, 
  X, 
  AlertTriangle,
  CheckCircle,
  Building,
  Train,
  Check
} from "lucide-react";

interface ActivitiesManagerProps {
  activities: Activity[];
  trips: Trip[];
  onAddActivity: (act: Omit<Activity, "id" | "userId">) => Promise<void>;
  onEditActivity: (id: string, act: Partial<Activity>) => Promise<void>;
  onDeleteActivity: (id: string) => Promise<void>;
  // For open modal trigger from dashboard quick action
  openWithModal: boolean;
  setOpenWithModal: (open: boolean) => void;
}

export default function ActivitiesManager({
  activities,
  trips,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  openWithModal,
  setOpenWithModal
}: ActivitiesManagerProps) {
  // If user selected a specific trip
  const [selectedTripId, setSelectedTripId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | ActivityStatus>("all");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Form states
  const [tripId, setTripId] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<ActivityStatus>("pending");
  const [isTransportAccom, setIsTransportAccom] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Initialize selected trip
  React.useEffect(() => {
    if (trips.length > 0 && selectedTripId === "all") {
      // By default select the first trip
      setSelectedTripId(trips[0].id);
    }
  }, [trips]);

  // Handle opening Add Modal
  const handleOpenAdd = () => {
    setEditingActivity(null);
    setTripId(selectedTripId !== "all" ? selectedTripId : (trips[0]?.id || ""));
    setName("");
    
    // Default date as corresponding trip start date
    const associatedTrip = trips.find(t => t.id === (selectedTripId !== "all" ? selectedTripId : trips[0]?.id));
    setDate(associatedTrip ? associatedTrip.startDate : "");
    setTime("09:00");
    setLocation("");
    setStatus("pending");
    setIsTransportAccom(false);
    setNotes("");
    setError("");
    setShowModal(true);
  };

  // Handle opening Edit Modal
  const handleOpenEdit = (act: Activity) => {
    setEditingActivity(act);
    setTripId(act.tripId);
    setName(act.name);
    setDate(act.date);
    setTime(act.time);
    setLocation(act.location);
    setStatus(act.status);
    setIsTransportAccom(!!act.isTransportAccom);
    setNotes(act.notes || "");
    setError("");
    setShowModal(true);
  };

  // Open Add modal when triggered from quick actions on dashboard
  React.useEffect(() => {
    if (openWithModal) {
      if (trips.length > 0) {
        handleOpenAdd();
      } else {
        alert("必須先建立至少一個行程規劃，才能新增每日活動！");
      }
      setOpenWithModal(false);
    }
  }, [openWithModal]);

  // Adjust activity form date on changing selected trip in modal
  const handleTripChangeInForm = (targetTripId: string) => {
    setTripId(targetTripId);
    const proj = trips.find(t => t.id === targetTripId);
    if (proj) {
      // Set to trip start date by default
      setDate(proj.startDate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!tripId) {
      setError("請選取所屬行程");
      return;
    }
    if (!name.trim() || !date || !time || !location.trim()) {
      setError("除備註外，所有欄位皆為必填");
      return;
    }

    // Date sanity check (matching bounds of trip dates)
    const activeTrip = trips.find(t => t.id === tripId);
    if (activeTrip) {
      if (date < activeTrip.startDate || date > activeTrip.endDate) {
        setError(`活動日期需位於行程期間內：${activeTrip.startDate} 至 ${activeTrip.endDate}`);
        return;
      }
    }

    try {
      if (editingActivity) {
        await onEditActivity(editingActivity.id, {
          tripId,
          name,
          date,
          time,
          location,
          status,
          isTransportAccom,
          notes,
        });
      } else {
        await onAddActivity({
          tripId,
          name,
          date,
          time,
          location,
          status,
          isTransportAccom,
          notes,
        });
      }
      setShowModal(false);
    } catch (err: any) {
      setError("儲存活動失敗：" + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`確認要刪除「${name}」？`)) {
      try {
        await onDeleteActivity(id);
      } catch (err: any) {
        alert("刪除失敗：" + err.message);
      }
    }
  };

  const handleToggleStatus = async (act: Activity) => {
    const newStatus: ActivityStatus = act.status === "pending" ? "completed" : "pending";
    try {
      await onEditActivity(act.id, { status: newStatus });
    } catch (err) {
      alert("狀態更新失敗");
    }
  };

  // Filter activities
  const filteredActivities = activities.filter(act => {
    const matchesTrip = selectedTripId === "all" || act.tripId === selectedTripId;
    const matchesStatus = filterStatus === "all" || act.status === filterStatus;
    return matchesTrip && matchesStatus;
  });

  // Group activities of selected trip by date YYYY-MM-DD
  const activitiesByDate: { [date: string]: Activity[] } = {};
  filteredActivities.forEach(act => {
    if (!activitiesByDate[act.date]) {
      activitiesByDate[act.date] = [];
    }
    activitiesByDate[act.date].push(act);
  });

  // Sort dates
  const sortedDates = Object.keys(activitiesByDate).sort();

  // Sort activities chronologically inside each date
  sortedDates.forEach(dt => {
    activitiesByDate[dt].sort((a, b) => a.time.localeCompare(b.time));
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Trip Selector */}
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              選擇主行程
            </label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-805 font-semibold focus:border-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">顯示所有行程活動</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  🏷️ {trip.name} ({trip.startDate.substring(5)})
                </option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div className="flex-1 max-w-xs">
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              狀態過濾
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-805 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">不限狀態</option>
              <option value="pending">待出發</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          disabled={trips.length === 0}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-100 transition-all self-end disabled:opacity-50 disabled:cursor-not-allowed h-10 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          安排新活動
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-slate-600 font-semibold">尚未建立任何行程</p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            您必須先前往「我的行程規劃」建立至少一個主要旅程（如：東京賞櫻行），才能開始安排每日的詳細活動、觀光景點或住宿與交通訂票喔！
          </p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-slate-500 font-medium">本行程尚未安排任何每日活動</p>
          <button
            onClick={handleOpenAdd}
            className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
          >
            ➔ 立即新增第一個行程活動
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dt) => (
            <div key={dt} className="space-y-4">
              {/* Date Header Header */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold bg-indigo-650 text-white px-3.5 py-1.5 rounded-xl shadow-xs">
                  {dt}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {new Date(dt).toLocaleDateString("zh-TW", { weekday: "long" })}
                </span>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              {/* Day Timeline Activities */}
              <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-4">
                {activitiesByDate[dt].map((act) => {
                  const associatedTripObj = trips.find(t => t.id === act.tripId);
                  return (
                    <div 
                      key={act.id} 
                      id={`activity-card-${act.id}`}
                      className={`relative bg-white rounded-2xl border ${act.status === 'completed' ? 'border-slate-200' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4`}
                    >
                      {/* Left Dot Indicator */}
                      <span className={`absolute -left-[31px] top-5 h-4.5 w-4.5 rounded-full border-4 border-white shadow-sm ${
                        act.status === "completed" ? "bg-emerald-500" : "bg-indigo-600"
                      }`} />

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Toggle status check */}
                          <button
                            onClick={() => handleToggleStatus(act)}
                            className={`p-1 rounded-lg border cursor-pointer ${
                              act.status === "completed" 
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                : "border-slate-200 text-slate-300 hover:text-indigo-650 hover:bg-indigo-50"
                            } transition-all`}
                            title="切換活動狀態"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          <span className={`text-sm font-bold ${
                            act.status === "completed" ? "line-through text-slate-400" : "text-slate-800"
                          }`}>
                            {act.name}
                          </span>

                          {/* Quick indicators */}
                          {act.isTransportAccom && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-100">
                              {act.name.includes("住") || act.location.includes("住") || act.name.includes("房") ? (
                                <Building className="w-2.5 h-2.5" />
                              ) : (
                                <Train className="w-2.5 h-2.5" />
                              )}
                              交通/住宿提醒
                            </span>
                          )}

                          {selectedTripId === "all" && associatedTripObj && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-bold">
                              💼 {associatedTripObj.name}
                            </span>
                          )}
                        </div>

                        {/* Location, Time */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <strong className="text-slate-650">{act.time}</strong>
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {act.location}
                          </span>
                        </div>

                        {act.notes && (
                          <div className="text-xs text-slate-505 bg-slate-50/55 p-2.5 rounded-lg border border-slate-200 max-w-2xl leading-relaxed">
                            💡 {act.notes}
                          </div>
                        )}
                      </div>

                      {/* Right quick actions */}
                      <div className="flex items-center md:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-0 border-slate-200">
                        <button
                          onClick={() => handleOpenEdit(act)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-indigo-650 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          編輯
                        </button>
                        <button
                          onClick={() => handleDelete(act.id, act.name)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          刪除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingActivity ? "修改每日行程活動" : "安排全新行程活動"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Trip Selector in form */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  所屬主行程
                </label>
                <select
                  disabled={!!editingActivity}
                  value={tripId}
                  onChange={(e) => handleTripChangeInForm(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none transition-all text-sm disabled:opacity-60 cursor-pointer"
                >
                  <option value="">-- 請選取所屬行程 --</option>
                  {trips.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  活動名稱
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                  placeholder="例如：箱根登山鐵道、預約溫泉旅館 check-in"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    日期 (需在行程其間內)
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    時間 (預計時間)
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  地點位置
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                  placeholder="例如：箱根湯本車站、大涌谷"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Checkbox: is transport/accommodation */}
                <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 transition-all">
                  <input
                    type="checkbox"
                    checked={isTransportAccom}
                    onChange={(e) => setIsTransportAccom(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-700">交通／住宿</span>
                    <span className="text-[9px] text-slate-400">觸發計入儀表板提醒</span>
                  </div>
                </label>

                {/* Status Selector */}
                <div>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ActivityStatus)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-2.5 text-slate-800 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all mt-0.5 cursor-pointer"
                  >
                    <option value="pending">待出發</option>
                    <option value="completed">已完成</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                  活動備註 (選填)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 px-3 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm resize-none"
                  placeholder="如：事先預約的新幹線車次、車票寄放點、或門票 QR Code 備忘錄"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-bold text-sm shadow-md shadow-indigo-110 transition-colors cursor-pointer"
                >
                  儲存活動
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
