export type TripStatus = "planning" | "ongoing" | "completed";
export type ActivityStatus = "pending" | "completed";

export interface Trip {
  id: string;
  userId: string;
  name: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: TripStatus;
  createdAt?: any;
  updatedAt?: any;
}

export interface Activity {
  id: string;
  userId: string;
  tripId: string;
  tripName?: string; // Cache for display
  name: string;
  date: string;     // YYYY-MM-DD
  time: string;     // HH:MM
  location: string;
  status: ActivityStatus;
  isTransportAccom?: boolean; // Label for transport or accommodation
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  updatedAt?: any;
}
