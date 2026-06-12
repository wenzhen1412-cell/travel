import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch 
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";

import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { Trip, Activity } from "./types";

import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import TripsManager from "./components/TripsManager";
import ActivitiesManager from "./components/ActivitiesManager";
import ProfilePage from "./components/ProfilePage";

import { Compass, Calendar, LayoutDashboard, UserCheck, RefreshCw } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard");
  const [userName, setUserName] = useState("旅行探險家");

  // Database lists
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Internal flags to auto-trigger Add Modals in managers on quick action navigation
  const [quickAddTripTrigger, setQuickAddTripTrigger] = useState(false);
  const [quickAddActivityTrigger, setQuickAddActivityTrigger] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserName(currentUser.displayName || "旅行探險家");
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firebase Subscriptions when logged in
  useEffect(() => {
    if (!user) {
      setTrips([]);
      setActivities([]);
      return;
    }

    // Subscribe to Trips
    const tripsPath = "trips";
    const tripsQuery = query(collection(db, "trips"), where("userId", "==", user.uid));
    const unsubscribeTrips = onSnapshot(
      tripsQuery, 
      (snapshot) => {
        const loadedTrips: Trip[] = [];
        snapshot.forEach((doc) => {
          loadedTrips.push({ id: doc.id, ...doc.data() } as Trip);
        });
        setTrips(loadedTrips);
      }, 
      (error) => {
        handleFirestoreError(error, OperationType.GET, tripsPath);
      }
    );

    // Subscribe to Activities
    const activitiesPath = "activities";
    const activitiesQuery = query(collection(db, "activities"), where("userId", "==", user.uid));
    const unsubscribeActivities = onSnapshot(
      activitiesQuery, 
      (snapshot) => {
        const loadedActivities: Activity[] = [];
        snapshot.forEach((doc) => {
          loadedActivities.push({ id: doc.id, ...doc.data() } as Activity);
        });
        setActivities(loadedActivities);
      }, 
      (error) => {
        handleFirestoreError(error, OperationType.GET, activitiesPath);
      }
    );

    return () => {
      unsubscribeTrips();
      unsubscribeActivities();
    };
  }, [user]);

  // Dynamic Page Title
  const getPageTitle = () => {
    switch (currentView) {
      case "dashboard": return "儀表板首頁";
      case "trips": return "我的行程規劃";
      case "activities": return "每日行程活動";
      case "profile": return "個人資料設定";
      default: return "行程規劃系統";
    }
  };

  // --- Firestore Mutation Handlers ---
  
  // Trip actions
  const handleAddTrip = async (newTrip: Omit<Trip, "id" | "userId">) => {
    if (!user) return;
    const path = "trips";
    try {
      await addDoc(collection(db, path), {
        ...newTrip,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleEditTrip = async (id: string, updates: Partial<Trip>) => {
    const path = `trips/${id}`;
    try {
      await updateDoc(doc(db, "trips", id), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    const path = `trips/${id}`;
    try {
      // 1. Delete associated activities in a safe batch writes
      const batch = writeBatch(db);
      const associatedActivities = activities.filter(act => act.tripId === id);
      associatedActivities.forEach((act) => {
        batch.delete(doc(db, "activities", act.id));
      });
      await batch.commit();

      // 2. Delete the trip itself
      await deleteDoc(doc(db, "trips", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Activity actions
  const handleAddActivity = async (newAct: Omit<Activity, "id" | "userId">) => {
    if (!user) return;
    // Cache matching trip name
    const matchingTrip = trips.find(t => t.id === newAct.tripId);
    const path = "activities";
    try {
      await addDoc(collection(db, path), {
        ...newAct,
        userId: user.uid,
        tripName: matchingTrip ? matchingTrip.name : "未知行程",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleEditActivity = async (id: string, updates: Partial<Activity>) => {
    const path = `activities/${id}`;
    try {
      let extraData: Partial<Activity> = {};
      if (updates.tripId) {
        const matchingTrip = trips.find(t => t.id === updates.tripId);
        if (matchingTrip) {
          extraData.tripName = matchingTrip.name;
        }
      }
      await updateDoc(doc(db, "activities", id), {
        ...updates,
        ...extraData,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    const path = `activities/${id}`;
    try {
      await deleteDoc(doc(db, "activities", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // --- Auth UI / Loading State checks ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans select-none">
        <div className="p-8 bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 flex flex-col items-center">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-700 font-bold text-sm">正在載入行程系統...</p>
          <p className="text-[11px] text-slate-400 mt-1">連線安全資料庫中，請稍候</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={() => setCurrentView("dashboard")} />;
  }

  // Define Quick Actions routing triggers
  const handleQuickAddTripTrigger = () => {
    setQuickAddTripTrigger(true);
    setCurrentView("trips");
  };

  const handleQuickAddActivityTrigger = () => {
    setQuickAddActivityTrigger(true);
    setCurrentView("activities");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans">
      {/* Sidebar - Desktop Only */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        userName={userName}
        userEmail={user.email || ""}
      />

      {/* Main Container Layout */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen overflow-hidden">
        {/* Dynamic Responsive Navbar */}
        <Navbar 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          userName={userName}
          userEmail={user.email || ""}
          pageTitle={getPageTitle()}
        />

        {/* Content Section */}
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {currentView === "dashboard" && (
                <Dashboard 
                  trips={trips} 
                  activities={activities} 
                  onQuickAddTrip={handleQuickAddTripTrigger}
                  onQuickAddActivity={handleQuickAddActivityTrigger}
                  onNavigate={setCurrentView}
                />
              )}

              {currentView === "trips" && (
                <TripsManager 
                  trips={trips}
                  onAddTrip={handleAddTrip}
                  onEditTrip={handleEditTrip}
                  onDeleteTrip={handleDeleteTrip}
                  openWithModal={quickAddTripTrigger}
                  setOpenWithModal={setQuickAddTripTrigger}
                />
              )}

              {currentView === "activities" && (
                <ActivitiesManager 
                  activities={activities}
                  trips={trips}
                  onAddActivity={handleAddActivity}
                  onEditActivity={handleEditActivity}
                  onDeleteActivity={handleDeleteActivity}
                  openWithModal={quickAddActivityTrigger}
                  setOpenWithModal={setQuickAddActivityTrigger}
                />
              )}

              {currentView === "profile" && (
                <ProfilePage 
                  userId={user.uid}
                  userEmail={user.email || ""}
                  userName={userName}
                  onProfileUpdated={setUserName}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
