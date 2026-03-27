/**
 * Demo mode: static data for the whole platform so users can explore without real data.
 * All IDs are fixed UUIDs so references stay consistent.
 */

import type {
  Profile,
  Appointment,
  Message,
  MedicalRecord,
  RecoveryMilestone,
  ProfileRole,
  AppointmentStatus,
  TreatmentType,
  RecordStatus,
  MilestoneStatus,
  MilestoneCategory,
  PaymentStatus,
} from "@/types/database.types";
import type { Review } from "@/types/database.types";

export const DEMO_THERAPIST_ID = "a0000000-0000-4000-8000-000000000001";
export const DEMO_PATIENT_IDS = [
  "b0000000-0000-4000-8000-000000000001",
  "b0000000-0000-4000-8000-000000000002",
  "b0000000-0000-4000-8000-000000000003",
  "b0000000-0000-4000-8000-000000000004",
  "b0000000-0000-4000-8000-000000000005",
  "b0000000-0000-4000-8000-000000000006",
] as const;

const now = new Date();
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

function iso(d: Date) {
  return d.toISOString();
}

export const DEMO_THERAPIST: Profile = {
  id: DEMO_THERAPIST_ID,
  role: "therapist" as ProfileRole,
  full_name: "Dr. Sarah Chen",
  email: "sarah.chen@demo.revora.com",
  avatar_url: null,
  phone: "+1 (555) 123-4567",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: iso(now),
  license_number: "PT-2024-CA-12345",
  specialties: ["Orthopedic", "Sports rehab", "Manual therapy", "Dry needling"],
  bio: "Dr. Sarah Chen is a board-certified physical therapist with over 12 years of experience in orthopedic and sports rehabilitation. She holds a DPT from UCSF and completed an orthopedic residency at Stanford. Dr. Chen specializes in treating athletes, post-surgical patients, and those with chronic pain. She is certified in dry needling and manual therapy techniques. Her approach combines evidence-based practice with personalized care to help patients return to their goals.",
  timezone: "America/Los_Angeles",
  language: "en",
  date_of_birth: "1988-05-22",
  insurance_provider: null,
  insurance_id: null,
  emergency_contact_name: "Michael Chen",
  emergency_contact_phone: "+1 (555) 987-6543",
  address_line1: "450 Sutter St, Suite 2100",
  address_line2: "Revora Health & Rehabilitation",
  city: "San Francisco",
  state: "CA",
  zip_code: "94108",
  country: "US",
  latitude: 37.7897,
  longitude: -122.3972,
  stripe_account_id: null,
  stripe_customer_id: null,
};

export const DEMO_REVIEWS: Review[] = [
  {
    id: "r0000000-0000-4000-8000-000000000001",
    therapist_id: DEMO_THERAPIST_ID,
    patient_id: DEMO_PATIENT_IDS[0],
    rating: 5,
    reviewer_name: "James W.",
    comment: "Dr. Chen helped me recover from a knee injury. Professional, knowledgeable, and genuinely caring. Highly recommend!",
    created_at: "2024-11-15T00:00:00.000Z",
  },
  {
    id: "r0000000-0000-4000-8000-000000000002",
    therapist_id: DEMO_THERAPIST_ID,
    patient_id: DEMO_PATIENT_IDS[1],
    rating: 5,
    reviewer_name: "Maria G.",
    comment: "Best PT I've ever worked with. Clear explanations, effective treatment plan, and I'm back to running pain-free.",
    created_at: "2024-12-01T00:00:00.000Z",
  },
  {
    id: "r0000000-0000-4000-8000-000000000003",
    therapist_id: DEMO_THERAPIST_ID,
    patient_id: DEMO_PATIENT_IDS[2],
    rating: 4,
    reviewer_name: "Alex T.",
    comment: "Great experience. Dr. Chen took time to understand my goals and tailor the rehab program. Would recommend.",
    created_at: "2024-12-20T00:00:00.000Z",
  },
];

