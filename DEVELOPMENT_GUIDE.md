# HealthFlow Development & Architecture Guide

This document captures the structural decisions, API wiring patterns, and database methodologies we have established. Use this as a reference guide to ensure seamless connections and to maintain the same structural integrity when adding new features.

---

## 1. Project Architecture
The system relies on a monolithic Express backend serving two isolated Next.js frontends:
- **`backend/`**: Node.js + Express + Prisma (PostgreSQL). Serves all APIs.
- **`patient-frontend/`**: Next.js app tailored to patients (booking, profiles, health lockers).
- **`hospital-frontend/`**: Next.js app tailored to hospital staff (admins, doctors, receptionists).

---

## 2. Database & Prisma Patterns (Crucial)

### Dual-Table Identity Model
We strictly separate authentication data from profile data. 
- The `users` table handles authentication (Email, Password Hash, Role).
- Role-specific tables (`patients`, `admins`, `receptionists`, `doctors`) handle domain-specific data and reference the `users` table via `user_id`.
- **Rule for Account Creation:** When creating an account, you must perform a "Dual-Write". Create the credentials in `users`, and immediately create the corresponding profile in the specific role table.

### Auto-Heal Pattern
Because some legacy test accounts were created only in the `users` table without a corresponding profile, we implemented an "Auto-Heal" pattern in the controllers.
- Example (`patient.controller.ts`): When fetching a profile, if `prisma.patients.findFirst` returns null for a valid user, the backend automatically creates a default `patients` record using data from the `users` table before returning the response.

### BigInt Serialization
PostgreSQL uses `BigInt` for primary keys. JavaScript's native JSON stringifier crashes when trying to serialize BigInts.
- **The Fix:** We have a global polyfill at the top of `backend/src/server.ts` that safely serializes all BigInts into strings:
  ```typescript
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
  ```

### Prisma Configuration
- **Environment Variables:** The `.env` file MUST reside solely at the root of `backend/`. Do not create a duplicate `.env` inside `src/prisma/` as it causes fatal conflicts with Prisma Studio.
- **Server Startup:** The backend explicitly loads variables using `import 'dotenv/config'` in `server.ts`.

---

## 3. Frontend to Backend Connection (Axios)

### CORS and Credentials
- The backend relies on a global wildcard CORS policy (`app.use(cors())`), meaning it sets `Access-Control-Allow-Origin: *`.
- Because of this strict browser security rule, the frontend Axios instances **MUST NOT use `withCredentials: true`**. If you enable `withCredentials`, the browser will throw a CORS "Network Error".

### Token Management (Stateless JWT)
- We use stateless JWTs rather than cookies.
- Axios request interceptors automatically read the token from `localStorage` (`healthflow-access-token` or `token`) and inject it into the `Authorization: Bearer <token>` header.
- Responses from the backend always wrap data inside a `data` object (e.g., `res.status(200).json({ data: yourData })`).

---

## 4. API Wiring Workflow

When adding a new feature that connects the frontend to the database, follow this exact top-to-bottom flow:

1. **Backend Controller (`backend/src/controllers/`)**
   - Create your business logic method (e.g., `bookAppointment`).
   - Extract `user` from `(req as any).user` (injected by `authMiddleware`).
   - Query Prisma and return `res.status(code).json({ data: result, message: '...' })`.

2. **Backend Router (`backend/src/routes/`)**
   - Bind the controller method to an Express route.
   - Apply `authMiddleware` if the route requires a logged-in user.

3. **Frontend API Wrapper (`frontend/.../services/api/`)**
   - Create an async function in the relevant API object (e.g., `patientApi.ts`).
   - Call the backend using the configured Axios instance: 
     ```typescript
     const { data } = await axiosInstance.post('/patients/appointments', payload);
     return data.data; // Note the double .data unwrap
     ```

4. **Frontend UI Component (`frontend/app/.../page.tsx`)**
   - Call the API wrapper method from an `async` function.
   - Use a `try/catch` block to handle errors.
   - Implement `isLoading` state to disable buttons during the network request.
   - Ensure you use real data from the API response instead of hardcoded fallback UI strings.

---

## 5. Completed Work Context (For Future Reference)
- **Profile Updates:** Fixed the frontend Profile page to pull real data (`dob`, `phone`, `email`) from the backend, overcoming legacy UI hardcodes.
- **Appointment Booking:** Wired the appointment creation flow. The frontend sends a payload mapping to the `appointments` table schema, saving the data using the logged-in user's `patient_id`, and rendering the real database-generated `appointment_id` on the confirmation screen.
- **Admin/Receptionist Setup:** Configured a secure user record mapped across `users`, `admins`, and `receptionists` tables to test the hospital portal.
