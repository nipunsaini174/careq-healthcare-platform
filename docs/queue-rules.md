# 🏥 Hospital Dynamic Queue & AI Follow-Up Rules Engine

## 1. ⏱️ Real-Time Dynamic Appointment & Cascading Consultation Engine

### A. Dynamic Time Baseline
* Consultations are scheduled dynamically starting from the **current real-time clock** (e.g. `4:29 PM` $\rightarrow$ Patient #1 slot: `4:29 PM – 4:44 PM`).
* **Standard Consultation Duration**: **15 Minutes** per patient.

### B. Cascading Early Checkout (Time Surplus Deduction)
* If a patient completes consultation early (e.g. in **10 minutes** instead of 15 minutes $\rightarrow$ **5-minute surplus**):
  - **$\Delta = +5$ mins**: The system immediately cascades forward.
  - Patient #2's estimated start time is pulled forward by **5 minutes** (e.g. from `4:44 PM` to `4:39 PM`).
  - All subsequent waiting patients receive a **5-minute reduction** in total estimated wait time.
  - Broadcasted via WebSocket `schedule_cascaded` and `queue_updated`.

### C. Cascading Consultation Delay (Time Addition)
* If a complex consultation takes longer (e.g. **20 minutes** $\rightarrow$ **5-minute delay**):
  - **$\Delta = -5$ mins**: The system dynamically pushes upcoming slots back by **5 minutes**.
  - Prevents queue congestion and gives waiting patients accurate live ETAs on their mobile portal.

---

## 2. 🧠 AI-Powered Follow-up Intelligence & Care Continuity Platform

### A. Clinical Dataset Model (500 Patient Records)
Trained on 500 clinical follow-up records across 5 primary conditions:
* **Diagnoses**: `Diabetes`, `Hypertension`, `Migraine`, `Asthma`, `Thyroid Disorder`
* **Test Metrics**: `HbA1c`, `Systolic BP`, `Pain Score`, `PEF`, `TSH`
* **Clinical Factors**: `Severity` (Low/Mod/High), `Test Abnormal` (Yes/No), `Medication Changed` (Yes/No), `Previous Missed Follow-up` (Yes/No), `Past Visits Count`.

### B. 🎯 Actionable AI Workflow (Human-in-the-Loop)
The system converts AI analysis directly into staff actions:
$$\text{Patient Profile} \longrightarrow \text{Risk Priority Score (0–100)} \longrightarrow \text{Clinical Reason} \longrightarrow \text{Receptionist Action} \longrightarrow \text{Status Tracking}$$

| Recommended Interval | Priority Tier | Score Range | Example Trigger | Action Workflow |
| :--- | :--- | :--- | :--- | :--- |
| **`3_DAYS`** | 🔴 **CRITICAL** | **85 – 99** | Abnormal Test + Medication Change + Prior Missed Followup | 🚨 **URGENT**: Receptionist calls patient immediately to book priority slot & prep lab orders. |
| **`7_DAYS`** | 🟡 **HIGH** | **60 – 84** | Abnormal Test or Rx Adjustment | 📞 **HIGH**: Phone/WhatsApp outreach to verify drug tolerability & book 7-day review. |
| **`14_DAYS`** | 🔵 **MEDIUM** | **35 – 59** | Moderate severity, stable parameters | 📲 Automated SMS follow-up booking link sent. |
| **`30_DAYS`** | 🟢 **LOW** | **10 – 34** | Controlled condition, high adherence | Standard monthly routine maintenance check-up. |

---

## 3. 🌐 API Endpoints

* `GET /api/retention/followup-intelligence` — Returns the AI-evaluated patient queue with priority rankings.
* `POST /api/retention/predict-followup` — Real-time follow-up interval predictor for any clinical inputs.
* `POST /api/retention/action-followup` — Receptionist logs call outreach, slot booking, or WhatsApp contact.
* `GET /api/queue/doctor` — Retrieves dynamic cascading queue slots and remaining wait times.
