import { prisma } from '../prisma/client.js';
import { safeEmit } from '../sockets/emit.js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'model';
  content: string;
}

export interface AiChatContext {
  userId: number;
  role: string;
  hospitalId: number;
  email?: string;
  patientId?: number;
}

export interface AppointmentActionData {
  appointmentId: string;
  tokenCode: string;
  doctorName: string;
  department: string;
  appointmentDate: string;
  timeSlot: string;
  queuePosition: number;
  estimatedWaitTime: number;
  status: string;
}

export interface AiChatResult {
  reply: string;
  actionType?: 'APPOINTMENT_BOOKED' | 'APPOINTMENT_CANCELLED' | 'RECORDS_RETRIEVED' | 'DOCTORS_LISTED';
  actionData?: any;
}

export class AiService {
  private geminiApiKey: string = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

  // -------------------------------------------------------------
  // Data Grounder: Fetch logged-in Patient Records & Full History
  // -------------------------------------------------------------
  async getPatientRecords(userId: number, hospitalId: number) {
    try {
      const patient = await prisma.patients.findFirst({
        where: {
          OR: [
            { user_id: userId },
            { patient_id: userId }
          ]
        },
        include: {
          patient_profiles: true,
        }
      });

      if (!patient) {
        return {
          found: false,
          message: 'No patient record linked to this account.',
        };
      }

      // Fetch appointments
      const appointments = await prisma.appointments.findMany({
        where: { patient_id: patient.patient_id },
        include: {
          doctors: {
            include: {
              users: true,
              departments: true,
            }
          },
          queue_tokens: true,
        },
        orderBy: { appointment_date: 'desc' },
        take: 15,
      });

      // Fetch active tokens
      const activeTokens = await prisma.queue_tokens.findMany({
        where: {
          patient_id: patient.patient_id,
          token_status: { in: ['Scheduled', 'Waiting', 'IN_PROGRESS', 'WAITING', 'In_Progress'] }
        },
        include: {
          doctors: {
            include: { users: true, departments: true }
          }
        },
        orderBy: { queue_position: 'asc' }
      });

      // Fetch lab reports
      const labReports = await prisma.lab_reports.findMany({
        where: { patient_id: patient.patient_id },
        orderBy: { uploaded_at: 'desc' },
        take: 8,
      });

      // Fetch treatment journeys (chronic care / disease adherence)
      const journeys = await prisma.treatment_journeys.findMany({
        where: { patient_id: patient.patient_id },
        include: { diseases: true },
        take: 5,
      });

      // Fetch billing invoices
      const invoices = await prisma.billing_invoices.findMany({
        where: { patient_id: patient.patient_id },
        orderBy: { invoice_date: 'desc' },
        take: 5,
      });

      const upcoming = appointments.filter(a => 
        ['Upcoming', 'Confirmed', 'CONFIRMED', 'Scheduled', 'WAITING', 'Waiting'].includes(a.appointment_status)
      );

      const past = appointments.filter(a => 
        ['Completed', 'COMPLETED', 'Done', 'Cancelled', 'CANCELLED'].includes(a.appointment_status)
      );

      // Latest appointment with pre-consultation / intake data
      const latestApptWithIntake = appointments.find(a => (a as any).chief_complaint || (a as any).symptoms || (a as any).days_since_last_visit !== null) || appointments[0];

      // Calculate days since last completed hospital visit
      const completedVisits = past.filter(a => ['Completed', 'COMPLETED', 'Done'].includes(a.appointment_status));
      let calculatedDaysSinceLastVisit: number | null = null;
      let lastVisitDateFormatted: string | null = null;
      let lastVisitDoctor: string | null = null;

      if (completedVisits.length > 0 && completedVisits[0]) {
        const lastAppt = completedVisits[0];
        const diffMs = Date.now() - new Date(lastAppt.appointment_date).getTime();
        calculatedDaysSinceLastVisit = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        lastVisitDateFormatted = lastAppt.appointment_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const docName = lastAppt.doctors?.users?.full_name;
        lastVisitDoctor = docName ? (docName.startsWith('Dr.') ? docName : `Dr. ${docName}`) : 'Doctor';
      }

      // Check if patient provided days in booking intake form
      const reportedDays = (latestApptWithIntake as any)?.days_since_last_visit ?? null;
      const isFirstVisitReported = (latestApptWithIntake as any)?.is_first_visit ?? (completedVisits.length === 0 && reportedDays === null);
      const effectiveDaysSinceLastVisit = reportedDays !== null ? reportedDays : calculatedDaysSinceLastVisit;

      let visitHistorySummary = '';
      if (isFirstVisitReported) {
        visitHistorySummary = 'First-time patient at Sanjeevani Hospital (No prior hospital consultations on record).';
      } else if (effectiveDaysSinceLastVisit !== null) {
        visitHistorySummary = `Patient last visited the hospital ${effectiveDaysSinceLastVisit} day(s) ago` + 
          (lastVisitDateFormatted ? ` (Previous consultation on ${lastVisitDateFormatted} with ${lastVisitDoctor}).` : ` based on appointment intake submission.`);
      } else {
        visitHistorySummary = 'Follow-up patient (Periodic checkup).';
      }

      const intakeData = latestApptWithIntake ? {
        hasIntakeForm: Boolean((latestApptWithIntake as any).chief_complaint || (latestApptWithIntake as any).symptoms),
        appointmentId: `APT-${latestApptWithIntake.appointment_id}`,
        doctorName: latestApptWithIntake.doctors?.users?.full_name ? (latestApptWithIntake.doctors.users.full_name.startsWith('Dr.') ? latestApptWithIntake.doctors.users.full_name : `Dr. ${latestApptWithIntake.doctors.users.full_name}`) : 'Assigned Doctor',
        department: latestApptWithIntake.doctors?.departments?.department_name || 'General',
        chiefComplaint: (latestApptWithIntake as any).chief_complaint || 'General Consultation / Health Checkup',
        symptoms: (latestApptWithIntake as any).symptoms || 'None specified',
        symptomsDuration: (latestApptWithIntake as any).symptoms_duration || 'Not specified',
        severity: (latestApptWithIntake as any).severity || 'Moderate',
        isFirstVisit: isFirstVisitReported,
        daysSinceLastVisit: effectiveDaysSinceLastVisit,
        currentMedications: (latestApptWithIntake as any).current_medications || 'None reported',
        medicalHistory: (latestApptWithIntake as any).medical_history || 'No chronic history reported',
        allergies: (latestApptWithIntake as any).allergies || 'No known allergies',
        intakeNotes: (latestApptWithIntake as any).intake_notes || '',
        visitHistorySummary,
      } : null;

      return {
        found: true,
        patient: {
          patientId: patient.patient_id,
          uhid: patient.uhid,
          abhaId: patient.abha_id || 'Not Linked',
          name: patient.full_name,
          age: patient.age,
          gender: patient.gender,
          bloodGroup: patient.blood_group,
          phone: patient.phone || 'N/A',
          email: patient.email || 'N/A',
          billingStatus: patient.billing_status,
          patientStatus: patient.patient_status,
          familyProfiles: patient.patient_profiles.map(p => ({
            name: p.full_name,
            relationship: p.relationship,
            age: p.age,
            gender: p.gender,
          }))
        },
        intakeForm: intakeData,
        visitHistorySummary,
        daysSinceLastVisit: effectiveDaysSinceLastVisit,
        isFirstVisit: isFirstVisitReported,
        upcomingAppointments: upcoming.map(a => ({
          appointmentId: `APT-${a.appointment_id}`,
          rawId: a.appointment_id,
          doctorName: a.doctors?.users?.full_name ? (a.doctors.users.full_name.startsWith('Dr.') ? a.doctors.users.full_name : `Dr. ${a.doctors.users.full_name}`) : 'Dr. Assigned',
          specialization: a.doctors?.specialization || 'General',
          department: a.doctors?.departments?.department_name || 'General',
          opd: a.doctors?.opd || 'OPD-1',
          date: a.appointment_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: a.appointment_date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: a.appointment_status,
          chiefComplaint: (a as any).chief_complaint,
          symptoms: (a as any).symptoms,
          symptomsDuration: (a as any).symptoms_duration,
          severity: (a as any).severity,
          daysSinceLastVisit: (a as any).days_since_last_visit,
          currentMedications: (a as any).current_medications,
          medicalHistory: (a as any).medical_history,
          allergies: (a as any).allergies,
          tokenCode: a.queue_tokens?.token_code || `T${a.appointment_id}`,
          queuePosition: a.queue_tokens?.queue_position || 1,
          estimatedWaitTime: a.queue_tokens?.estimated_wait_time ?? 15,
        })),
        pastAppointments: past.map(a => ({
          appointmentId: `APT-${a.appointment_id}`,
          doctorName: a.doctors?.users?.full_name || 'Doctor',
          department: a.doctors?.departments?.department_name || 'General',
          date: a.appointment_date.toLocaleDateString(),
          status: a.appointment_status,
          chiefComplaint: (a as any).chief_complaint,
        })),
        activeTokens: activeTokens.map(t => ({
          tokenCode: t.token_code,
          doctorName: t.doctors?.users?.full_name ? (t.doctors.users.full_name.startsWith('Dr.') ? t.doctors.users.full_name : `Dr. ${t.doctors.users.full_name}`) : 'Doctor',
          department: t.doctors?.departments?.department_name || 'General',
          opd: t.doctors?.opd || 'OPD-1',
          queuePosition: t.queue_position,
          estimatedWaitTime: t.estimated_wait_time,
          status: t.token_status,
        })),
        labReportsCount: labReports.length,
        labReports: labReports.map(r => ({
          id: r.report_id,
          reportName: r.report_name,
          reportType: r.report_type,
          status: r.report_status,
          date: r.uploaded_at.toLocaleDateString(),
        })),
        treatmentJourneys: journeys.map(j => ({
          disease: j.diseases?.disease_name || 'Chronic Care',
          adherenceScore: j.adherence_score,
          status: j.status,
          nextFollowup: j.next_followup_date ? j.next_followup_date.toLocaleDateString() : 'None Scheduled',
          missedVisits: j.missed_appointments,
        })),
        billingInvoices: invoices.map(inv => ({
          invoiceId: `INV-${inv.invoice_id}`,
          amount: inv.amount,
          status: inv.payment_status,
          date: inv.invoice_date.toLocaleDateString(),
        })),
      };
    } catch (error: any) {
      console.error('[AiService.getPatientRecords]', error);
      return { found: false, error: error.message };
    }
  }