export const DEMO_PATIENTS: Profile[] = [
  {
    id: DEMO_PATIENT_IDS[0],
    role: "patient" as ProfileRole,
    full_name: "James Wilson",
    email: "james.wilson@example.com",
    avatar_url: null,
    phone: "+1 (555) 234-5678",
    created_at: "2024-06-01T00:00:00.000Z",
    updated_at: iso(now),
    license_number: null,
    specialties: [],
    bio: null,
    timezone: "America/Los_Angeles",
    language: "en",
    date_of_birth: "1985-03-15",
    insurance_provider: "Blue Cross",
    insurance_id: "BC-987654",
    emergency_contact_name: "Jane Wilson",
    emergency_contact_phone: "+1 (555) 999-0000",
    address_line1: "456 Oak Ave",
    address_line2: "Apt 2",
    city: "San Francisco",
    state: "CA",
    zip_code: "94103",
    country: "US",
    latitude: null,
    longitude: null,
    stripe_account_id: null,
    stripe_customer_id: "cus_demo_1",
  },
  {
    id: DEMO_PATIENT_IDS[1],
    role: "patient" as ProfileRole,
    full_name: "Maria Garcia",
    email: "maria.garcia@example.com",
    avatar_url: null,
    phone: "+1 (555) 345-6789",
    created_at: "2024-07-10T00:00:00.000Z",
    updated_at: iso(now),
    license_number: null,
    specialties: [],
    bio: null,
    timezone: "America/Los_Angeles",
    language: "en",
    date_of_birth: "1990-08-22",
    insurance_provider: "Aetna",
    insurance_id: "AET-111222",
    emergency_contact_name: "Carlos Garcia",
    emergency_contact_phone: "+1 (555) 888-1111",
    address_line1: "789 Pine Rd",
    address_line2: null,
    city: "Oakland",
    state: "CA",
    zip_code: "94601",
    country: "US",
    latitude: null,
    longitude: null,
    stripe_account_id: null,
    stripe_customer_id: null,
  },
  {
    id: DEMO_PATIENT_IDS[2],
    role: "patient" as ProfileRole,
    full_name: "Alex Thompson",
    email: "alex.thompson@example.com",
    avatar_url: null,
    phone: "+1 (555) 456-7890",
    created_at: "2024-08-01T00:00:00.000Z",
    updated_at: iso(now),
    license_number: null,
    specialties: [],
    bio: null,
    timezone: "America/Los_Angeles",
    language: "en",
    date_of_birth: "1978-11-05",
    insurance_provider: "United Healthcare",
    insurance_id: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    address_line1: "321 Elm St",
    address_line2: null,
    city: "Berkeley",
    state: "CA",
    zip_code: "94701",
    country: "US",
    latitude: null,
    longitude: null,
    stripe_account_id: null,
    stripe_customer_id: null,
  },
  {
    id: DEMO_PATIENT_IDS[3],
    role: "patient" as ProfileRole,
    full_name: "Jordan Lee",
    email: "jordan.lee@example.com",
    avatar_url: null,
    phone: "+1 (555) 567-8901",
    created_at: "2024-09-15T00:00:00.000Z",
    updated_at: iso(now),
    license_number: null,
    specialties: [],
    bio: null,
    timezone: "America/Los_Angeles",
    language: "en",
    date_of_birth: "1995-01-30",
    insurance_provider: "Kaiser",
    insurance_id: "KAI-555666",
    emergency_contact_name: "Sam Lee",
    emergency_contact_phone: "+1 (555) 777-2222",
    address_line1: "100 Demo Blvd",
    address_line2: null,
    city: "San Francisco",
    state: "CA",
    zip_code: "94105",
    country: "US",
    latitude: null,
    longitude: null,
    stripe_account_id: null,
    stripe_customer_id: null,
  },
  {
    id: DEMO_PATIENT_IDS[4],
    role: "patient" as ProfileRole,
    full_name: "Riley Davis",
    email: "riley.davis@example.com",
    avatar_url: null,
    phone: "+1 (555) 678-9012",
    created_at: "2024-10-01T00:00:00.000Z",
    updated_at: iso(now),
    license_number: null,
    specialties: [],
    bio: null,
    timezone: "America/Los_Angeles",
    language: "en",
    date_of_birth: "1988-06-12",
    insurance_provider: "Cigna",
    insurance_id: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    address_line1: "555 Demo Lane",
    address_line2: "Suite 3",
    city: "San Jose",
    state: "CA",
    zip_code: "95110",
    country: "US",
    latitude: null,
    longitude: null,
    stripe_account_id: null,
    stripe_customer_id: null,
  },
  {
    id: DEMO_PATIENT_IDS[5],
    role: "patient" as ProfileRole,
    full_name: "Surya Kukkapalli",
    email: "surya.kukkapalli@example.com",
    avatar_url: null,
    phone: "+1 (555) 710-4321",
    created_at: "2024-10-15T00:00:00.000Z",
    updated_at: iso(now),
    license_number: null,
    specialties: [],
    bio: "Software engineer and recreational runner rehabbing a right ACL reconstruction. Goals: return to 10K distance and pain-free hiking.",
    timezone: "America/Los_Angeles",
    language: "en",
    date_of_birth: "1992-04-18",
    insurance_provider: "Blue Shield",
    insurance_id: "BSH-443211",
    emergency_contact_name: "Yvonne Chan",
    emergency_contact_phone: "+1 (555) 710-9876",
    address_line1: "101 Sunset Way",
    address_line2: "Unit 12",
    city: "San Francisco",
    state: "CA",
    zip_code: "94107",
    country: "US",
    latitude: null,
    longitude: null,
    stripe_account_id: null,
    stripe_customer_id: "cus_demo_surya",
  },
];

