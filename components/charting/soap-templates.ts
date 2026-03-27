// Common Physical Therapy SOAP Note Templates
// Organized by section and condition type

export interface SOAPTemplate {
  id: string;
  label: string;
  content: string;
  category: string;
  section: "subjective" | "objective" | "assessment" | "plan";
}

export const soapTemplates: SOAPTemplate[] = [
  // SUBJECTIVE TEMPLATES
  {
    id: "subj-pain-1",
    label: "Pain Description - Acute",
    content: "Patient reports sharp, localized pain in [location] that began [timeframe] ago. Pain is rated [0-10] on a scale of 10. Pain is aggravated by [activity] and relieved by [relief method].",
    category: "Pain",
    section: "subjective",
  },
  {
    id: "subj-pain-2",
    label: "Pain Description - Chronic",
    content: "Patient reports chronic [dull/sharp/aching] pain in [location] for [duration]. Pain intensity varies throughout the day, worst in [morning/evening]. Patient states pain affects [ADLs/sleep/work].",
    category: "Pain",
    section: "subjective",
  },
  {
    id: "subj-stiffness",
    label: "Stiffness/Mobility",
    content: "Patient reports stiffness in [location], particularly in the [morning/after rest]. Stiffness typically resolves after [time/activity]. Patient notes difficulty with [specific movement/activity].",
    category: "Mobility",
    section: "subjective",
  },
  {
    id: "subj-weakness",
    label: "Weakness",
    content: "Patient reports feeling weak in [location] and difficulty with [specific activity]. States [lifting/carrying/walking] has become more challenging. Denies numbness or tingling.",
    category: "Strength",
    section: "subjective",
  },
  {
    id: "subj-fall",
    label: "Fall/Injury Mechanism",
    content: "Patient reports [mechanism of injury] on [date]. Initial symptoms included [symptoms]. Patient sought [medical attention/self-treatment]. Current symptoms have [improved/worsened/remained stable].",
    category: "Injury",
    section: "subjective",
  },
  {
    id: "subj-post-surgical",
    label: "Post-Surgical",
    content: "Patient is [X] weeks post-op [procedure] on [date]. Reports [pain level] pain, [swelling/bruising] present. Patient states [compliance with post-op instructions]. No signs of infection reported.",
    category: "Post-Surgical",
    section: "subjective",
  },
  {
    id: "subj-progress",
    label: "Progress Update",
    content: "Patient reports [improvement/no change/worsening] since last visit. States [specific improvements]. Still experiencing [ongoing symptoms]. Patient is [compliant/partially compliant] with home exercise program.",
    category: "Progress",
    section: "subjective",
  },

  // OBJECTIVE TEMPLATES
  {
    id: "obj-posture",
    label: "Posture Assessment",
    content: "Posture: [forward head/rounded shoulders/increased kyphosis/lordosis]. Gait: [normal/antalgic/limping]. Patient demonstrates [postural deviations]. No obvious deformities noted.",
    category: "Posture",
    section: "objective",
  },
  {
    id: "obj-rom",
    label: "Range of Motion",
    content: "ROM: [joint] - [degrees] degrees [flexion/extension/abduction/etc]. Limited by [pain/stiffness]. End feel: [firm/boggy/empty]. Compensatory movements noted: [yes/no].",
    category: "ROM",
    section: "objective",
  },
  {
    id: "obj-strength",
    label: "Manual Muscle Testing",
    content: "MMT: [muscle/joint] - [grade/5]. Pain with resistance: [yes/no]. Break test: [passed/failed]. Patient demonstrates [weakness pattern]. Functional strength: [adequate/limited].",
    category: "Strength",
    section: "objective",
  },
  {
    id: "obj-palpation",
    label: "Palpation",
    content: "Palpation: Tenderness noted at [location]. [Swelling/edema] present. Muscle tone: [normal/increased/decreased]. Trigger points: [location if present]. Skin temperature: [normal/increased].",
    category: "Palpation",
    section: "objective",
  },
  {
    id: "obj-special-tests",
    label: "Special Tests",
    content: "Special tests: [test name] - [positive/negative]. [Test name] - [positive/negative]. Findings consistent with [condition/diagnosis]. Neurological screen: [intact/abnormal].",
    category: "Special Tests",
    section: "objective",
  },
  {
    id: "obj-functional",
    label: "Functional Assessment",
    content: "Functional assessment: Patient demonstrates [ability/limitation] with [activity]. [Balance/coordination] - [normal/impaired]. Patient able to [specific task] with [assistance level].",
    category: "Functional",
    section: "objective",
  },
  {
    id: "obj-gait",
    label: "Gait Analysis",
    content: "Gait: [normal/antalgic/trendelenburg/etc]. Stance phase: [normal/abnormal]. Swing phase: [normal/abnormal]. Assistive device: [none/cane/walker]. Distance ambulated: [feet/meters].",
    category: "Gait",
    section: "objective",
  },
  {
    id: "obj-measurements",
    label: "Objective Measurements",
    content: "Measurements: [circumference/edema/girth] - [value] [units]. Comparison to contralateral: [difference]. Edema: [present/absent], [pitting/non-pitting]. Skin integrity: [intact/compromised].",
    category: "Measurements",
    section: "objective",
  },

  // ASSESSMENT TEMPLATES
  {
    id: "assess-acute",
    label: "Acute Condition Assessment",
    content: "Patient presents with [diagnosis] secondary to [cause]. Clinical findings consistent with [condition]. Patient demonstrates [impairments]. Prognosis: [good/fair/guarded].",
    category: "Assessment",
    section: "assessment",
  },
  {
    id: "assess-chronic",
    label: "Chronic Condition Assessment",
    content: "Patient presents with chronic [condition]. Contributing factors include [factors]. Patient demonstrates [impairments/limitations]. Functional limitations: [list]. Patient would benefit from [treatment approach].",
    category: "Assessment",
    section: "assessment",
  },
  {
    id: "assess-post-surgical",
    label: "Post-Surgical Assessment",
    content: "Patient is [X] weeks post-op [procedure]. Healing appears [appropriate/delayed]. Range of motion and strength are [within expected limits/below expected]. Patient progressing [appropriately/slowly].",
    category: "Post-Surgical",
    section: "assessment",
  },
  {
    id: "assess-progress",
    label: "Progress Assessment",
    content: "Patient demonstrates [improvement/no change/regression] since last visit. [Specific improvements noted]. Remaining impairments: [list]. Patient continues to benefit from physical therapy.",
    category: "Progress",
    section: "assessment",
  },
  {
    id: "assess-icf",
    label: "ICF Framework Assessment",
    content: "Body structure/function: [impairments]. Activity limitations: [limitations]. Participation restrictions: [restrictions]. Environmental factors: [barriers/facilitators]. Personal factors: [relevant factors].",
    category: "ICF",
    section: "assessment",
  },
  {
    id: "assess-discharge",
    label: "Discharge Readiness",
    content: "Patient has met [goals/objectives]. Functional status: [improved/maintained]. Patient demonstrates [independence level] with [activities]. Patient ready for [discharge/home program/community activities].",
    category: "Discharge",
    section: "assessment",
  },

  // PLAN TEMPLATES
  {
    id: "plan-treatment",
    label: "Treatment Plan",
    content: "Continue with [treatment interventions]. Focus on [specific goals]. Patient education: [topics]. Home exercise program: [exercises]. Frequency: [X]x/week for [duration]. Reassess in [timeframe].",
    category: "Treatment",
    section: "plan",
  },
  {
    id: "plan-exercises",
    label: "Exercise Program",
    content: "Home exercise program: [exercise list]. Progression: [progression plan]. Patient instructed on [technique/form]. Patient demonstrates understanding: [yes/no]. Frequency: [X] sets of [Y] reps, [Z]x/day.",
    category: "Exercise",
    section: "plan",
  },
  {
    id: "plan-modalities",
    label: "Modalities & Manual Therapy",
    content: "Treatment: [modality/manual technique] to [location] for [purpose]. Parameters: [settings/duration]. Patient response: [positive/negative]. Continue/modify/discontinue based on response.",
    category: "Modalities",
    section: "plan",
  },
  {
    id: "plan-goals",
    label: "Goals & Outcomes",
    content: "Short-term goals: [goals with timeframe]. Long-term goals: [goals with timeframe]. Expected outcomes: [outcomes]. Discharge criteria: [criteria]. Next visit: [date/focus].",
    category: "Goals",
    section: "plan",
  },
  {
    id: "plan-education",
    label: "Patient Education",
    content: "Patient educated on [topics]. Provided [handouts/resources]. Patient demonstrates understanding: [yes/no]. Discussed [precautions/contraindications]. Patient verbalized understanding of [key points].",
    category: "Education",
    section: "plan",
  },
  {
    id: "plan-discharge",
    label: "Discharge Planning",
    content: "Patient ready for discharge. Home program provided: [exercises/activities]. Follow-up: [recommendations]. Patient instructed on [self-management strategies]. Discharge to [home/community/other].",
    category: "Discharge",
    section: "plan",
  },
  {
    id: "plan-referral",
    label: "Referral/Consultation",
    content: "Recommend referral to [specialist] for [reason]. Patient will follow up with [provider] for [purpose]. Continue PT while awaiting [consultation/procedure]. Coordinate care with [provider].",
    category: "Referral",
    section: "plan",
  },
];

// Helper function to get templates by section
export function getTemplatesBySection(
  section: "subjective" | "objective" | "assessment" | "plan"
): SOAPTemplate[] {
  return soapTemplates.filter((template) => template.section === section);
}

// Helper function to search templates
export function searchTemplates(
  query: string,
  section?: "subjective" | "objective" | "assessment" | "plan"
): SOAPTemplate[] {
  const lowerQuery = query.toLowerCase();
  let filtered = soapTemplates;

  if (section) {
    filtered = filtered.filter((t) => t.section === section);
  }

  return filtered.filter(
    (template) =>
      template.label.toLowerCase().includes(lowerQuery) ||
      template.content.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery)
  );
}