  // -------------------------------------------------------------
  // Data Grounder: Staff EMR/EHR Search for Any Patient
  // -------------------------------------------------------------
  async searchPatientRecords(hospitalId: number, query: string) {
    try {
      const q = query.trim();
      const patients = await prisma.patients.findMany({
        where: {
          hospital_id: hospitalId,
          OR: [
            { uhid: { contains: q } },
            { full_name: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
            { abha_id: { contains: q } },
          ]
        },
        include: {
          appointments: {
            include: {
              doctors: { include: { users: true, departments: true } },
              queue_tokens: true,
            },
            orderBy: { appointment_date: 'desc' },
            take: 5,
          },
          consultations: {
            include: { doctors: { include: { users: true } } },
            orderBy: { start_time: 'desc' },
            take: 3,
          },
          treatment_journeys: {
            include: { diseases: true, risk_assessments: true },
            take: 3,
          },
          lab_reports: {
            take: 5,
            orderBy: { uploaded_at: 'desc' }
          },
          billing_invoices: {
            take: 3,
            orderBy: { invoice_date: 'desc' }
          }
        },
        take: 6,
      });

      if (!patients || patients.length === 0) {
        return { found: false, message: `No patient found matching "${query}".` };
      }

      return {
        found: true,
        count: patients.length,
        patients: patients.map(p => ({
          patientId: p.patient_id,
          uhid: p.uhid,
          abhaId: p.abha_id || 'Not linked',
          name: p.full_name,
          age: p.age,
          gender: p.gender,
          bloodGroup: p.blood_group,
          phone: p.phone || 'N/A',
          email: p.email || 'N/A',
          billingStatus: p.billing_status,
          status: p.patient_status,
          recentAppointments: p.appointments.map(a => ({
            id: `APT-${a.appointment_id}`,
            date: a.appointment_date.toLocaleDateString(),
            time: a.appointment_date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            doctor: a.doctors?.users?.full_name ? (a.doctors.users.full_name.startsWith('Dr.') ? a.doctors.users.full_name : `Dr. ${a.doctors.users.full_name}`) : 'Doctor',
            department: a.doctors?.departments?.department_name || 'General',
            status: a.appointment_status,
            token: a.queue_tokens?.token_code || null,
            chiefComplaint: (a as any).chief_complaint,
            symptoms: (a as any).symptoms,
            symptomsDuration: (a as any).symptoms_duration,
            severity: (a as any).severity,
            daysSinceLastVisit: (a as any).days_since_last_visit,
            medications: (a as any).current_medications,
            allergies: (a as any).allergies,
          })),
          recentConsultations: p.consultations.map(c => ({
            id: c.consultation_id,
            reason: c.reason_for_visit,
            alerts: c.clinical_alerts,
            notes: c.consultation_notes,
            doctor: c.doctors?.users?.full_name || 'Doctor',
            date: c.start_time.toLocaleDateString(),
          })),
          activeJourneys: p.treatment_journeys.map(j => ({
            disease: j.diseases?.disease_name || 'Care Plan',
            adherenceScore: j.adherence_score,
            status: j.status,
            riskScore: j.risk_assessments?.[0]?.risk_score || 15,
            riskLevel: j.risk_assessments?.[0]?.risk_level || 'Low',
          })),
          labReports: p.lab_reports.map(lr => ({
            name: lr.report_name,
            type: lr.report_type,
            status: lr.report_status,
            date: lr.uploaded_at.toLocaleDateString(),
          })),
          billing: p.billing_invoices.map(b => ({
            invoiceId: `INV-${b.invoice_id}`,
            amount: b.amount,
            status: b.payment_status,
          }))
        }))
      };
    } catch (error: any) {
      console.error('[AiService.searchPatientRecords]', error);
      return { found: false, error: error.message };
    }
  }

  // -------------------------------------------------------------
  // Data Grounder: Real-Time Token Journey & Department Tracker
  // -------------------------------------------------------------
  async lookupTokenJourney(hospitalId: number, queryParam: string) {
    try {
      const cleanNumeric = queryParam.replace(/^(APT-|T-|T|A-|P-|PT-|UHID-)/i, '');
      const numId = Number(cleanNumeric);

      let token: any = await prisma.queue_tokens.findFirst({
        where: {
          hospital_id: hospitalId,
          OR: [
            { token_code: queryParam },
            { token_code: queryParam.toUpperCase() },
            { token_code: queryParam.toLowerCase() },
          ]
        },
        include: {
          patients: true,
          doctors: { include: { users: true, departments: true } },
          appointments: true,
        }
      });

      if (!token && !isNaN(numId) && numId > 0) {
        token = await prisma.queue_tokens.findFirst({
          where: {
            hospital_id: hospitalId,
            OR: [
              { token_id: numId },
              { appointment_id: numId },
              { token_code: `A-${String(numId).padStart(3, '0')}` },
              { token_code: `A-${numId}` },
              { token_code: `T${numId}` },
              { token_code: `T-${numId}` },
              { token_code: `A${numId}` },
            ]
          },
          include: {
            patients: true,
            doctors: { include: { users: true, departments: true } },
            appointments: true,
          },
          orderBy: { token_id: 'desc' }
        });
      }

      if (!token) {
        const pat = await prisma.patients.findFirst({
          where: {
            hospital_id: hospitalId,
            OR: [
              { full_name: { contains: queryParam } },
              { uhid: queryParam },
              { phone: { contains: queryParam } },
            ]
          },
          include: {
            queue_tokens: {
              include: {
                doctors: { include: { users: true, departments: true } },
                appointments: true,
              },
              orderBy: { token_id: 'desc' }
            }
          }
        });
        if (pat && pat.queue_tokens.length > 0) {
          token = { ...pat.queue_tokens[0], patients: pat } as any;
        }
      }

      if (!token) return null;

      const pat = token.patients;
      const doc = token.doctors;
      const rawDocName = doc?.users?.full_name || doc?.specialization || 'Doctor';
      const docName = rawDocName.startsWith('Dr.') ? rawDocName : `Dr. ${rawDocName}`;
      const dept = doc?.departments?.department_name || doc?.specialization || 'OPD';
      const room = doc?.room || doc?.opd || 'Room 104 (2nd Floor)';
      const status = (token.token_status || '').toUpperCase();

      return {
        tokenCode: token.token_code,
        tokenId: String(token.token_id),
        patientName: pat?.full_name || 'Patient',
        patientUhid: pat?.uhid || `UHID-${token.patient_id}`,
        doctorName: docName,
        department: dept,
        room,
        status: token.token_status,
        queuePosition: token.queue_position || 1,
        estimatedWaitTime: token.estimated_wait_time || 15,
        isCompleted: status === 'COMPLETED' || status === 'DONE',
        isInConsultation: status === 'IN_PROGRESS' || status === 'SERVING',
        isWaiting: status === 'WAITING' || status === 'SCHEDULED',
      };
    } catch (err) {
      console.error('[AiService.lookupTokenJourney]', err);
      return null;
    }
  }

  // -------------------------------------------------------------
  // Data Grounder: List Doctors and Departments
  // -------------------------------------------------------------
  async listDoctorsAndDepartments(hospitalId: number) {
    try {
      const doctors = await prisma.doctors.findMany({
        where: { hospital_id: hospitalId },
        include: {
          users: true,
          departments: true,
        },
      });

      const departments = await prisma.departments.findMany({
        where: { hospital_id: hospitalId },
      });

      return {
        departments: departments.map(d => ({
          id: d.department_id,
          name: d.department_name,
          location: d.location,
          dailyCapacity: d.daily_capacity,
        })),
        doctors: doctors.map(doc => ({
          doctorId: doc.doctor_id,
          name: doc.users?.full_name ? (doc.users.full_name.startsWith('Dr.') ? doc.users.full_name : `Dr. ${doc.users.full_name}`) : 'Doctor',
          specialization: doc.specialization,
          department: doc.departments?.department_name || 'General',
          departmentId: doc.department_id,
          qualification: doc.qualification,
          experience: `${doc.experience_years} years`,
          rating: doc.rating,
          opd: doc.opd || 'OPD-1',
          schedule: doc.schedule || '09:00 AM - 05:00 PM',
          status: doc.availability_status,
          bio: doc.bio || `${doc.specialization} specialist with ${doc.experience_years} years clinical experience.`,
        }))
      };
    } catch (error: any) {
      console.error('[AiService.listDoctorsAndDepartments]', error);
      return { departments: [], doctors: [] };
    }
  }

  // -------------------------------------------------------------
  // Data Grounder: Real-Time Hospital Queue Summary (Doctor/Staff View)
  // -------------------------------------------------------------
  async getHospitalQueueSummary(hospitalId: number) {
    try {
      const activeTokens = await prisma.queue_tokens.findMany({
        where: {
          hospital_id: hospitalId,
          token_status: { in: ['Scheduled', 'Waiting', 'IN_PROGRESS', 'WAITING', 'In_Progress'] }
        },
        include: {
          doctors: { include: { users: true, departments: true } },
          patients: true,
        },
        orderBy: { queue_position: 'asc' }
      });

      const completedCount = await prisma.queue_tokens.count({
        where: {
          hospital_id: hospitalId,
          token_status: { in: ['Completed', 'COMPLETED', 'Done'] }
        }
      });

      const inProgress = activeTokens.filter(t => ['IN_PROGRESS', 'In_Progress'].includes(t.token_status));
      const waiting = activeTokens.filter(t => ['Waiting', 'WAITING', 'Scheduled'].includes(t.token_status));

      const doctorQueueMap: Record<string, { doctorName: string; department: string; opd: string; inProgress: string | null; waitingCount: number; tokens: string[] }> = {};

      for (const t of activeTokens) {
        const docName = t.doctors?.users?.full_name || 'Assigned Doctor';
        if (!doctorQueueMap[docName]) {
          doctorQueueMap[docName] = {
            doctorName: docName,
            department: t.doctors?.departments?.department_name || 'General',
            opd: t.doctors?.opd || 'OPD-1',
            inProgress: null,
            waitingCount: 0,
            tokens: []
          };
        }

        if (['IN_PROGRESS', 'In_Progress'].includes(t.token_status)) {
          doctorQueueMap[docName].inProgress = `${t.token_code} (${t.patients?.full_name || 'Patient'})`;
        } else {
          doctorQueueMap[docName].waitingCount++;
          doctorQueueMap[docName].tokens.push(t.token_code);
        }
      }

      return {
        totalActive: activeTokens.length,
        totalWaiting: waiting.length,
        totalInProgress: inProgress.length,
        totalCompletedToday: completedCount,
        doctorQueues: Object.values(doctorQueueMap),
      };
    } catch (error: any) {
      console.error('[AiService.getHospitalQueueSummary]', error);
      return { totalActive: 0, totalWaiting: 0, totalInProgress: 0, totalCompletedToday: 0, doctorQueues: [] };
    }
  }

  // -------------------------------------------------------------
  // Data Grounder: Lab Reports Overview (Staff / Doctor View)
  // -------------------------------------------------------------
  async getLabReportsOverview(hospitalId: number) {
    try {
      const reports = await prisma.lab_reports.findMany({
        where: { hospital_id: hospitalId },
        include: {
          patients: true,
          doctors: { include: { users: true } },
        },
        orderBy: { uploaded_at: 'desc' },
        take: 10,
      });

      const pendingReview = reports.filter(r => r.report_status === 'Uploaded' || r.report_status === 'Pending_Review');
      const reviewed = reports.filter(r => r.report_status === 'Reviewed' || r.report_status === 'Completed');

      return {
        totalReports: reports.length,
        pendingReviewCount: pendingReview.length,
        reviewedCount: reviewed.length,
        recentReports: reports.map(r => ({
          reportId: r.report_id,
          patientName: r.patients?.full_name || 'Patient',
          uhid: r.patients?.uhid || 'N/A',
          doctorName: r.doctors?.users?.full_name || 'Doctor',
          reportName: r.report_name,
          type: r.report_type,
          status: r.report_status,
          date: r.uploaded_at.toLocaleDateString(),
        }))
      };
    } catch (error: any) {
      console.error('[AiService.getLabReportsOverview]', error);
      return { totalReports: 0, pendingReviewCount: 0, reviewedCount: 0, recentReports: [] };
    }
  }

  // -------------------------------------------------------------
  // Data Grounder: Chronic Journeys & Retention Analytics (Staff View)
  // -------------------------------------------------------------
  async getRetentionAnalytics(hospitalId: number) {
    try {
      const { aiFollowupService } = await import('./aiFollowup.service.js');
      const intelligence = await aiFollowupService.getFollowupIntelligenceList(hospitalId);

      const highRisk = intelligence.patients.filter(p => p.priorityTier === 'CRITICAL' || p.priorityTier === 'HIGH' || p.isCallRecommended);

      return {
        totalJourneys: intelligence.summary.totalEvaluated,
        highRiskCount: intelligence.summary.criticalCount + intelligence.summary.highCount,
        urgentCallsNeeded: intelligence.summary.urgentCallsNeeded,
        criticalPatients: highRisk.slice(0, 10).map(p => ({
          patientName: p.patientName,
          uhid: p.uhid,
          phone: p.phone,
          disease: p.diagnosis,
          chiefComplaint: p.chiefComplaint,
          severity: p.severity,
          daysSinceLastVisit: p.daysSinceLastVisit,
          riskLevel: p.priorityTier,
          priorityScore: p.priorityScore,
          recommendedAction: p.doctorAlert || p.receptionistAction,
          isCallRecommended: p.isCallRecommended,
          clinicalReason: p.clinicalReason,
        }))
      };
    } catch (error: any) {
      console.error('[AiService.getRetentionAnalytics]', error);
      return { totalJourneys: 0, highRiskCount: 0, urgentCallsNeeded: 0, criticalPatients: [] };
    }
  }

  // -------------------------------------------------------------
  // Tool: Book Appointment via AI
  // -------------------------------------------------------------
  async bookAppointment(context: AiChatContext, params: {
    doctorId?: number | string;
    doctorName?: string;
    departmentName?: string;
    patientName?: string;
    appointmentDate?: string;
    reason?: string;
  }) {
    try {
      const hospitalId = context.hospitalId || 1;

      // 1. Resolve Patient
      let patient = await prisma.patients.findFirst({
        where: {
          OR: [
            { user_id: context.userId },
            { patient_id: context.patientId || context.userId }
          ]
        }
      });

      if (!patient) {
        const user = await prisma.users.findUnique({ where: { user_id: context.userId } });
        patient = await prisma.patients.create({
          data: {
            user_id: user?.user_id || context.userId,
            hospital_id: hospitalId,
            uhid: `UHID-${Date.now().toString().slice(-6)}`,
            full_name: params.patientName || user?.full_name || 'Patient User',
            age: 30,
            gender: 'Not Specified',
            blood_group: 'Unknown',
            billing_status: 'Unpaid',
            patient_status: 'Active',
            email: user?.email || context.email || null,
          }
        });
      }

      // 2. Resolve Doctor
      let targetDoctor: any = null;
      if (params.doctorId) {
        const cleanId = Number(String(params.doctorId).replace(/\D/g, ''));
        targetDoctor = await prisma.doctors.findUnique({
          where: { doctor_id: cleanId },
          include: { users: true, departments: true }
        });
      }

      if (!targetDoctor && params.doctorName) {
        const nameQuery = params.doctorName.replace(/^Dr\.?\s*/i, '').trim();
        targetDoctor = await prisma.doctors.findFirst({
          where: {
            hospital_id: hospitalId,
            users: { full_name: { contains: nameQuery } }
          },
          include: { users: true, departments: true }
        });
      }

      if (!targetDoctor && params.departmentName) {
        const deptQuery = params.departmentName.trim();
        targetDoctor = await prisma.doctors.findFirst({
          where: {
            hospital_id: hospitalId,
            departments: { department_name: { contains: deptQuery } }
          },
          include: { users: true, departments: true }
        });
      }

      if (!targetDoctor) {
        targetDoctor = await prisma.doctors.findFirst({
          where: { hospital_id: hospitalId },
          include: { users: true, departments: true }
        });
      }

      if (!targetDoctor) {
        return {
          success: false,
          error: 'No active doctor found in the hospital to schedule with.'
        };
      }

      // 3. Calculate Date and Slot
      let targetDate = new Date();
      if (params.appointmentDate) {
        const parsed = new Date(params.appointmentDate);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
        }
      } else {
        if (targetDate.getHours() >= 17) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
        targetDate.setHours(10, 0, 0, 0);
      }

      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1, 0, 0, 0);

      const existingCount = await prisma.appointments.count({
        where: {
          doctor_id: targetDoctor.doctor_id,
          appointment_status: { notIn: ['Cancelled', 'CANCELLED'] },
          appointment_date: { gte: startOfDay, lt: endOfDay }
        }
      });

      const slotOffsetMinutes = existingCount * 15;
      const scheduledDate = new Date(targetDate.getTime() + slotOffsetMinutes * 60 * 1000);

      const existingActiveTokens = await prisma.queue_tokens.count({
        where: {
          doctor_id: targetDoctor.doctor_id,
          token_status: { in: ['Scheduled', 'Waiting', 'IN_PROGRESS', 'WAITING', 'In_Progress'] }
        }
      });

      const queuePosition = existingActiveTokens + 1;
      const estimatedWaitTime = existingActiveTokens * 15;

      // 4. Create in DB transaction
      const [appointment, token] = await prisma.$transaction(async (tx) => {
        const appt = await tx.appointments.create({
          data: {
            patient_id: patient!.patient_id,
            doctor_id: targetDoctor.doctor_id,
            hospital_id: hospitalId,
            appointment_date: scheduledDate,
            appointment_type: params.reason || 'OPD Consultation',
            appointment_status: 'Upcoming',
          }
        });

        const tok = await tx.queue_tokens.create({
          data: {
            patient_id: patient!.patient_id,
            doctor_id: targetDoctor.doctor_id,
            hospital_id: hospitalId,
            appointment_id: appt.appointment_id,
            token_code: `T${appt.appointment_id.toString()}`,
            token_type: 'OPD',
            queue_position: queuePosition,
            priority_score: 10,
            token_status: 'Scheduled',
            check_in_time: scheduledDate,
            estimated_wait_time: estimatedWaitTime,
          }
        });

        return [appt, tok];
      });

      const doctorDisplayName = targetDoctor.users?.full_name
        ? (targetDoctor.users.full_name.startsWith('Dr.') ? targetDoctor.users.full_name : `Dr. ${targetDoctor.users.full_name}`)
        : 'Doctor';

      const timeFormatted = scheduledDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const dateFormatted = scheduledDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const eventPayload = {
        appointmentId: appointment.appointment_id.toString(),
        patientId: patient.patient_id.toString(),
        doctorId: targetDoctor.doctor_id.toString(),
        hospitalId: hospitalId.toString(),
        appointmentDate: scheduledDate.toISOString(),
        appointmentStatus: appointment.appointment_status,
        appointmentType: appointment.appointment_type,
        patientName: patient.full_name,
        doctorName: doctorDisplayName,
        department: targetDoctor.departments?.department_name || 'General',
        tokenId: token.token_id.toString(),
        tokenCode: token.token_code,
        queuePosition: queuePosition,
        tokenStatus: token.token_status,
        createdAt: new Date().toISOString(),
      };

      safeEmit('appointment_created', eventPayload);
      safeEmit('queue_updated', {
        hospitalId: hospitalId.toString(),
        reason: 'ai_token_created',
        tokenId: token.token_id.toString(),
      });

      const actionData: AppointmentActionData = {
        appointmentId: `APT-${appointment.appointment_id}`,
        tokenCode: token.token_code,
        doctorName: doctorDisplayName,
        department: targetDoctor.departments?.department_name || 'General',
        appointmentDate: dateFormatted,
        timeSlot: timeFormatted,
        queuePosition: queuePosition,
        estimatedWaitTime: estimatedWaitTime,
        status: 'Confirmed',
      };

      return {
        success: true,
        message: `Appointment successfully booked with ${doctorDisplayName} (${actionData.department}) on ${dateFormatted} at ${timeFormatted}. Your Token is ${actionData.tokenCode}, queue position #${queuePosition}.`,
        appointment: actionData,
      };
    } catch (error: any) {
      console.error('[AiService.bookAppointment]', error);
      return {
        success: false,
        error: error.message || 'Failed to book appointment'
      };
    }
  }

  // -------------------------------------------------------------
  // Tool: Cancel Appointment
  // -------------------------------------------------------------
  async cancelAppointment(appointmentIdStr: string, context: AiChatContext) {
    try {
      const cleanNumeric = appointmentIdStr.replace(/^APT-/i, '');
      const apptId = Number(cleanNumeric);
      if (isNaN(apptId)) {
        return { success: false, error: 'Invalid appointment ID format' };
      }

      const appt = await prisma.appointments.findUnique({
        where: { appointment_id: apptId },
        include: { doctors: { include: { users: true } }, patients: true }
      });

      if (!appt) {
        return { success: false, error: `Appointment #${appointmentIdStr} not found.` };
      }

      await prisma.$transaction([
        prisma.appointments.update({
          where: { appointment_id: apptId },
          data: { appointment_status: 'Cancelled' }
        }),
        prisma.queue_tokens.updateMany({
          where: { appointment_id: apptId },
          data: { token_status: 'Cancelled' }
        })
      ]);

      safeEmit('appointment_updated', {
        appointmentId: appt.appointment_id.toString(),
        appointmentStatus: 'Cancelled',
        hospitalId: appt.hospital_id.toString(),
      });
      safeEmit('queue_updated', {
        hospitalId: appt.hospital_id.toString(),
        reason: 'token_cancelled',
      });

      return {
        success: true,
        message: `Appointment ${appointmentIdStr} with ${appt.doctors?.users?.full_name || 'doctor'} has been cancelled.`
      };
    } catch (error: any) {
      console.error('[AiService.cancelAppointment]', error);
      return { success: false, error: error.message };
    }
  }

  // -------------------------------------------------------------
  // Main Router: Delegates to Patient or Staff Expert Mode
  // -------------------------------------------------------------
  async processChat(context: AiChatContext, messages: ChatMessage[]): Promise<AiChatResult> {
    const isStaff = context.role === 'admin' || context.role === 'doctor' || context.role === 'receptionist';

    // If Gemini API Key is configured, attempt dynamic context-grounded LLM inference
    if (this.geminiApiKey) {
      try {
        const geminiResult = await this.callGeminiWithFullContext(context, messages, isStaff);
        if (geminiResult) {
          return geminiResult;
        }
      } catch (err) {
        console.warn('[AiService] Gemini API call failed, falling back to comprehensive heuristic engine:', err);
      }
    }

    // Comprehensive Fallback & Grounded Knowledge Engine
    if (isStaff) {
      return this.processStaffChat(context, messages);
    } else {
      return this.processPatientChat(context, messages);
    }
  }

  // -------------------------------------------------------------
  // PATIENT AI ENGINE: Full Coverage of All Patient Needs
  // -------------------------------------------------------------
  private async processPatientChat(context: AiChatContext, messages: ChatMessage[]): Promise<AiChatResult> {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const lower = lastUserMessage.toLowerCase();

    // ---------------------------------------------------------
    // 1. EMERGENCY RED FLAGS (Immediate ER triage)
    // ---------------------------------------------------------
    const isChestPainEmergency = lower.includes('crushing chest') || 
                                 lower.includes('chest pain') || 
                                 lower.includes('heart attack') || 
                                 lower.includes('left arm pain') ||
                                 lower.includes('severe chest') ||
                                 lower.includes('chhati me dard') ||
                                 lower.includes('dil me dard');

    const isStrokeEmergency = lower.includes('face drooping') || 
                              lower.includes('slurred speech') || 
                              lower.includes('stroke') || 
                              lower.includes('sudden numbness') ||
                              lower.includes('one side weakness') ||
                              lower.includes('lakwa');

    const isBreathingEmergency = lower.includes('cannot breathe') || 
                                 lower.includes('severe shortness of breath') || 
                                 lower.includes('suffocating') || 
                                 lower.includes('saans nahi aa rahi');

    if (isChestPainEmergency || isStrokeEmergency || isBreathingEmergency) {
      return {
        reply: `🚨 **EMERGENCY MEDICAL ALERT / आपातकालीन चेतावनी**\n\n` +
               `> ⚠️ **IMMEDIATE ACTION REQUIRED**: The symptoms you described can indicate a life-threatening medical emergency (such as Acute Coronary Syndrome or Stroke).\n\n` +
               `### 🏥 What you should do right now:\n` +
               `1. 📞 **Call Hospital Emergency Hotline immediately:** \`+91 1800-SANJEEVANI\` or Dial \`108\`.\n` +
               `2. 🚑 **Proceed directly to the Emergency / Casualty Room (Ground Floor - Red Zone).**\n` +
               `3. 🚫 **Do NOT drive yourself.** Have a companion or ambulance transport you.\n` +
               `4. 🪑 Sit down, stay calm, loosen tight clothing, and take slow deep breaths.\n\n` +
               `Our 24x7 Emergency Trauma Care & Cardiac ICU team is on standby.`,
      };
    }

    // ---------------------------------------------------------
    // 2. LIVE QUEUE & TOKEN STATUS QUERY
    // ---------------------------------------------------------
    const tokenMatch = lastUserMessage.match(/(?:token\s*)?(?:#)?([A-Za-z]+-\d+|\bT\d+\b|\bAPT-\d+\b|\bA-\d+\b)/i);
    if (tokenMatch) {
      const queryToken = (tokenMatch[1] || tokenMatch[0]).replace(/^#/, '').trim();
      const journey = await this.lookupTokenJourney(context.hospitalId, queryToken);
      if (journey) {
        return {
          reply: `### 🎫 Live Token Status: \`${journey.tokenCode}\`\n\n` +
                 `* **Patient:** **${journey.patientName}** (\`${journey.patientUhid}\`)\n` +
                 `* **Doctor:** **${journey.doctorName}** (${journey.department})\n` +
                 `* **Assigned Room:** \`${journey.room}\`\n` +
                 `* **Queue Position:** #${journey.queuePosition} in line\n` +
                 `* **Estimated Wait Time:** ~${journey.estimatedWaitTime} mins\n` +
                 `* **Current Status:** \`${journey.status}\`\n\n` +
                 `📍 **Guidance:** Please proceed to **${journey.department} Waiting Area** near room \`${journey.room}\`.`,
        };
      }
    }

    // ---------------------------------------------------------
    // 2. PATIENT VISIT HISTORY, DAYS SINCE LAST VISIT & INTAKE FORM SUMMARY
    // ---------------------------------------------------------
    const isVisitHistoryQuery = lower.includes('kitne din') || 
                                lower.includes('kitna din') || 
                                lower.includes('kab aaya') || 
                                lower.includes('kab aaye') || 
                                lower.includes('last visit') || 
                                lower.includes('pichli visit') || 
                                lower.includes('pichle visit') || 
                                lower.includes('days since') || 
                                lower.includes('visit history') || 
                                lower.includes('aakhri baar') || 
                                lower.includes('previous visit') || 
                                lower.includes('how many days') || 
                                lower.includes('last came') || 
                                lower.includes('when did i visit') || 
                                lower.includes('pehle kab') || 
                                lower.includes('first time') || 
                                lower.includes('pehle aaya') ||
                                lower.includes('kitne din baad');

    const isIntakeSummaryQuery = lower.includes('form me kya') || 
                                 lower.includes('kya bhara') || 
                                 lower.includes('kya details') || 
                                 lower.includes('intake form') || 
                                 lower.includes('pre consultation') || 
                                 lower.includes('case summary') || 
                                 lower.includes('symptoms bhare') || 
                                 lower.includes('what did i fill') || 
                                 lower.includes('appointment summary');

    if (isVisitHistoryQuery || isIntakeSummaryQuery) {
      const records = await this.getPatientRecords(context.userId, context.hospitalId);
      const intake = records.intakeForm;

      if (records.found) {
        let visitTimelineHeader = '';
        if (records.isFirstVisit) {
          visitTimelineHeader = `👋 **Visit Status:** **First-Time Patient** (No prior hospital visits recorded in CareQ).`;
        } else if (records.daysSinceLastVisit !== null && records.daysSinceLastVisit !== undefined) {
          const weeks = Math.round(records.daysSinceLastVisit / 7);
          const weeksStr = weeks > 0 ? ` (~${weeks} week${weeks > 1 ? 's' : ''})` : '';
          visitTimelineHeader = `📅 **Visit Timeline:** You last visited the hospital **${records.daysSinceLastVisit} day(s) ago**${weeksStr}.`;
        } else {
          visitTimelineHeader = `📅 **Visit Timeline:** ${records.visitHistorySummary || 'Follow-up patient.'}`;
        }

        const intakeSection = intake ? 
          `\n\n### 📋 Clinical Intake & Pre-Consultation Details (Submitted at Booking):\n` +
          `* 🩺 **Consulting Doctor:** **${intake.doctorName}** (${intake.department})\n` +
          `* ⚠️ **Chief Complaint / Reason:** **${intake.chiefComplaint}**\n` +
          `* ⏳ **Symptoms & Duration:** ${intake.symptoms} (*Duration: ${intake.symptomsDuration}* | *Severity: ${intake.severity}*)\n` +
          `* 💊 **Current Ongoing Medications:** \`${intake.currentMedications}\`\n` +
          `* 🛡️ **Medical History & Allergies:** ${intake.medicalHistory} | **Allergies:** \`${intake.allergies}\`\n` +
          (intake.intakeNotes ? `* 📝 **Additional Notes:** ${intake.intakeNotes}\n` : '') :
          `\n\n*(No pre-consultation intake form submitted for current booking yet.)*`;

        return {
          reply: `### 🏥 Patient Visit & Intake Summary\n\n` +
                 `${visitTimelineHeader}` +
                 `${intakeSection}\n\n` +
                 `💡 *This information has been compiled for your consulting doctor so they have your complete background before you enter the OPD room.*`,
          actionType: 'RECORDS_RETRIEVED' as const,
          actionData: records,
        };
      }
    }

    const isQueueStatusQuery = lower.includes('token') || 
                               lower.includes('queue') || 
                               lower.includes('wait time') || 
                               lower.includes('my turn') || 
                               lower.includes('position') ||
                               lower.includes('mera number') ||
                               lower.includes('kab aayega') ||
                               lower.includes('kitna time');

    if (isQueueStatusQuery) {
      const records = await this.getPatientRecords(context.userId, context.hospitalId);

      if (records.found && records.activeTokens && records.activeTokens.length > 0) {
        const token = records.activeTokens[0];
        if (!token) {
          return {
            reply: `No active tokens found.`,
          };
        }
        return {
          reply: `### 🎫 Your Live Queue Status\n\n` +
                 `* **Token Number:** \`${token.tokenCode}\`\n` +
                 `* **Doctor:** **${token.doctorName}** (${token.department})\n` +
                 `* **OPD Room:** \`${token.opd}\`\n` +
                 `* **Current Queue Position:** **#${token.queuePosition}** in line\n` +
                 `* **Estimated Wait Time:** ~**${token.estimatedWaitTime} mins**\n` +
                 `* **Status:** \`${token.status}\`\n\n` +
                 `💡 **Queue Tip:** Please be present near room \`${token.opd}\` 10 minutes prior to your turn. You can monitor live movement in the **Live Queue** tab!`,
          actionType: 'RECORDS_RETRIEVED' as const,
          actionData: records,
        };
      } else if (records.found && records.upcomingAppointments && records.upcomingAppointments.length > 0) {
        const appt = records.upcomingAppointments[0];
        if (!appt) {
          return {
            reply: `No upcoming appointments found.`,
          };
        }
        return {
          reply: `### 📅 Upcoming Appointment & Token\n\n` +
                 `You have a confirmed slot with **${appt.doctorName}** (${appt.department}):\n\n` +
                 `* 🎫 **Token Code:** \`${appt.tokenCode}\`\n` +
                 `* 🗓️ **Date & Time:** ${appt.date} at ${appt.time}\n` +
                 `* 📍 **OPD Room:** \`${appt.opd}\`\n` +
                 `* 🔢 **Queue Position:** #${appt.queuePosition} (~${appt.estimatedWaitTime}m wait)\n` +
                 `* 📌 **Status:** **${appt.status}**\n\n` +
                 `*Would you like to reschedule or need directions to the OPD?*`,
          actionType: 'RECORDS_RETRIEVED' as const,
          actionData: records,
        };
      } else {
        return {
          reply: `ℹ️ You do not currently have any active queue tokens for today.\n\n` +
                 `Would you like me to **book an appointment** with one of our specialists (Cardiology, Neurology, General Medicine)? Simply ask *"Book an appointment with Dr. John Doe"*!`,
        };
      }
    }

    // ---------------------------------------------------------
    // 3. APPOINTMENT BOOKING QUERY
    // ---------------------------------------------------------
    const isBookingQuery = lower.includes('book') || 
                           lower.includes('schedule') || 
                           lower.includes('appointment') || 
                           lower.includes('fix slot') || 
                           lower.includes('consult') ||
                           lower.includes('doctor se milna') ||
                           lower.includes('dikhaana hai');

    if (isBookingQuery) {
      let detectedDoctor = '';
      let detectedDepartment = '';

      if (lower.includes('john') || lower.includes('doe') || lower.includes('cardio') || lower.includes('heart')) {
        detectedDoctor = 'Dr. John Doe';
        detectedDepartment = 'Cardiology';
      } else if (lower.includes('sarah') || lower.includes('smith') || lower.includes('neuro') || lower.includes('brain') || lower.includes('nerve')) {
        detectedDoctor = 'Dr. Sarah Smith';
        detectedDepartment = 'Neurology';
      } else if (lower.includes('ortho') || lower.includes('bone') || lower.includes('joint') || lower.includes('knee')) {
        detectedDepartment = 'Orthopedics';
      } else if (lower.includes('child') || lower.includes('pediatric') || lower.includes('baby')) {
        detectedDepartment = 'Pediatrics';
      } else if (lower.includes('skin') || lower.includes('derma')) {
        detectedDepartment = 'Dermatology';
      }

      const bookingResult = await this.bookAppointment(context, {
        doctorName: detectedDoctor,
        departmentName: detectedDepartment,
        reason: 'OPD Consultation',
      });

      if (bookingResult.success && bookingResult.appointment) {
        const appt = bookingResult.appointment;
        return {
          reply: `🎉 **Appointment Confirmed!**\n\n` +
                 `I have booked your consultation with **${appt.doctorName}** in the **${appt.department}** department.\n\n` +
                 `* 🎫 **Token Number:** \`${appt.tokenCode}\`\n` +
                 `* 📅 **Date:** ${appt.appointmentDate}\n` +
                 `* ⏰ **Time Slot:** ${appt.timeSlot}\n` +
                 `* 🔢 **Queue Position:** #${appt.queuePosition}\n` +
                 `* ⏳ **Estimated Wait Time:** ~${appt.estimatedWaitTime} mins\n\n` +
                 `Your token is now active in the hospital system. You can view live movement anytime in the **Queue** tab.`,
          actionType: 'APPOINTMENT_BOOKED' as const,
          actionData: appt,
        };
      } else {
        return {
          reply: `⚠️ I encountered an issue booking the appointment: ${bookingResult.error || 'Please choose an available doctor or department.'}`,
        };
      }
    }

    // ---------------------------------------------------------
    // 4. CANCEL APPOINTMENT
    // ---------------------------------------------------------
    const isCancelQuery = lower.includes('cancel') || lower.includes('hata do') || lower.includes('radd');
    if (isCancelQuery) {
      const match = lastUserMessage.match(/(?:APT-|\b)(\d+)\b/i);
      if (match && match[1]) {
        const cancelRes = await this.cancelAppointment(match[1], context);
        return {
          reply: cancelRes.message || (cancelRes.success ? 'Your appointment has been cancelled successfully.' : 'Failed to cancel appointment.'),
          actionType: 'APPOINTMENT_CANCELLED' as const,
        };
      } else {
        return {
          reply: `Please specify the Appointment ID you wish to cancel (for example: *"Cancel appointment APT-1"*).`,
        };
      }
    }

    // ---------------------------------------------------------
    // 5. LAB TEST PREPARATION & DIAGNOSTIC GUIDELINES
    // ---------------------------------------------------------
    const isLabQuery = lower.includes('fasting') || 
                       lower.includes('blood test') || 
                       lower.includes('lipid') || 
                       lower.includes('sugar test') || 
                       lower.includes('ultrasound') || 
                       lower.includes('mri') || 
                       lower.includes('ct scan') || 
                       lower.includes('x-ray') || 
                       lower.includes('xray') || 
                       lower.includes('urine test') || 
                       lower.includes('lab report') || 
                       lower.includes('khali pet') || 
                       lower.includes('report kab');

    if (isLabQuery) {
      if (lower.includes('sugar') || lower.includes('glucose') || lower.includes('lipid') || lower.includes('cholesterol') || lower.includes('fasting')) {
        return {
          reply: `### 🧪 Fasting Blood Test Guidelines\n\n` +
                 `* **Fasting Requirement:** 8 to 12 hours of overnight fasting is strictly required for **Fasting Blood Sugar (FBS)**, **Lipid Profile**, and **Fasting Insulin**.\n` +
                 `* **Allowed:** Plain water is permitted. Avoid tea, coffee, juice, milk, and smoking.\n` +
                 `* **HbA1c / Complete Blood Count (CBC):** No fasting required (can be done anytime).\n` +
                 `* **Sample Collection Time:** 07:30 AM to 11:30 AM at the **Central Pathology Lab (1st Floor)**.\n` +
                 `* **Reports Turnaround:** Reports will be uploaded to your **Health Locker** within 2 to 4 hours.`,
        };
      }

      if (lower.includes('ultrasound') || lower.includes('usg') || lower.includes('sonography')) {
        return {
          reply: `### 🩺 Ultrasound (USG) Preparation Guidelines\n\n` +
                 `* **Abdomen Ultrasound:** 4 to 6 hours fasting required prior to scan.\n` +
                 `* **Pelvic / KUB / Pregnancy Ultrasound:** Full bladder required. Please drink 4-5 glasses (approx. 1 Litre) of water 1 hour before scan and do not urinate until completed.\n` +
                 `* **Location:** Radiology Department, Ground Floor (Room 108).\n` +
                 `* **Reports:** Available in your portal within 1 hour after scanning.`,
        };
      }

      if (lower.includes('mri') || lower.includes('ct scan')) {
        return {
          reply: `### 🩻 MRI & CT Scan Instructions\n\n` +
                 `* **CT with Contrast:** Fasting for 4 hours required. Please bring latest **Serum Creatinine** lab report.\n` +
                 `* **MRI Scan Safety:** Remove all metal jewelry, watches, hearing aids, and inform staff if you have cardiac pacemakers or metallic implants.\n` +
                 `* **Location:** Advanced Imaging Center (Basement 1).\n` +
                 `* **Turnaround Time:** Detailed radiologist-reviewed reports within 24 hours.`,
        };
      }

      // Default Lab Report Status lookup
      const records = await this.getPatientRecords(context.userId, context.hospitalId);
      const reportsSummary = records.labReports && records.labReports.length > 0
        ? records.labReports.map(r => `• **${r.reportName}** (${r.reportType}) — Status: \`${r.status}\` (${r.date})`).join('\n')
        : '• No lab reports uploaded in your profile yet.';

      return {
        reply: `### 📄 Your Lab & Diagnostic Reports\n\n` +
               `${reportsSummary}\n\n` +
               `💡 **To Download Reports:** Go to the **Health Locker / Reports** tab in your CareQ portal. You can view PDFs, track trend history, or share them securely with your consulting doctor.`,
        actionType: 'RECORDS_RETRIEVED' as const,
        actionData: records,
      };
    }

    // ---------------------------------------------------------
    // 6. AYUSHMAN BHARAT (PM-JAY) & INSURANCE / BILLING
    // ---------------------------------------------------------
    const isInsuranceBillingQuery = lower.includes('ayushman') || 
                                    lower.includes('pmjay') || 
                                    lower.includes('pm-jay') || 
                                    lower.includes('insurance') || 
                                    lower.includes('mediclaim') || 
                                    lower.includes('cashless') || 
                                    lower.includes('tpa') || 
                                    lower.includes('cghs') || 
                                    lower.includes('echs') || 
                                    lower.includes('cost') || 
                                    lower.includes('fee') || 
                                    lower.includes('price') || 
                                    lower.includes('bill') || 
                                    lower.includes('kharcha') || 
                                    lower.includes('paisa');

    if (isInsuranceBillingQuery) {
      return {
        reply: `### 💳 Insurance, Ayushman Bharat & Billing Guide\n\n` +
               `#### 🌟 Ayushman Bharat (AB-PMJAY) Covered:\n` +
               `* **Free Treatment:** Up to **₹5,00,000 per family/year** for eligible cardholders.\n` +
               `* **Helpdesk:** Please visit the **Ayushman Mitra Helpdesk (Ground Floor, Counter #4)**.\n` +
               `* **Required Documents:** Original Aadhaar Card + Ration Card / PM-JAY Gold Card.\n\n` +
               `#### 🛡️ Private Cashless Mediclaim & TPA:\n` +
               `* **Empanelled Insurers:** Star Health, HDFC ERGO, ICICI Lombard, Care Health, Max Bupa, Bajaj Allianz, New India Assurance, and corporate TPAs.\n` +
               `* **Pre-authorization Desk:** Counter #3 (Ground Floor). Pre-approval processed within 24 to 48 hours for planned admissions.\n\n` +
               `#### 💵 OPD Fees & Payment Modes:\n` +
               `* **General OPD Consultation:** ₹300 - ₹500 (Free under Ayushman Bharat).\n` +
               `* **Payment Options:** UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, Net Banking, and Cash at Billing Counters.`,
      };
    }

    // ---------------------------------------------------------
    // 7. TREATMENT JOURNEY & CHRONIC CARE ADHERENCE
    // ---------------------------------------------------------
    const isJourneyQuery = lower.includes('journey') || 
                           lower.includes('adherence') || 
                           lower.includes('chronic') || 
                           lower.includes('care plan') || 
                           lower.includes('retention') || 
                           lower.includes('follow up') || 
                           lower.includes('followup');

    if (isJourneyQuery) {
      const records = await this.getPatientRecords(context.userId, context.hospitalId);
      if (records.treatmentJourneys && records.treatmentJourneys.length > 0) {
        const jList = records.treatmentJourneys.map(j => 
          `• **${j.disease} Care Plan**\n  - Adherence Score: **${j.adherenceScore}%** 🎯\n  - Next Follow-up: **${j.nextFollowup}**\n  - Missed Consultations: ${j.missedVisits}`
        ).join('\n\n');

        return {
          reply: `### 🌿 Your Treatment Journey & Health Adherence\n\n` +
                 `${jList}\n\n` +
                 `💡 *Tip: Keeping your adherence score above 85% significantly lowers health complications and hospitalization risks.*`,
          actionType: 'RECORDS_RETRIEVED' as const,
          actionData: records,
        };
      } else {
        return {
          reply: `### 🌿 Treatment Journeys\n\n` +
                 `You are not currently enrolled in any long-term chronic disease care program (e.g. Hypertension, Diabetes, Asthma).\n\n` +
                 `If you have a chronic condition, your consulting doctor can initiate a personalized Care Journey to automatically track your health score, medication adherence, and routine checkup reminders!`,
        };
      }
    }

    // ---------------------------------------------------------
    // 8. PRESCRIPTION DECODER & MEDICINE DOSAGE
    // ---------------------------------------------------------
    const isMedicineQuery = lower.includes('prescription') || 
                            lower.includes('medicine') || 
                            lower.includes('dosage') || 
                            lower.includes('dawa') || 
                            lower.includes('tablet') || 
                            lower.includes('syrup') || 
                            lower.includes('sos') || 
                            lower.includes('bd') || 
                            lower.includes('tds') || 
                            lower.includes('od');

    if (isMedicineQuery) {
      return {
        reply: `### 💊 Prescription Dosage Decoder & Medicine FAQs\n\n` +
               `Here is how to interpret common doctor prescription dosage terms:\n\n` +
               `* **OD (Once Daily):** Take 1 time per day (e.g., morning).\n` +
               `* **BD / BID (Twice Daily):** Take 2 times per day (morning & night, approx. 12 hrs apart).\n` +
               `* **TDS / TID (Thrice Daily):** Take 3 times per day (morning, afternoon, night, approx. 8 hrs apart).\n` +
               `* **QID (Four Times Daily):** Take 4 times per day (approx. 6 hrs apart).\n` +
               `* **HS (Hora Somni):** Take at bedtime.\n` +
               `* **AC (Ante Cibum):** Take **BEFORE** food / on an empty stomach.\n` +
               `* **PC (Post Cibum):** Take **AFTER** meals.\n` +
               `* **SOS (Si Opus Sit):** Take only in an emergency / when needed (e.g., for acute pain or high fever).\n\n` +
               `🏥 **In-House 24x7 Pharmacy:** Located on Ground Floor near Main Entrance. Discounted generic and branded medications available.`,
      };
    }

    // ---------------------------------------------------------
    // 9. DOCTOR & SPECIALIST DIRECTORY
    // ---------------------------------------------------------
    const isDoctorListQuery = lower.includes('which doctor') || 
                              lower.includes('available doctor') || 
                              lower.includes('list doctor') || 
                              lower.includes('doctor list') || 
                              lower.includes('cardiologist') || 
                              lower.includes('neurologist') || 
                              lower.includes('orthopedic') || 
                              lower.includes('pediatrician') || 
                              lower.includes('specialist') ||
                              lower.includes('timing') ||
                              lower.includes('opd time');

    if (isDoctorListQuery) {
      const data = await this.listDoctorsAndDepartments(context.hospitalId);
      const docsText = data.doctors.map(d => 
        `• **${d.name}** — *${d.specialization}* (${d.department})\n  📍 Room: \`${d.opd}\` | ⏰ Schedule: \`${d.schedule}\` | ⭐ Rating: ${d.rating}/5`
      ).join('\n\n');

      return {
        reply: `### 🩺 Available Doctors & OPD Schedule\n\n${docsText}\n\n*To book an appointment instantly, simply ask: "Book an appointment with [Doctor Name]"!*`,
        actionType: 'DOCTORS_LISTED' as const,
        actionData: data,
      };
    }

    // ---------------------------------------------------------
    // 10. CLINICAL SYMPTOMS & TRIAGE (60+ Conditions)
    // ---------------------------------------------------------
    const isSymptomQuery = lower.includes('pain') || 
                           lower.includes('headache') || 
                           lower.includes('cough') || 
                           lower.includes('fever') || 
                           lower.includes('stomach') || 
                           lower.includes('vomit') || 
                           lower.includes('dizzy') || 
                           lower.includes('knee') || 
                           lower.includes('back') || 
                           lower.includes('skin') || 
                           lower.includes('allergy') || 
                           lower.includes('rash') || 
                           lower.includes('eye') || 
                           lower.includes('ear') || 
                           lower.includes('throat') || 
                           lower.includes('tooth') || 
                           lower.includes('teeth') || 
                           lower.includes('pregnancy') || 
                           lower.includes('period') || 
                           lower.includes('depression') || 
                           lower.includes('anxiety') || 
                           lower.includes('urine') || 
                           lower.includes('sugar') || 
                           lower.includes('symptom') ||
                           lower.includes('dard') ||
                           lower.includes('bukhar') ||
                           lower.includes('khansi');

    if (isSymptomQuery) {
      let deptRec = 'General Medicine';
      let docRec = 'Dr. John Doe (Internal Medicine / Cardiology)';
      let advice = 'Stay hydrated and monitor your symptoms.';

      if (lower.includes('chest') || lower.includes('heart') || lower.includes('palpitation') || lower.includes('high bp')) {
        deptRec = 'Cardiology';
        docRec = 'Dr. John Doe (Cardiologist)';
        advice = 'Avoid strenuous exertion. If experiencing sudden sweating or shortness of breath, proceed to ER immediately.';
      } else if (lower.includes('headache') || lower.includes('dizzy') || lower.includes('nerve') || lower.includes('brain') || lower.includes('seizure') || lower.includes('migraine')) {
        deptRec = 'Neurology';
        docRec = 'Dr. Sarah Smith (Neurologist)';
        advice = 'Rest in a quiet, dark room and avoid bright screen exposure.';
      } else if (lower.includes('knee') || lower.includes('bone') || lower.includes('joint') || lower.includes('back') || lower.includes('fracture') || lower.includes('spine')) {
        deptRec = 'Orthopedics';
        docRec = 'Orthopedic Consultant';
        advice = 'Avoid lifting heavy weights. Apply cold pack for acute swelling or warm compress for stiffness.';
      } else if (lower.includes('child') || lower.includes('baby') || lower.includes('infant') || lower.includes('kid')) {
        deptRec = 'Pediatrics';
        docRec = 'Pediatrician';
        advice = 'Keep child well hydrated. In case of high fever (>101°F) or lethargy, consult immediately.';
      } else if (lower.includes('stomach') || lower.includes('acidity') || lower.includes('vomit') || lower.includes('diarrhea') || lower.includes('constipation') || lower.includes('gas')) {
        deptRec = 'Gastroenterology / General Medicine';
        docRec = 'Gastroenterologist / General Physician';
        advice = 'Consume light, non-spicy meals (khichdi, curd, ORS solution). Avoid oily foods.';
      } else if (lower.includes('skin') || lower.includes('rash') || lower.includes('itching') || lower.includes('acne') || lower.includes('allergy')) {
        deptRec = 'Dermatology';
        docRec = 'Dermatologist';
        advice = 'Do not scratch the affected area. Wash with mild water and avoid unprescribed steroid creams.';
      } else if (lower.includes('ear') || lower.includes('throat') || lower.includes('nose') || lower.includes('sinus') || lower.includes('tonsil')) {
        deptRec = 'ENT (Ear, Nose, Throat)';
        docRec = 'ENT Specialist';
        advice = 'Warm saline gargles 3 times a day and steam inhalation can help soothe throat irritation.';
      } else if (lower.includes('eye') || lower.includes('vision') || lower.includes('blind') || lower.includes('retina')) {
        deptRec = 'Ophthalmology';
        docRec = 'Eye Specialist';
        advice = 'Avoid rubbing eyes. Use sterile preservative-free lubricating drops if experiencing dryness.';
      } else if (lower.includes('tooth') || lower.includes('teeth') || lower.includes('gum') || lower.includes('cavity')) {
        deptRec = 'Dental OPD';
        docRec = 'Dental Surgeon';
        advice = 'Rinse with warm salt water. Avoid very hot or icy beverages.';
      } else if (lower.includes('urine') || lower.includes('kidney') || lower.includes('burning')) {
        deptRec = 'Urology / Nephrology';
        docRec = 'Urologist';
        advice = 'Drink 3 to 4 Litres of water daily. Consult a doctor for urine routine examination.';
      }

      return {
        reply: `### 🩺 Symptom Guidance & Clinical Triage\n\n` +
               `Based on the symptoms you shared, here is our clinical guidance:\n\n` +
               `* **Recommended Department:** **${deptRec}**\n` +
               `* **Consulting Doctor:** **${docRec}**\n` +
               `* **Home Care Advice:** ${advice}\n\n` +
               `> ⚠️ *Disclaimer: This guidance is for triage only and is not a substitute for formal clinical diagnosis.* \n\n` +
               `Would you like me to **book an appointment with ${docRec}** for you now?`,
      };
    }

    // ---------------------------------------------------------
    // 11. HOSPITAL FACILITIES, TIMINGS & VISITING HOURS
    // ---------------------------------------------------------
    const isHospitalGuideQuery = lower.includes('visiting') || 
                                 lower.includes('timings') || 
                                 lower.includes('hours') || 
                                 lower.includes('where is') || 
                                 lower.includes('location') || 
                                 lower.includes('address') || 
                                 lower.includes('pharmacy') || 
                                 lower.includes('canteen') || 
                                 lower.includes('cafeteria') || 
                                 lower.includes('parking') || 
                                 lower.includes('wheelchair') || 
                                 lower.includes('ambulance') || 
                                 lower.includes('emergency number');

    if (isHospitalGuideQuery) {
      return {
        reply: `### 🏥 Sanjeevani Hospital — Facilities & Operations Guide\n\n` +
               `* 📍 **Address:** 123 Health Ave, Medical City (Main Branch)\n` +
               `* 🕒 **OPD Consultation Hours:** Monday - Saturday (09:00 AM - 01:00 PM & 02:00 PM - 05:00 PM)\n` +
               `* 🚨 **24x7 Casualty & Trauma Center:** Ground Floor, West Wing (Helpline: \`+91 1800-SANJEEVANI\`)\n` +
               `* 💊 **24x7 In-house Pharmacy:** Ground Floor near Main Gate\n` +
               `* 🩻 **Radiology & Lab:** 1st Floor (Pathology) & Ground Floor Room 108 (Radiology)\n` +
               `* ⏰ **Inpatient Visiting Hours:** 04:00 PM - 07:00 PM daily (Max 2 visitors per patient)\n` +
               `* 🩺 **ICU Visiting Hours:** 11:00 AM - 12:00 PM & 05:00 PM - 06:00 PM\n` +
               `* ♿ **Wheelchair & Stretcher Assistance:** Available at Main Entrance Porch\n` +
               `* 🚗 **Parking:** 2-Level Basement Parking available for patients and visitors.`,
      };
    }

    // ---------------------------------------------------------
    // 12. DEFAULT WELCOME & COMPREHENSIVE CAPABILITIES MENU
    // ---------------------------------------------------------
    return {
      reply: `Hello! I am **CareQ AI**, your intelligent hospital queue & healthcare assistant. 🏥\n\n` +
             `I can assist you with everything in the hospital portal:\n\n` +
             `1. 🎫 **Live Queue & Token Status** (*"What is my token number and wait time?"*)\n` +
             `2. ⚡ **Book Doctor Appointments** (*"Book an appointment with Dr. John Doe"*)\n` +
             `3. 🩺 **Doctor Schedules & OPD Timings** (*"Which doctors are available today?"*)\n` +
             `4. 🔍 **Symptom Triage & Guidance** (*"I have severe knee pain and swelling"*)\n` +
             `5. 🧪 **Lab Test Instructions & Reports** (*"Is fasting required for blood sugar test?"*)\n` +
             `6. 💳 **Ayushman Bharat & Insurance** (*"Do you accept Ayushman Bharat PM-JAY card?"*)\n` +
             `7. 💊 **Prescription Decoder & Medicines** (*"What does TDS and PC mean in prescription?"*)\n` +
             `8. 🌿 **Treatment Journeys & Care Plans** (*"Show my chronic disease adherence score"*)\n` +
             `9. ❌ **Cancel or Reschedule** (*"Cancel appointment APT-1"*)\n\n` +
             `How may I assist you today? *(आप हिंदी या हिंग्लिश में भी पूछ सकते हैं!)*`,
    };
  }

  // -------------------------------------------------------------
  // STAFF & DOCTOR AI COPILOT: EHR/EMR, OPD Command, Queue, Analytics
  // -------------------------------------------------------------
  private async processStaffChat(context: AiChatContext, messages: ChatMessage[]): Promise<AiChatResult> {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const lower = lastUserMessage.toLowerCase();

    // 0. Live Token & Journey Tracker Query (e.g. "where is token A-001", "status of token A-045", "track token T46")
    const tokenMatch = lastUserMessage.match(/(?:token\s*)?(?:#)?([A-Za-z]+-\d+|\bT\d+\b|\bAPT-\d+\b|\bA-\d+\b)/i);
    const isTokenLookup = tokenMatch || (lower.includes('token') && (lower.includes('status') || lower.includes('where') || lower.includes('track')));

    if (isTokenLookup) {
      const queryToken = tokenMatch ? (tokenMatch[1] || tokenMatch[0]).replace(/^#/, '').trim() : '';
      if (queryToken) {
        const journey = await this.lookupTokenJourney(context.hospitalId, queryToken);
        if (journey) {
          return {
            reply: `### 🎫 Live Token Journey Tracker: \`${journey.tokenCode}\`\n\n` +
                   `* **Patient:** **${journey.patientName}** (\`${journey.patientUhid}\`)\n` +
                   `* **Current Status:** \`${journey.status}\` (${journey.isInConsultation ? '🩺 In Active Consultation' : journey.isCompleted ? '✅ Completed / Checked Out' : '⏳ Waiting in Queue'})\n` +
                   `* **Consulting Doctor:** **${journey.doctorName}** (${journey.department})\n` +
                   `* **Assigned OPD Room:** \`${journey.room}\`\n` +
                   `* **Queue Position:** #${journey.queuePosition} in line\n` +
                   `* **Estimated Wait Time:** ~${journey.estimatedWaitTime} mins\n\n` +
                   `📍 **Location Guidance:** Patient is currently stationed in **${journey.department} Waiting Area / ${journey.room}**.`,
          };
        }
      }
    }

    // 0.1 Doctor Location / Room Lookup
    const isDoctorLocQuery = lower.includes('where is dr') || lower.includes('where is doctor') || lower.includes('which room') || lower.includes('cabin of');
    if (isDoctorLocQuery) {
      const docsData = await this.listDoctorsAndDepartments(context.hospitalId);
      const foundDoc = docsData.doctors.find(d => lower.includes(d.name.toLowerCase().replace(/^dr\.\s*/, '')) || lower.includes(d.department.toLowerCase()));
      if (foundDoc) {
        return {
          reply: `### 📍 Doctor Location & OPD Room\n\n` +
                 `* **Doctor:** **${foundDoc.name}**\n` +
                 `* **Specialization:** *${foundDoc.specialization}* (${foundDoc.department})\n` +
                 `* **Assigned Room:** \`${foundDoc.opd}\`\n` +
                 `* **Working Hours:** \`${foundDoc.schedule}\`\n` +
                 `* **Status:** \`${foundDoc.status}\`\n\n` +
                 `You can find **${foundDoc.name}** in room \`${foundDoc.opd}\` on the OPD clinical floor.`,
        };
      }
    }

    // 1. Patient Record / EHR Search
    const isPatientSearch = lower.includes('find patient') || 
                            lower.includes('search patient') || 
                            lower.includes('uhid') || 
                            lower.includes('records of') || 
                            lower.includes('patient details') || 
                            lower.includes('history of') ||
                            lower.includes('rahul') ||
                            lower.includes('patient info');

    if (isPatientSearch) {
      let query = lastUserMessage
        .replace(/^(?:find|search|look up|get|show|fetch|check|display)\s+/i, '')
        .replace(/^(?:the\s+)?(?:patient\s+)?(?:records?|details?|info|profile|history|appointment|appointments)?\s+(?:of|for|about|with)?\s+/i, '')
        .replace(/^uhid:?\s*/i, '')
        .replace(/^patient:?\s*/i, '')
        .trim();

      if (!query) query = lastUserMessage.trim();
      const records = await this.searchPatientRecords(context.hospitalId, query);

      if (!records.found || !records.patients || records.patients.length === 0) {
        return {
          reply: `🔍 Searched database for **"${query}"** in Hospital #${context.hospitalId}, but found no matching records.\n\n*Please verify the UHID, full name, or phone number.*`,
        };
      }

      const p = records.patients[0];
      if (!p) {
        return {
          reply: `🔍 Searched database for **"${query}"** in Hospital #${context.hospitalId}, but found no matching records.\n\n*Please verify the UHID, full name, or phone number.*`,
        };
      }

      const apptSummary = p.recentAppointments.length > 0
        ? p.recentAppointments.map(a => `• **${a.date} at ${a.time}** with ${a.doctor} (${a.department}) — Status: *${a.status}* (Token: \`${a.token || 'N/A'}\`)`).join('\n')
        : '• No recent appointments.';

      const journeySummary = p.activeJourneys.length > 0
        ? p.activeJourneys.map(j => `• **${j.disease}**: Adherence Score **${j.adherenceScore}%** | Risk Level: **${j.riskLevel}** (Score ${j.riskScore})`).join('\n')
        : '• No chronic care journeys active.';

      const labSummary = p.labReports.length > 0
        ? p.labReports.map(lr => `• **${lr.name}** (${lr.type}) — Status: \`${lr.status}\` (${lr.date})`).join('\n')
        : '• No lab reports uploaded.';

      const latestAppt = p.recentAppointments[0];
      let intakeSection = '';
      if (latestAppt && (latestAppt.chiefComplaint || latestAppt.symptoms || latestAppt.daysSinceLastVisit !== null)) {
        intakeSection = `\n\n#### 📝 Pre-Consultation Intake Form (Submitted by Patient):\n` +
          `* **Chief Complaint:** ${latestAppt.chiefComplaint || 'General Checkup'}\n` +
          `* **Reported Symptoms:** ${latestAppt.symptoms || 'None'} (${latestAppt.symptomsDuration || 'N/A'} | Severity: ${latestAppt.severity || 'Moderate'})\n` +
          `* **Visit Timeline:** ${latestAppt.daysSinceLastVisit !== null && latestAppt.daysSinceLastVisit !== undefined ? `Last visited ${latestAppt.daysSinceLastVisit} day(s) ago` : 'First-time hospital visit'}\n` +
          `* **Current Medications:** \`${latestAppt.medications || 'None'}\`\n` +
          `* **Allergies:** \`${latestAppt.allergies || 'No known allergies'}\``;
      }

      return {
        reply: `### 📋 Patient EHR Record: ${p.name} (\`${p.uhid}\`)\n\n` +
               `* **Demographics:** ${p.age} yrs / ${p.gender} | Blood Group: \`${p.bloodGroup}\`\n` +
               `* **ABHA ID:** \`${p.abhaId}\` | Contact: ${p.phone} | ${p.email}\n` +
               `* **Billing Status:** \`${p.billingStatus}\` | Patient Status: \`${p.status}\`\n\n` +
               `#### 📅 Recent Appointments:\n${apptSummary}` +
               `${intakeSection}\n\n` +
               `#### 🌿 Chronic Care & Adherence:\n${journeySummary}\n\n` +
               `#### 🧪 Lab Reports:\n${labSummary}\n\n` +
               `*Would you like me to book a walk-in token or schedule an OPD consultation for this patient?*`,
        actionType: 'RECORDS_RETRIEVED' as const,
        actionData: records,
      };
    }

    // 2. Hospital Queue & OPD Command Center Overview
    const isQueueQuery = lower.includes('queue') || 
                         lower.includes('token status') || 
                         lower.includes('active tokens') || 
                         lower.includes('waiting count') || 
                         lower.includes('command center');

    if (isQueueQuery) {
      const summary = await this.getHospitalQueueSummary(context.hospitalId);

      const docQueuesText = summary.doctorQueues.length > 0
        ? summary.doctorQueues.map(dq => 
            `• **${dq.doctorName}** (${dq.department} - ${dq.opd})\n  - In Progress: ${dq.inProgress ? `\`${dq.inProgress}\`` : '*None (Room Ready)*'}\n  - Waiting Tokens: **${dq.waitingCount}** [${dq.tokens.slice(0, 4).join(', ')}${dq.tokens.length > 4 ? '...' : ''}]`
          ).join('\n\n')
        : '• No active queue tokens right now. OPD queues are clear.';

      return {
        reply: `### 📊 Live Hospital Queue & OPD Command Center\n\n` +
               `* 🟢 **Total Tokens in Consultation:** ${summary.totalInProgress}\n` +
               `* ⏳ **Total Patients Waiting:** ${summary.totalWaiting}\n` +
               `* ✅ **Total Completed Today:** ${summary.totalCompletedToday}\n` +
               `* 📈 **Total Active Load:** ${summary.totalActive}\n\n` +
               `#### 🩺 Doctor OPD Rooms Status:\n\n${docQueuesText}`,
      };
    }

    // 3. Doctor Schedules & Availability Management
    const isDoctorScheduleQuery = lower.includes('doctor') || 
                                  lower.includes('schedule') || 
                                  lower.includes('availability') || 
                                  lower.includes('timing') || 
                                  lower.includes('opd rooms');

    if (isDoctorScheduleQuery) {
      const docsData = await this.listDoctorsAndDepartments(context.hospitalId);
      const docsText = docsData.doctors.map(d => 
        `• **${d.name}** (${d.specialization})\n  📍 Room: \`${d.opd}\` | ⏰ Schedule: \`${d.schedule}\` | Status: \`${d.status}\` | Rating: ⭐ ${d.rating}/5`
      ).join('\n\n');

      return {
        reply: `### 🩺 Doctor Roster & OPD Allocation\n\n${docsText}\n\n*Would you like to book a walk-in patient with any of these doctors?*`,
        actionType: 'DOCTORS_LISTED' as const,
        actionData: docsData,
      };
    }

    // 4. Lab Reports Review Overview
    const isLabOverview = lower.includes('lab') || 
                          lower.includes('report') || 
                          lower.includes('pathology') || 
                          lower.includes('pending review');

    if (isLabOverview) {
      const labData = await this.getLabReportsOverview(context.hospitalId);
      const reportsList = labData.recentReports.length > 0
        ? labData.recentReports.map(r => `• **${r.patientName}** (\`${r.uhid}\`) — ${r.reportName} (${r.type}) | Status: \`${r.status}\` | Date: ${r.date}`).join('\n')
        : '• No recent lab uploads.';

      return {
        reply: `### 🧪 Pathology & Diagnostic Lab Overview\n\n` +
               `* 🟡 **Pending Doctor Review:** ${labData.pendingReviewCount}\n` +
               `* 🟢 **Reviewed & Completed:** ${labData.reviewedCount}\n` +
               `* 📄 **Total Recent Uploads:** ${labData.totalReports}\n\n` +
               `#### Recent Lab Submissions:\n${reportsList}`,
      };
    }

    // 5. Patient Retention & Churn Analytics
    const isRetentionQuery = lower.includes('retention') || 
                             lower.includes('risk') || 
                             lower.includes('churn') || 
                             lower.includes('adherence') || 
                             lower.includes('missed follow');

    if (isRetentionQuery) {
      const retData = await this.getRetentionAnalytics(context.hospitalId);
      const critList = retData.criticalPatients.length > 0
        ? retData.criticalPatients.map(p => 
            `• **${p.patientName}** (\`${p.uhid}\`) — ${p.disease} (${p.severity?.toUpperCase() || 'MODERATE'} severity)\n` +
            `  - 📅 **Days Since Last Visit:** \`${p.daysSinceLastVisit} days absent\` | Risk Score: **${p.priorityScore}/100** (\`${p.riskLevel}\`)\n` +
            `  - 🩺 **Complaint/Symptoms:** *${p.chiefComplaint || 'Consultation follow-up'}*\n` +
            `  - 📞 **ML Model Directive:** **${p.recommendedAction}**`
          ).join('\n\n')
        : '• No high-risk patients detected.';

      return {
        reply: `### 📉 Patient Retention, Absence & ML Risk Analytics\n\n` +
               `* 🚨 **Critical / Urgent Calls Needed:** ${retData.urgentCallsNeeded}\n` +
               `* ⚠️ **High-Risk Patients Monitored:** ${retData.highRiskCount}\n` +
               `* 👥 **Total Hospital Patients Evaluated by ML:** ${retData.totalJourneys}\n\n` +
               `#### 🚨 High-Priority Patients & ML Model Directives:\n\n${critList}`,
      };
    }

    // 6. Booking an OPD / Walk-in slot (Staff Action)
    const isBookingQuery = lower.includes('book') || lower.includes('schedule') || lower.includes('register');
    if (isBookingQuery) {
      let detectedDoctor = '';
      let detectedDepartment = '';

      if (lower.includes('john') || lower.includes('doe') || lower.includes('cardio')) {
        detectedDoctor = 'Dr. John Doe';
        detectedDepartment = 'Cardiology';
      } else if (lower.includes('sarah') || lower.includes('smith') || lower.includes('neuro')) {
        detectedDoctor = 'Dr. Sarah Smith';
        detectedDepartment = 'Neurology';
      }

      const bookingResult = await this.bookAppointment(context, {
        doctorName: detectedDoctor,
        departmentName: detectedDepartment,
        reason: 'Staff OPD Walk-in Registration',
      });

      if (bookingResult.success && bookingResult.appointment) {
        const appt = bookingResult.appointment;
        return {
          reply: `✅ **OPD Token Created by Staff Copilot**\n\n` +
                 `* 🎫 **Token Code:** \`${appt.tokenCode}\`\n` +
                 `* 👨‍⚕️ **Doctor:** **${appt.doctorName}** (${appt.department})\n` +
                 `* 📅 **Date & Time:** ${appt.appointmentDate} at ${appt.timeSlot}\n` +
                 `* 🔢 **Queue Position:** #${appt.queuePosition} (~${appt.estimatedWaitTime}m wait)\n\n` +
                 `Live broadcast has been sent to Receptionist and Doctor OPD Dashboards.`,
          actionType: 'APPOINTMENT_BOOKED' as const,
          actionData: appt,
        };
      }
    }

    // Default Staff Copilot Menu
    return {
      reply: `👋 Welcome to **CareQ Staff & Doctor AI Copilot**.\n\n` +
             `Here are the hospital administration & clinical operations I can perform:\n\n` +
             `1. 🔍 **EHR/EMR Patient Record Search:** *"Find patient UHID-1001"* or *"Show records of Rahul Verma"*\n` +
             `2. 📊 **Live Hospital Queue & Command Center:** *"What is the active queue status today?"*\n` +
             `3. 🩺 **Doctor Rosters & Availability:** *"Show available doctors and OPD rooms"*\n` +
             `4. 🧪 **Lab & Diagnostic Overview:** *"Show pending lab reports awaiting review"*\n` +
             `5. 📉 **Patient Retention & Churn Analytics:** *"Show high-risk chronic patients and missed visits"*\n` +
             `6. ⚡ **Instant OPD Walk-in Booking:** *"Book OPD consultation with Dr. John Doe"*\n\n` +
             `How can I assist your clinical or administrative workflow?`,
    };
  }

  // -------------------------------------------------------------
  // Context-Grounded Gemini 1.5 / 2.0 Generative Model Invocation
  // -------------------------------------------------------------
  private async callGeminiWithFullContext(context: AiChatContext, messages: ChatMessage[], isStaff: boolean): Promise<AiChatResult | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`;

    // Grounding Context Ingestion
    const doctorsData = await this.listDoctorsAndDepartments(context.hospitalId);
    let patientContextStr = '';

    if (!isStaff) {
      const records = await this.getPatientRecords(context.userId, context.hospitalId);
      if (records.found && records.patient) {
        patientContextStr = `CURRENT LOGGED-IN PATIENT:
- Name: ${records.patient.name}
- UHID: ${records.patient.uhid}
- Age: ${records.patient.age}, Gender: ${records.patient.gender}, Blood Group: ${records.patient.bloodGroup}
- Visit Timeline / Days Since Last Visit: ${records.visitHistorySummary || 'N/A'} (Days: ${records.daysSinceLastVisit ?? 'First visit'})
- Appointment Booking Intake Form Data: ${JSON.stringify(records.intakeForm || {})}
- Upcoming Appointments: ${JSON.stringify(records.upcomingAppointments)}
- Active Queue Tokens: ${JSON.stringify(records.activeTokens)}
- Treatment Journeys: ${JSON.stringify(records.treatmentJourneys)}
- Lab Reports: ${JSON.stringify(records.labReports)}`;
      }
    }

    const doctorsListStr = doctorsData.doctors.map(d => 
      `${d.name} (${d.specialization}, Dept: ${d.department}, Room: ${d.opd}, Hours: ${d.schedule}, Rating: ${d.rating}/5, Status: ${d.status})`
    ).join('; ');

    const systemPrompt = `You are CareQ AI Assistant for Sanjeevani Hospital (Hospital ID: ${context.hospitalId}).
Role Context: ${isStaff ? 'Staff / Doctor Copilot (Administrative, EHR & Clinical Operations)' : 'Patient Assistant (Queue, Appointments, Records, Lab Guidelines, Ayushman Bharat, Triage)'}.

HOSPITAL GROUNDED DATA:
- Doctors & Specialists: ${doctorsListStr}
- Hospital Address: 123 Health Ave, Medical City. Working hours: 24/7. Emergency Hotline: +91 1800-SANJEEVANI or Dial 108.
- Insurance & Schemes: Ayushman Bharat (AB-PMJAY) free up to 5 Lakhs at Counter #4. Private TPA Cashless at Counter #3.
- Lab Fasting Guidelines: Fasting 8-12 hrs for FBS/Lipid. No fasting for HbA1c/CBC. Ultrasound abdomen needs 4-6 hrs fasting + full bladder for pelvic.
${patientContextStr}

RULES:
1. Always answer with accurate medical, queue, booking, and operational guidance.
2. If patient describes severe emergency symptoms (crushing chest pain, stroke FAST, severe breathing distress), issue IMMEDIATE RED ALERT to call 108 / Emergency Hotline.
3. Understand queries in English, Hindi, and Hinglish. Respond in the user's preferred language with polite, empathetic, structured markdown.
4. Use formatting: **bold**, bullet points, and concise emojis.`;

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1200,
        }
      })
    });

    if (!response.ok) {
      console.warn(`[Gemini API Error] status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) return null;

    return {
      reply: text,
    };
  }
}

export const aiService = new AiService();