// Appointments: mix of today, this week, and past
function buildDemoAppointments(): Appointment[] {
  const base = new Date(todayStart);
  const apts: Appointment[] = [];
  const statuses: AppointmentStatus[] = ["scheduled", "confirmed", "completed", "scheduled", "completed"];
  const types: TreatmentType[] = ["initial_evaluation", "follow_up", "manual_therapy", "exercise_therapy", "follow_up"];

  DEMO_PATIENT_IDS.forEach((patientId, i) => {
    // Today
    const startToday = new Date(base);
    startToday.setHours(9 + i, 30, 0, 0);
    const endToday = new Date(startToday);
    endToday.setMinutes(90);
    apts.push({
      id: `c0000000-0000-4000-8000-00000000000${i + 1}`,
      therapist_id: DEMO_THERAPIST_ID,
      patient_id: patientId,
      start_time: iso(startToday),
      end_time: iso(endToday),
      status: i < 2 ? "scheduled" : "completed",
      treatment_type: types[i],
      title: null,
      notes: i === 0 ? "Follow-up on lower back" : null,
      is_recurring: false,
      recurrence_rule: null,
      parent_appointment_id: null,
      reminder_email_sent_at: null,
      reminder_sms_sent_at: null,
      video_call_url: i === 0 ? "https://meet.demo.example.com/room1" : null,
      created_at: iso(now),
      updated_at: iso(now),
    });
    // Tomorrow
    const startTomorrow = new Date(base);
    startTomorrow.setDate(startTomorrow.getDate() + 1);
    startTomorrow.setHours(10 + i, 0, 0, 0);
    const endTomorrow = new Date(startTomorrow);
    endTomorrow.setMinutes(60);
    apts.push({
      id: `c0000000-0000-4000-8000-00000000001${i}`,
      therapist_id: DEMO_THERAPIST_ID,
      patient_id: patientId,
      start_time: iso(startTomorrow),
      end_time: iso(endTomorrow),
      status: "scheduled",
      treatment_type: "follow_up",
      title: null,
      notes: null,
      is_recurring: false,
      recurrence_rule: null,
      parent_appointment_id: null,
      reminder_email_sent_at: null,
      reminder_sms_sent_at: null,
      video_call_url: null,
      created_at: iso(now),
      updated_at: iso(now),
    });
    // Past (last week)
    const past = new Date(base);
    past.setDate(past.getDate() - 5 - i);
    past.setHours(14, 0, 0, 0);
    const pastEnd = new Date(past);
    pastEnd.setMinutes(60);
    apts.push({
      id: `c0000000-0000-4000-8000-00000000002${i}`,
      therapist_id: DEMO_THERAPIST_ID,
      patient_id: patientId,
      start_time: iso(past),
      end_time: iso(pastEnd),
      status: "completed",
      treatment_type: types[i],
      title: null,
      notes: null,
      is_recurring: false,
      recurrence_rule: null,
      parent_appointment_id: null,
      reminder_email_sent_at: null,
      reminder_sms_sent_at: null,
      video_call_url: null,
      created_at: iso(now),
      updated_at: iso(now),
    });
  });

  return apts.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

export const DEMO_APPOINTMENTS = buildDemoAppointments();

// Messages: therapist <-> patients
export const DEMO_MESSAGES: Message[] = (() => {
  const list: Message[] = [];
  const tid = DEMO_THERAPIST_ID;
  const created = new Date(now);
  created.setDate(created.getDate() - 2);

  DEMO_PATIENT_IDS.slice(0, 4).forEach((pid, i) => {
    const fromTherapist: Message = {
      id: `d0000000-0000-4000-8000-00000000000${i * 2 + 1}`,
      sender_id: tid,
      recipient_id: pid,
      patient_id: pid,
      subject: "Re: Your next appointment",
      body: `Hi, just confirming your appointment this week. Please arrive 10 minutes early to complete any paperwork. Let me know if you have questions.`,
      read_at: iso(created),
      created_at: iso(created),
    };
    created.setHours(created.getHours() + 1);
    const fromPatient: Message = {
      id: `d0000000-0000-4000-8000-00000000000${i * 2 + 2}`,
      sender_id: pid,
      recipient_id: tid,
      patient_id: pid,
      subject: null,
      body: "Thanks, I'll be there. Should I bring my imaging results?",
      read_at: null,
      created_at: iso(created),
    };
    list.push(fromTherapist, fromPatient);
  });

  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
})();

// Medical records (SOAP) – one per completed appointment, varied content so every patient has accessible records
const SOAP_TEMPLATES: Array<{
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}> = [
  {
    subjective:
      "Patient reports improvement in lower back stiffness since last visit. Denies new pain or radicular symptoms. Has been compliant with HEP 5x/week. Occasional morning stiffness (≈15 min) that eases with movement.",
    objective:
      "Lumbar AROM: Flexion 80% WNL, extension 50% WNL, side bending 75% bilaterally. MMT: Trunk 4+/5. Single-leg stance 25 sec each. No reproduction of symptoms with repeated motion testing.",
    assessment:
      "Lumbar strain, improving. Patient meeting goals for ROM and strength. Good tolerance to current exercise progression.",
    plan:
      "Continue current HEP. Progress to resisted trunk rotation. Add prone extension holds. Reassess in 1 week. Consider discharge planning if goals met next visit.",
  },
  {
    subjective:
      "Patient states shoulder pain has decreased from 6/10 to 3/10 at rest. Still notes pain with overhead activities and reaching behind back. Using ice after exercises as instructed.",
    objective:
      "Shoulder AROM: Flexion 140°, abduction 130°, IR 45°, ER 65°. MMT: Rotator cuff 4/5. Hawkins positive. Empty can test mild discomfort. Scapular mobility WNL.",
    assessment:
      "Rotator cuff tendinopathy, improving. ROM and strength gains noted. Scapulothoracic control adequate.",
    plan:
      "Progress strengthening (bands). Add functional overhead drills. Continue manual therapy 1x/week. Follow up in 1 week.",
  },
  {
    subjective:
      "Knee feels more stable with daily activities. Reports 2 episodes of mild swelling after longer walks. No giving-way. Compliant with quad sets and step-downs.",
    objective:
      "Knee AROM 0–125°. Effusion trace. Quad strength 4/5. Single-leg squat with good control. Step-down 6\" without pain. Patellar mobility WNL.",
    assessment:
      "Post-Meniscus repair, progressing well. Quad strength and proprioception improving. Ready for impact progression.",
    plan:
      "Introduce light jogging program (alternate days). Continue strength and proprioception. Reassess in 2 weeks.",
  },
  {
    subjective:
      "Patient reports neck pain and headaches 2–3x/week, down from daily. Desk work still provocative. Has adjusted workstation per recommendations.",
    objective:
      "Cervical AROM 85% WNL all planes. Upper trap and levator scalene tender to palpation. MMT 5/5 throughout. Posture improved in sitting.",
    assessment:
      "Cervicogenic headache and myofascial pain, improving. Postural and ergonomic changes helping.",
    plan:
      "Continue cervical stretching and scapular strengthening. Soft tissue to upper trap/levator. Recheck in 1 week.",
  },
  {
    subjective:
      "Ankle stiffness and swelling have improved. Patient is walking 20 min daily without significant pain. Occasional ache with uneven surfaces.",
    objective:
      "Ankle AROM: DF 12°, PF 45°, inversion/eversion 75% WNL. Single-leg balance 30 sec. Calf strength 4+/5. No ligament laxity.",
    assessment:
      "Ankle sprain (grade II), resolving. Good progress with ROM and stability. Ready for light agility work.",
    plan:
      "Add lateral movements and figure-8s. Progress to double-leg then single-leg hops. Discharge in 2 weeks if goals met.",
  },
  {
    subjective:
      "Low back and hip pain improved with home exercises. Still notices stiffness after prolonged sitting. Denies leg symptoms.",
    objective:
      "Hip IR/ER improved. Thomas test negative. Prone hip extension 4/5. Lumbar mobility 80% WNL. No neural tension signs.",
    assessment:
      "Hip/lumbar dysfunction, improving. Core and hip strength gains noted.",
    plan:
      "Progress to single-leg deadlift and hip rotation drills. Consider discharge after next 2 visits if stable.",
  },
  {
    subjective:
      "Patient reports good compliance with HEP. Shoulder pain 2/10 with ADLs. Still limited with heavy lifting and sustained overhead work.",
    objective:
      "Shoulder AROM full. Strength 4+/5 rotator cuff, 5/5 deltoid. Impingement tests negative. Good scapular control with resisted motions.",
    assessment:
      "Subacromial impingement, much improved. Strength and mechanics normalized.",
    plan:
      "Finalize HEP for long-term maintenance. Discharge with home program. Return as needed.",
  },
  {
    subjective:
      "Knee pain minimal. Patient has returned to gym for stationary bike and leg press. No swelling or instability. Goals are to return to recreational tennis.",
    objective:
      "Knee AROM full. Quad 5/5. Single-leg hop symmetry 90%. Agility ladder and change of direction tolerated well.",
    assessment:
      "Post-ACL rehab, excellent progress. Ready for sport-specific progression.",
    plan:
      "Sport-specific drills (cutting, pivoting). Gradual return to tennis over next 4–6 weeks. Discharge when cleared for full play.",
  },
];

export const DEMO_MEDICAL_RECORDS: MedicalRecord[] = (() => {
  const completed = DEMO_APPOINTMENTS.filter((a) => a.status === "completed");
  return completed.slice(0, SOAP_TEMPLATES.length).map((apt, i) => {
    const t = SOAP_TEMPLATES[i % SOAP_TEMPLATES.length];
    const isDraft = i % 3 === 0;
    return {
      id: `e0000000-0000-4000-8000-00000000000${i + 1}`,
      appointment_id: apt.id,
      therapist_id: DEMO_THERAPIST_ID,
      patient_id: apt.patient_id,
      subjective: t.subjective,
      objective: t.objective,
      assessment: t.assessment,
      plan: t.plan,
      body_map_annotations: {},
      status: (isDraft ? "draft" : "finalized") as RecordStatus,
      version: 1,
      parent_record_id: null,
      finalized_at: isDraft ? null : iso(now),
      finalized_by: isDraft ? null : DEMO_THERAPIST_ID,
      therapist_signature: null,
      created_at: apt.end_time,
      updated_at: iso(now),
    };
  });
})();

// Recovery milestones
export const DEMO_MILESTONES: RecoveryMilestone[] = [
  {
    id: "f0000000-0000-4000-8000-000000000001",
    patient_id: DEMO_PATIENT_IDS[0],
    therapist_id: DEMO_THERAPIST_ID,
    title: "Full ROM lumbar spine",
    description: "Restore full flexion/extension without pain",
    status: "in_progress" as MilestoneStatus,
    category: "rom_goal" as MilestoneCategory,
    target_date: iso(new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)),
    completed_date: null,
    progress: 65,
    created_at: "2024-11-01T00:00:00.000Z",
    updated_at: iso(now),
  },
  {
    id: "f0000000-0000-4000-8000-000000000002",
    patient_id: DEMO_PATIENT_IDS[0],
    therapist_id: DEMO_THERAPIST_ID,
    title: "Return to running",
    description: "Gradual return to running program",
    status: "future" as MilestoneStatus,
    category: "functional_goal" as MilestoneCategory,
    target_date: iso(new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000)),
    completed_date: null,
    progress: 0,
    created_at: "2024-11-01T00:00:00.000Z",
    updated_at: iso(now),
  },
  {
    id: "f0000000-0000-4000-8000-000000000003",
    patient_id: DEMO_PATIENT_IDS[1],
    therapist_id: DEMO_THERAPIST_ID,
    title: "Shoulder strength 5/5",
    description: "MMT 5/5 all planes",
    status: "completed" as MilestoneStatus,
    category: "strength_goal" as MilestoneCategory,
    target_date: iso(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
    completed_date: iso(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
    progress: 100,
    created_at: "2024-10-01T00:00:00.000Z",
    updated_at: iso(now),
  },
  {
    id: "f0000000-0000-4000-8000-000000000004",
    patient_id: DEMO_PATIENT_IDS[5],
    therapist_id: DEMO_THERAPIST_ID,
    title: "Jog 20 minutes pain-free",
    description: "Continuous jog on flat surface without knee swelling or instability within 24 hours.",
    status: "in_progress" as MilestoneStatus,
    category: "functional_goal" as MilestoneCategory,
    target_date: iso(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)),
    completed_date: null,
    progress: 40,
    created_at: "2024-12-01T00:00:00.000Z",
    updated_at: iso(now),
  },
  {
    id: "f0000000-0000-4000-8000-000000000005",
    patient_id: DEMO_PATIENT_IDS[5],
    therapist_id: DEMO_THERAPIST_ID,
    title: "Single-leg strength 5/5",
    description: "Quad and hamstring strength 5/5 with single-leg squat x10 each side.",
    status: "future" as MilestoneStatus,
    category: "strength_goal" as MilestoneCategory,
    target_date: iso(new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)),
    completed_date: null,
    progress: 0,
    created_at: "2024-12-01T00:00:00.000Z",
    updated_at: iso(now),
  },
];

