import React, { useState } from "react";
import { Trip, TripStatus } from "../types";
import { 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  Edit3, 
  Trash2, 
  X, 
  Map, 
  Briefcase,
  AlertTriangle,
  Compass
} from "lucide-react";

interface TripsManagerProps {
  trips: Trip[];
  onAddTrip: (trip: Omit<Trip, "id" | "userId">) => Promise<void>;
  onEditTrip: (id: string, trip: Partial<Trip>) => Promise<void>;
  onDeleteTrip: (id: string) => Promise<void>;
  // For open modal trigger from dashboard quick action
  openWithModal: boolean;
  setOpenWithModal: (open: boolean) => void;
}

export default function TripsManager({
  trips,
  onAddTrip,
  onEditTrip,
  onDeleteTrip,
  openWithModal,
  setOpenWithModal
}: TripsManagerProps) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | TripStatus>("all");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<TripStatus>("planning");
  const [error, setError] = useState("");

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingTrip(null);
    setName("");
    setDestination("");
    setStartDate("");
    setEndDate("");
    setStatus("planning");
    setError("");
    setShowModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setName(trip.name);
    setDestination(trip.destination);
    setStartDate(trip.startDate);
    setEndDate(trip.endDate);
    setStatus(trip.status);
    setError("");
    setShowModal(true);
  };

  // Trigger modal when opened from Dashboard quick action
  React.useEffect(() => {
    if (openWithModal) {
      handleOpenAdd();
      setOpenWithModal(false);
    }
  }, [openWithModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !destination.trim() || !startDate || !endDate) {
      setError("所有欄位均為必填");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError("結束日期不可早於出發日期");
      return;
    }

    try {
      if (editingTrip) {
        await onEditTrip(editingTrip.id, {
          name,
          destination,
          startDate,
          endDate,
          status,
        });
      } else {
        await onAddTrip({
          name,
          destination,
          startDate,
          endDate,
          status,
        });
      }
      setShowModal(false);
    } catch (err: any) {
      setError("儲存行程失敗：" + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`確定要刪除「${name}」？此動作將一併刪除或使相關活動失效。`)) {
      try {
        await onDeleteTrip(id);
      } catch (err: any) {
        alert("刪除失敗：" + err.message);
      }
    }
  };

  // Filter & Search logic
  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.name.toLowerCase().includes(search.toLowerCase()) || 
                          trip.destination.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || trip.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-3 h-5 w-5 text-slate-400 self-center my-auto" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
            placeholder="搜尋行程名稱或目的地..."
          />
        </div>

        {/* Filter categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "planning", "ongoing", "completed"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === st
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "bg-slate-100 text-slate-650 hover:bg-slate-200"
              }`}
            >
              {st === "all" ? "全部行程" : st === "planning" ? "規劃中" : st === "ongoing" ? "進行中" : "已完成"}
            </button>
          ))}
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 px-4 rounded-xl shadow-md shadow-indigo-100/55 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          新增旅程
        </button>
      </div>

      {/* Trips list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrips.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white border border-slate-200 rounded-3xl space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <Compass className="w-6 h-6" />
            </div>
            <p className="text-slate-500 font-medium">找不到符合的行李箱行程</p>
            <p className="text-xs text-slate-400">請嘗試更換搜尋關鍵字或新建一個規劃吧！</p>
          </div>
        ) : (
          filteredTrips.map((trip) => (
            <div 
              key={trip.id} 
              id={`trip-card-${trip.id}`}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
            >
              {/* Trip accent color bar based on status */}
              <div className={`h-2.5 w-full ${
                trip.status === "planning" ? "bg-amber-400" :
                trip.status === "ongoing" ? "bg-indigo-500" :
                "bg-emerald-500"
              }`} />

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      trip.status === "planning" ? "bg-amber-50 text-amber-705 border border-amber-100" :
                      trip.status === "ongoing" ? "bg-indigo-50 text-indigo-705 border border-indigo-100" :
                      "bg-emerald-50 text-emerald-705 border border-emerald-100"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        trip.status === "planning" ? "bg-amber-500" :
                        trip.status === "ongoing" ? "bg-indigo-500" :
                        "bg-emerald-500"
                      }`} />
                      {trip.status === "planning" ? "規劃中" :
                       trip.status === "ongoing" ? "進行中" : "已完成"}
                    </span>

                    {/* Quick actions inside card */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(trip)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        title="編輯此行程"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(trip.id, trip.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        title="刪除此行程"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-1.5">
                    {trip.name}
                  </h3>

                  <div className="space-y-2 mt-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4.5 h-4.5 text-slate-400 font-semibold" />
                      <span className="font-semibold text-slate-600">{trip.destination}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4.5 h-4.5 text-slate-400" />
                      <span className="text-xs">{trip.startDate} ~ {trip.endDate}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-5 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">旅行時間</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {(() => {
                      const s = new Date(trip.startDate);
                      const e = new Date(trip.endDate);
                      const diff = e.getTime() - s.getTime();
                      if (diff < 0) return 0;
                      return Math.ceil(diff / (1000 * 300 * 288 * 100)) + 1;
                    })()} 天
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingTrip ? "修改旅行規劃" : "新增自由行行程"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-divider mb-1.5">
                  行程名稱
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                  placeholder="例如：東京浪漫賞櫻五日遊"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  目的地
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                  placeholder="例如：日本 東京、箱根"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    出發日期
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    結束日期
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  行程狀態
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TripStatus)}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3.5 text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                >
                  <option value="planning">規劃中</option>
                  <option value="ongoing">進行中</option>
                  <option value="completed">已完成</option>
                </select>
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
                  className="flex-1 py-2.5 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-bold text-sm shadow-md shadow-indigo-100 transition-colors cursor-pointer"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
