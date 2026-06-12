# Security Spec for 行程規劃系統

## 1. Data Invariants
- **Trip Invariants**:
  - `userId` must equal the authenticated user's ID (`request.auth.uid`).
  - No trip can be created without a name, destination, startDate, endDate, and status.
  - `status` must be one of: `planning`, `ongoing`, `completed`.
- **Activity Invariants**:
  - `userId` must equal the authenticated user's ID.
  - `tripId` must refer to a valid trip document where the trip's `userId` equals the active traveler's ID.
  - No daily activity can be created without a name, location, date, time, and status.
  - `status` must be one of: `pending`, `completed`.
- **UserProfile Invariants**:
  - `userId` (document ID) must equal the authenticated user's ID.
  - Fields such as `userId` are immutable after profile registration.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing - Create Trip under different UID**:
   `{ name: "My Trip", userId: "malicious_user_2" }`
2. **Resource Poisoning - Gigantic Name Trip**:
   `{ name: "A".repeat(50000), userId: "user_1" }`
3. **State Shortcutting - Invalid status on Trip**:
   `{ name: "My Trip", status: "finished_party", userId: "user_1" }`
4. **Orphaned Write - Activity under non-existent Trip**:
   `{ name: "Visit Tower", tripId: "fake_trip_123", userId: "user_1" }`
5. **PII Leakage - Read another private UserProfile**:
   `get(/profiles/victim_user_1)` by `attacker_user_2`
6. **Activity Hijack - Edit someone else's Trip Activity details**:
   `update(/activities/activity_123)` on someone else's trip.
7. **Identity Spoofing - Register Profile with other User ID**:
   `{ name: "Attacker", userId: "victim_user_id" }`
8. **Null Date poisoning**:
   `{ name: "My Trip", startDate: null, userId: "user_1" }`
9. **No Key Strictness Shadow Fields injection**:
   `{ name: "My Trip", isVerifiedAdmin: true, userId: "user_1" }`
10. **Array Overloading Attack**:
    `{ name: "My Trip", tags: ["A".repeat(100), "B".repeat(100), ... x100] }`
11. **Spoofed Email Access Bypass**:
    Access profiles while `request.auth.token.email_verified == false` yet matching a target email.
12. **Temporal Tampering**:
    Provide client-side arbitrary past timestamp for `createdAt` metadata.

## 3. Test Runner Design (Mock Firestore rules test representation)
```typescript
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

// Test that user cannot read another user's Trip
await assertFails(db.collection('trips').doc('trip_of_user_1').get({ auth: { uid: 'user_2' } }));

// Test that user cannot create trip with another uid
await assertFails(db.collection('trips').add({ name: "Malicious Trip", userId: "user_1" }, { auth: { uid: 'user_2' } }));
```