// Exercise demo data
export const DEMO_EXERCISE_TEMPLATES = [
  {
    id: "x0000000-0000-4000-8000-000000000001",
    name: "Bodyweight Squat",
    image_url:
      "https://images.pexels.com/photos/414029/pexels-photo-414029.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "x0000000-0000-4000-8000-000000000002",
    name: "Single-Leg Bridge",
    image_url:
      "https://images.pexels.com/photos/3756523/pexels-photo-3756523.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: "x0000000-0000-4000-8000-000000000003",
    name: "Side Plank",
    image_url:
      "https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
] as const;

export const DEMO_EXERCISE_PLANS = [
  {
    id: "xp000000-0000-4000-8000-000000000001",
    patient_id: DEMO_PATIENT_IDS[0],
    therapist_id: DEMO_THERAPIST_ID,
    title: "Lumbar Stability & Hip Strength (Week 1–4)",
    description: "Core and hip stability focus, 3x/week. Progress load as tolerated, keep pain ≤ 3/10.",
    start_date: "2024-11-01",
    end_date: null,
    is_active: true,
    created_at: iso(now),
  },
  {
    id: "xp000000-0000-4000-8000-000000000002",
    patient_id: DEMO_PATIENT_IDS[5],
    therapist_id: DEMO_THERAPIST_ID,
    title: "ACL Phase II – Strength & Control",
    description: "Focus on unilateral strength and control to prepare for light jogging. 4x/week.",
    start_date: "2024-12-10",
    end_date: null,
    is_active: true,
    created_at: iso(now),
  },
] as const;

export const DEMO_EXERCISE_PLAN_ITEMS = [
  {
    id: "xpi00000-0000-4000-8000-000000000001",
    exercise_plan_id: DEMO_EXERCISE_PLANS[0].id,
    exercise_template_id: DEMO_EXERCISE_TEMPLATES[0].id,
    sequence_order: 1,
    sets: 3,
    reps: 10,
    hold_seconds: null,
    rest_seconds: 45,
    frequency_per_week: 3,
    days_of_week: ["mon", "wed", "fri"],
    notes: "Slow and controlled, focus on neutral spine.",
  },
  {
    id: "xpi00000-0000-4000-8000-000000000002",
    exercise_plan_id: DEMO_EXERCISE_PLANS[0].id,
    exercise_template_id: DEMO_EXERCISE_TEMPLATES[1].id,
    sequence_order: 2,
    sets: 3,
    reps: 8,
    hold_seconds: 5,
    rest_seconds: 60,
    frequency_per_week: 3,
    days_of_week: ["mon", "wed", "fri"],
    notes: "Keep pelvis level, no lumbar extension.",
  },
  {
    id: "xpi00000-0000-4000-8000-000000000003",
    exercise_plan_id: DEMO_EXERCISE_PLANS[0].id,
    exercise_template_id: DEMO_EXERCISE_TEMPLATES[2].id,
    sequence_order: 3,
    sets: 3,
    reps: null,
    hold_seconds: 20,
    rest_seconds: 45,
    frequency_per_week: 3,
    days_of_week: ["mon", "wed", "fri"],
    notes: "Stack shoulder over elbow, keep hips in line.",
  },
  {
    id: "xpi00000-0000-4000-8000-000000000004",
    exercise_plan_id: DEMO_EXERCISE_PLANS[1].id,
    exercise_template_id: DEMO_EXERCISE_TEMPLATES[0].id,
    sequence_order: 1,
    sets: 3,
    reps: 12,
    hold_seconds: null,
    rest_seconds: 60,
    frequency_per_week: 4,
    days_of_week: ["mon", "tue", "thu", "sat"],
    notes: "Bodyweight squats to chair height, focus on knee alignment.",
  },
  {
    id: "xpi00000-0000-4000-8000-000000000005",
    exercise_plan_id: DEMO_EXERCISE_PLANS[1].id,
    exercise_template_id: DEMO_EXERCISE_TEMPLATES[1].id,
    sequence_order: 2,
    sets: 3,
    reps: 10,
    hold_seconds: 5,
    rest_seconds: 60,
    frequency_per_week: 4,
    days_of_week: ["mon", "tue", "thu", "sat"],
    notes: "Single-leg bridges on right leg, stop if pain > 3/10.",
  },
  {
    id: "xpi00000-0000-4000-8000-000000000006",
    exercise_plan_id: DEMO_EXERCISE_PLANS[1].id,
    exercise_template_id: DEMO_EXERCISE_TEMPLATES[2].id,
    sequence_order: 3,
    sets: 3,
    reps: null,
    hold_seconds: 30,
    rest_seconds: 45,
    frequency_per_week: 4,
    days_of_week: ["mon", "tue", "thu", "sat"],
    notes: "Side plank on forearm, progress to feet as tolerated.",
  },
] as const;

export const DEMO_EXERCISE_RECOMMENDATIONS = [
  {
    id: "xr000000-0000-4000-8000-000000000001",
    patient_id: DEMO_PATIENT_IDS[0],
    therapist_id: DEMO_THERAPIST_ID,
    exercise_plan_id: DEMO_EXERCISE_PLANS[0].id,
    exercise_plan_item_id: DEMO_EXERCISE_PLAN_ITEMS[0].id,
    recommendation_type: "technique",
    status: "open",
    title: "Slow down your squats",
    body: "Great work staying consistent. For the next week, slow your squats down to a 3-second lower and 2-second rise. This will improve control and reduce morning stiffness.",
    is_patient_visible: true,
    created_by_system: false,
    created_at: iso(now),
    resolved_at: null,
  },
  {
    id: "xr000000-0000-4000-8000-000000000002",
    patient_id: DEMO_PATIENT_IDS[0],
    therapist_id: DEMO_THERAPIST_ID,
    exercise_plan_id: DEMO_EXERCISE_PLANS[0].id,
    exercise_plan_item_id: DEMO_EXERCISE_PLAN_ITEMS[1].id,
    recommendation_type: "adherence",
    status: "in_progress",
    title: "Aim for 3 sessions this week",
    body: "You completed 2 sessions last week. Let’s aim for 3 this week. Shorter but more frequent sessions are better than long inconsistent ones.",
    is_patient_visible: true,
    created_by_system: false,
    created_at: iso(now),
    resolved_at: null,
  },
  {
    id: "xr000000-0000-4000-8000-000000000003",
    patient_id: DEMO_PATIENT_IDS[5],
    therapist_id: DEMO_THERAPIST_ID,
    exercise_plan_id: DEMO_EXERCISE_PLANS[1].id,
    exercise_plan_item_id: DEMO_EXERCISE_PLAN_ITEMS[3].id,
    recommendation_type: "technique",
    status: "open",
    title: "Control knee position on squats",
    body: "Surya, keep your right knee tracking over your second toe. Slow down the lowering phase to 3 seconds to improve control.",
    is_patient_visible: true,
    created_by_system: false,
    created_at: iso(now),
    resolved_at: null,
  },
  {
    id: "xr000000-0000-4000-8000-000000000004",
    patient_id: DEMO_PATIENT_IDS[5],
    therapist_id: DEMO_THERAPIST_ID,
    exercise_plan_id: DEMO_EXERCISE_PLANS[1].id,
    exercise_plan_item_id: DEMO_EXERCISE_PLAN_ITEMS[4].id,
    recommendation_type: "adherence",
    status: "in_progress",
    title: "Nice consistency – let’s keep 4x/week",
    body: "You hit 4 sessions last week. Great job. Maintain this for the next 2 weeks so we can safely start a jog-walk program.",
    is_patient_visible: true,
    created_by_system: false,
    created_at: iso(now),
    resolved_at: null,
  },
] as const;

export const DEMO_EXERCISE_SESSIONS = [
  {
    id: "xs000000-0000-4000-8000-000000000001",
    patient_id: DEMO_PATIENT_IDS[5],
    exercise_plan_id: DEMO_EXERCISE_PLANS[1].id,
    exercise_plan_item_id: DEMO_EXERCISE_PLAN_ITEMS[3].id,
    started_at: iso(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
    completed_at: iso(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000)),
    total_sets_completed: 3,
    total_reps_completed: 36,
    average_pain_score: 2,
    average_effort: 6,
    notes: "Knee felt stable, mild quad fatigue at end.",
  },
  {
    id: "xs000000-0000-4000-8000-000000000002",
    patient_id: DEMO_PATIENT_IDS[5],
    exercise_plan_id: DEMO_EXERCISE_PLANS[1].id,
    exercise_plan_item_id: DEMO_EXERCISE_PLAN_ITEMS[4].id,
    started_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
    completed_at: iso(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000)),
    total_sets_completed: 3,
    total_reps_completed: 30,
    average_pain_score: 3,
    average_effort: 7,
    notes: "Right hamstring working hard, no joint pain.",
  },
  {
    id: "xs000000-0000-4000-8000-000000000003",
    patient_id: DEMO_PATIENT_IDS[5],
    exercise_plan_id: DEMO_EXERCISE_PLANS[1].id,
    exercise_plan_item_id: DEMO_EXERCISE_PLAN_ITEMS[5].id,
    started_at: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
    completed_at: iso(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000)),
    total_sets_completed: 3,
    total_reps_completed: 0,
    average_pain_score: 1,
    average_effort: 5,
    notes: "Side planks felt solid, minor shoulder fatigue only.",
  },
] as const;

