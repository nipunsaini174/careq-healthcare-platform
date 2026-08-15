import { prisma } from '../prisma/client.js';
import { safeEmit } from '../sockets/emit.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const retentionService = {
  /**
   * Get retention dashboard summary for a hospital
   */
  async getDashboardSummary(hospitalId: number) {
    const activeJourneys = await prisma.treatment_journeys.findMany({
      where: { hospital_id: hospitalId, status: 'ACTIVE' },
      include: {
        patients: true,
        diseases: true,
        risk_assessments: {
          orderBy: { prediction_date: 'desc' },
          take: 1,
          include: { risk_factors: true },
        },
        interventions: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let criticalCount = 0;

    const patientsList = activeJourneys.map((j) => {
      const latestAssessment = j.risk_assessments[0];
      const latestIntervention = j.interventions[0];
      const riskScore = latestAssessment?.risk_score ?? 0;
      const riskLevel = latestAssessment?.risk_level ?? 'LOW';

      if (riskLevel === 'CRITICAL') criticalCount++;
      else if (riskLevel === 'HIGH') highCount++;
      else if (riskLevel === 'MEDIUM') mediumCount++;
      else lowCount++;

      return {
        journeyId: String(j.journey_id),
        patientId: String(j.patient_id),
        patientName: j.patients.full_name,
        uhid: j.patients.uhid,
        age: j.patients.age,
        diseaseName: j.diseases.disease_name,
        diseaseType: j.diseases.disease_type,
        riskScore,
        riskLevel,
        recommendedAction: latestAssessment?.recommended_action ?? 'NORMAL_FOLLOWUP',
        lastVisitDate: j.last_visit_date,
        nextFollowupDate: j.next_followup_date,
        missedAppointments: j.missed_appointments,
        adherenceScore: j.adherence_score,
        consecutiveMissed: j.consecutive_missed,
        latestIntervention: latestIntervention ? {
          id: String(latestIntervention.intervention_id),
          type: latestIntervention.intervention_type,
          status: latestIntervention.status,
          outcome: latestIntervention.outcome,
        } : null,
        factors: latestAssessment?.risk_factors?.map((f) => ({
          name: f.factor_name,
          value: f.factor_value,
          contribution: f.contribution,
        })) || [],
      };
    });

    // Sort by risk score descending
    patientsList.sort((a, b) => b.riskScore - a.riskScore);

    return {
      summary: {
        totalMonitored: activeJourneys.length,
        criticalRisk: criticalCount,
        highRisk: highCount,
        mediumRisk: mediumCount,
        lowRisk: lowCount,
      },
      priorityPatients: patientsList,
    };
  },

  /**
   * Get single patient retention risk detail
   */
  async getPatientRiskDetail(journeyId: number) {
    const journey = await prisma.treatment_journeys.findUnique({
      where: { journey_id: journeyId },
      include: {
        patients: true,
        diseases: true,
        risk_assessments: {
          orderBy: { prediction_date: 'desc' },
          include: { risk_factors: true },
        },
        interventions: {
          orderBy: { created_at: 'desc' },
          include: { assigned_user: true },
        },
        retention_followups: {
          orderBy: { scheduled_date: 'desc' },
        },
      },
    });

    if (!journey) throw new Error('Treatment journey not found');

    const latestAssessment = journey.risk_assessments[0];

    return {
      journeyId: String(journey.journey_id),
      patientId: String(journey.patient_id),
      patientName: journey.patients.full_name,
      uhid: journey.patients.uhid,
      age: journey.patients.age,
      gender: journey.patients.gender,
      bloodGroup: journey.patients.blood_group,
      phone: journey.patients.phone,
      diseaseName: journey.diseases.disease_name,
      diseaseType: journey.diseases.disease_type,
      startDate: journey.start_date,
      lastVisitDate: journey.last_visit_date,
      nextFollowupDate: journey.next_followup_date,
      adherenceScore: journey.adherence_score,
      totalAppointments: journey.total_appointments,
      completedAppointments: journey.completed_appointments,
      missedAppointments: journey.missed_appointments,
      consecutiveMissed: journey.consecutive_missed,
      riskScore: latestAssessment?.risk_score ?? 0,
      riskLevel: latestAssessment?.risk_level ?? 'LOW',
      recommendedAction: latestAssessment?.recommended_action ?? 'NORMAL_FOLLOWUP',
      factors: latestAssessment?.risk_factors?.map((f) => ({
        name: f.factor_name,
        value: f.factor_value,
        contribution: f.contribution,
      })) || [],
      assessmentHistory: journey.risk_assessments.map((a) => ({
        id: String(a.assessment_id),
        riskScore: a.risk_score,
        riskLevel: a.risk_level,
        predictionDate: a.prediction_date,
        recommendedAction: a.recommended_action,
      })),
      interventions: journey.interventions.map((i) => ({
        id: String(i.intervention_id),
        type: i.intervention_type,
        priority: i.priority,
        status: i.status,
        recommendedByAI: i.recommended_by_ai,
        outcome: i.outcome,
        outcomeNotes: i.outcome_notes,
        assignedTo: i.assigned_user?.full_name || null,
        createdAt: i.created_at,
        completedAt: i.completed_at,
      })),
      followups: journey.retention_followups.map((f) => ({
        id: String(f.followup_id),
        scheduledDate: f.scheduled_date,
        completedDate: f.completed_date,
        status: f.status,
        notes: f.notes,
      })),
    };
  },

  /**
   * Run AI risk prediction via FastAPI and save assessment
   */
  async triggerAssessment(journeyId: number) {
    const journey = await prisma.treatment_journeys.findUnique({
      where: { journey_id: journeyId },
      include: { patients: true, diseases: true },
    });

    if (!journey) throw new Error('Treatment journey not found');

    // Calculate feature values from journey history
    const now = new Date();
    const daysSinceLastVisit = journey.last_visit_date
      ? Math.max(1, Math.floor((now.getTime() - new Date(journey.last_visit_date).getTime()) / (1000 * 3600 * 24)))
      : 30;

    const treatmentDuration = Math.max(1, Math.floor((now.getTime() - new Date(journey.start_date).getTime()) / (1000 * 3600 * 24)));

    const payload = {
      age: journey.patients.age || 40,
      disease: journey.diseases.disease_name || 'Diabetes',
      treatment_duration: treatmentDuration,
      missed_appointments: journey.missed_appointments,
      consecutive_missed: journey.consecutive_missed,
      days_since_last_visit: daysSinceLastVisit,
      appointment_adherence: journey.adherence_score / 100,
      previous_dropout: journey.missed_appointments > 2 ? 1 : 0,
      travel_barrier: 0,
      cost_barrier: 0,
      side_effect_flag: 0,
      followup_delay: Math.max(0, daysSinceLastVisit - 14),
      treatment_complexity: 2,
      average_visit_gap: Math.round(journey.average_visit_gap_days || 14),
    };

    let aiResult: any = null;
    try {
      const response = await fetch(`${AI_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        aiResult = await response.json();
      }
    } catch (err) {
      console.warn('AI Service fetch failed, falling back to rule-based risk calculation:', err);
    }

    // Fallback heuristic if AI service is offline
    if (!aiResult) {
      let score = 20;
      if (journey.missed_appointments >= 3) score += 40;
      else if (journey.missed_appointments >= 1) score += 20;
      if (daysSinceLastVisit > 30) score += 30;
      if (journey.adherence_score < 60) score += 20;

      score = Math.min(99, score);
      let level = 'LOW';
      let action = 'NORMAL_FOLLOWUP';
      if (score >= 85) { level = 'CRITICAL'; action = 'IMMEDIATE_ATTENTION'; }
      else if (score >= 70) { level = 'HIGH'; action = 'PRIORITY_CALL'; }
      else if (score >= 40) { level = 'MEDIUM'; action = 'FOLLOWUP_CALL'; }

      aiResult = {
        risk_score: score,
        risk_level: level,
        recommended_action: action,
        factors: [
          { name: 'Missed appointments', value: journey.missed_appointments, contribution: 35 },
          { name: 'Days since last visit', value: daysSinceLastVisit, contribution: 30 },
          { name: 'Low adherence score', value: `${journey.adherence_score}%`, contribution: 25 },
        ],
      };
    }

    // Save risk assessment to DB
    const assessment = await prisma.risk_assessments.create({
      data: {
        patient_id: journey.patient_id,
        journey_id: journey.journey_id,
        hospital_id: journey.hospital_id,
        risk_score: aiResult.risk_score,
        risk_level: aiResult.risk_level,
        model_version: 'v1.0-RandomForest',
        recommended_action: aiResult.recommended_action,
        risk_factors: {
          create: (aiResult.factors || []).map((f: any) => ({
            factor_name: String(f.name),
            factor_value: String(f.value),
            contribution: Number(f.contribution || 0),
          })),
        },
      },
      include: { risk_factors: true },
    });

    // Emit real-time alert for high/critical risk
    if (aiResult.risk_level === 'HIGH' || aiResult.risk_level === 'CRITICAL') {
      safeEmit('retention_alert', {
        hospitalId: String(journey.hospital_id),
        journeyId: String(journey.journey_id),
        patientName: journey.patients.full_name,
        diseaseName: journey.diseases.disease_name,
        riskScore: aiResult.risk_score,
        riskLevel: aiResult.risk_level,
        recommendedAction: aiResult.recommended_action,
      });
    }

    return assessment;
  },

  /**
   * Create an intervention
   */
  async createIntervention(data: {
    journeyId: number;
    type: string;
    priority: string;
    assignedTo?: number;
    notes?: string;
  }) {
    const journey = await prisma.treatment_journeys.findUnique({
      where: { journey_id: data.journeyId },
      include: { risk_assessments: { orderBy: { prediction_date: 'desc' }, take: 1 } },
    });

    if (!journey) throw new Error('Treatment journey not found');
    const latestAssessment = journey.risk_assessments[0];
    if (!latestAssessment) throw new Error('No risk assessment found for journey');

    const intervention = await prisma.interventions.create({
      data: {
        patient_id: journey.patient_id,
        journey_id: journey.journey_id,
        assessment_id: latestAssessment.assessment_id,
        hospital_id: journey.hospital_id,
        assigned_to: data.assignedTo || null,
        intervention_type: data.type,
        priority: data.priority,
        status: 'IN_PROGRESS',
        recommended_by_ai: true,
        outcome_notes: data.notes || null,
      },
    });

    safeEmit('intervention_updated', {
      hospitalId: String(journey.hospital_id),
      journeyId: String(journey.journey_id),
      interventionId: String(intervention.intervention_id),
      status: 'IN_PROGRESS',
    });

    return intervention;
  },

  /**
   * Record intervention outcome and trigger risk reassessment (Closed Loop)
   */
  async recordOutcome(
    interventionId: number,
    outcome: string,
    outcomeNotes?: string,
    rescheduledDate?: string
  ) {
    const intervention = await prisma.interventions.findUnique({
      where: { intervention_id: interventionId },
      include: { treatment_journeys: true },
    });

    if (!intervention) throw new Error('Intervention not found');

    const updatedIntervention = await prisma.interventions.update({
      where: { intervention_id: interventionId },
      data: {
        status: 'COMPLETED',
        outcome,
        outcome_notes: outcomeNotes || null,
        completed_at: new Date(),
      },
    });

    // If rescheduled, create/update follow-up and lower consecutive missed count
    if (rescheduledDate) {
      await prisma.retention_followups.create({
        data: {
          patient_id: intervention.patient_id,
          journey_id: intervention.journey_id,
          hospital_id: intervention.hospital_id,
          scheduled_date: new Date(rescheduledDate),
          status: 'SCHEDULED',
          notes: `Rescheduled via intervention outcome: ${outcome}`,
        },
      });

      // Update journey metrics: reset consecutive missed to 0, update next follow-up
      await prisma.treatment_journeys.update({
        where: { journey_id: intervention.journey_id },
        data: {
          consecutive_missed: 0,
          next_followup_date: new Date(rescheduledDate),
          adherence_score: Math.min(100, (intervention.treatment_journeys.adherence_score || 60) + 15),
        },
      });
    }

    // Reassess risk post-intervention (Closed-loop intelligence)
    const newAssessment = await this.triggerAssessment(intervention.journey_id);

    safeEmit('intervention_updated', {
      hospitalId: String(intervention.hospital_id),
      journeyId: String(intervention.journey_id),
      interventionId: String(intervention.intervention_id),
      status: 'COMPLETED',
      outcome,
      newRiskScore: (newAssessment as any).risk_score,
      newRiskLevel: (newAssessment as any).risk_level,
    });

    return {
      intervention: updatedIntervention,
      newAssessment,
    };
  },

  /**
   * Analytics overview for Admin
   */
  async getAnalytics(hospitalId: number) {
    const totalJourneys = await prisma.treatment_journeys.count({ where: { hospital_id: hospitalId } });
    const totalInterventions = await prisma.interventions.count({ where: { hospital_id: hospitalId } });
    const completedInterventions = await prisma.interventions.count({
      where: { hospital_id: hospitalId, status: 'COMPLETED' },
    });

    const outcomesList = await prisma.interventions.groupBy({
      by: ['outcome'],
      where: { hospital_id: hospitalId, status: 'COMPLETED' },
      _count: true,
    });

    const diseaseBreakdown = await prisma.treatment_journeys.groupBy({
      by: ['disease_id'],
      where: { hospital_id: hospitalId },
      _count: true,
    });

    return {
      totalJourneys,
      totalInterventions,
      completedInterventions,
      successRate: totalInterventions > 0 ? Math.round((completedInterventions / totalInterventions) * 100) : 0,
      outcomesBreakdown: outcomesList.map((o) => ({
        outcome: o.outcome || 'Unknown',
        count: o._count,
      })),
      diseaseCount: diseaseBreakdown.length,
    };
  },
};