// Payments
export const DEMO_PAYMENTS = (() => {
  const rows: Array<{
    id: string;
    appointment_id: string | null;
    therapist_id: string;
    patient_id: string;
    amount_cents: number;
    currency: string;
    status: PaymentStatus;
    stripe_payment_intent_id: string | null;
    stripe_checkout_session_id: string | null;
    stripe_charge_id: string | null;
    description: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  }> = [];
  const completedApts = DEMO_APPOINTMENTS.filter((a) => a.status === "completed").slice(0, 6);
  completedApts.forEach((apt, i) => {
    const d = new Date(apt.start_time);
    d.setDate(d.getDate() - i);
    const treatmentLabel = (apt.treatment_type ?? "visit").toString().replace(/_/g, " ");
    rows.push({
      id: `p0000000-0000-4000-8000-00000000000${i + 1}`,
      appointment_id: apt.id,
      therapist_id: DEMO_THERAPIST_ID,
      patient_id: apt.patient_id,
      amount_cents: 15000 + i * 500,
      currency: "usd",
      status: i < 4 ? ("succeeded" as PaymentStatus) : ("pending" as PaymentStatus),
      stripe_payment_intent_id: `pi_demo_${i}`,
      stripe_checkout_session_id: null,
      stripe_charge_id: null,
      description: "PT visit - " + treatmentLabel,
      metadata: {},
      created_at: iso(d),
      updated_at: iso(now),
    });
  });
  return rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
})();

// Gamification progress for demo (patient-focused + recovery)
export const DEMO_PROGRESS = {
  patientCount: 5,
  recoveredCount: 1,
  recoveryRate: 20, // 1 of 5 = 20%
  totalXp: 5,
  level: 2,
  currentStreakDays: 0,
  lastActivityDate: null,
  progressInLevel: { current: 0, required: 5, percent: 0 },
  achievements: [
    { achievement_key: "first_patient", unlocked_at: iso(now) },
    { achievement_key: "patients_5", unlocked_at: iso(now) },
    { achievement_key: "first_recovery", unlocked_at: iso(now) },
  ],
};

// Helpers for pages
export function getDemoDashboardStats() {
  const todayCount = DEMO_APPOINTMENTS.filter(
    (a) => new Date(a.start_time) >= todayStart && new Date(a.start_time) <= todayEnd
  ).length;
  const startOfWeek = new Date(todayStart);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  const weekCount = DEMO_APPOINTMENTS.filter(
    (a) => new Date(a.start_time) >= startOfWeek && new Date(a.start_time) <= endOfWeek
  ).length;
  const uniquePatients = new Set(DEMO_APPOINTMENTS.map((a) => a.patient_id)).size;
  const pendingNotes = DEMO_MEDICAL_RECORDS.filter((r) => r.status === "draft").length;

  return {
    todayAppointments: todayCount,
    weekAppointments: weekCount,
    activePatients: uniquePatients,
    pendingNotes,
  };
}

export function getDemoUpcomingAppointments(limit = 5): (Appointment & { patient_name?: string | null })[] {
  const patientNames = Object.fromEntries(DEMO_PATIENTS.map((p) => [p.id, p.full_name ?? null]));
  return DEMO_APPOINTMENTS.filter((a) => new Date(a.start_time) >= now && a.status === "scheduled")
    .slice(0, limit)
    .map((a) => ({ ...a, patient_name: patientNames[a.patient_id] ?? null }));
}

export function getDemoConversations(): Array<{ other: Profile; lastMessage: Message; unread: boolean }> {
  const byPatient = new Map<string, Message>();
  for (const m of DEMO_MESSAGES) {
    const pid = m.patient_id ?? m.recipient_id;
    const existing = byPatient.get(pid);
    if (!existing || new Date(m.created_at) > new Date(existing.created_at)) {
      byPatient.set(pid, m);
    }
  }
  const profileMap = new Map(DEMO_PATIENTS.map((p) => [p.id, p]));
  return Array.from(byPatient.entries())
    .map(([patientId, lastMessage]) => {
      const other = profileMap.get(patientId);
      if (!other) return null;
      return { other, lastMessage, unread: !lastMessage.read_at };
    })
    .filter(Boolean) as Array<{ other: Profile; lastMessage: Message; unread: boolean }>;
}

export function getDemoPaymentsThisMonth(): number {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return DEMO_PAYMENTS.filter(
    (p) => p.status === "succeeded" && new Date(p.created_at) >= startOfMonth
  ).reduce((sum, p) => sum + p.amount_cents, 0);
}
