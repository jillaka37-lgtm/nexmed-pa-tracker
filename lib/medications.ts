export type Medication = {
  name: string;
  aliases: string[];
  category: string;
  uses: string;
  typicalDosage: string;
  sideEffects: string;
  warnings: string;
};

// Curated, general-education reference for common OTC and widely-known
// prescription medications — not a substitute for the patient information
// leaflet or pharmacist advice (same disclaimer as the rest of this page).
export const medications: Medication[] = [
  {
    name: "Acetaminophen",
    aliases: ["Tylenol", "Paracetamol"],
    category: "Pain & fever relief",
    uses: "Relieves mild to moderate pain and reduces fever.",
    typicalDosage: "Adults: 325–650mg every 4–6 hours as needed. Do not exceed 3,000–4,000mg per day.",
    sideEffects: "Generally well tolerated. Rare: nausea, rash.",
    warnings: "Exceeding the daily limit can cause serious liver damage. Avoid alcohol. Check other products for hidden acetaminophen to avoid doubling up.",
  },
  {
    name: "Ibuprofen",
    aliases: ["Advil", "Motrin"],
    category: "Pain & fever relief",
    uses: "Relieves pain, inflammation, and fever (an NSAID).",
    typicalDosage: "Adults: 200–400mg every 4–6 hours as needed. Do not exceed 1,200mg/day without medical advice.",
    sideEffects: "Stomach upset, heartburn, dizziness.",
    warnings: "Take with food. Avoid if you have stomach ulcers, kidney issues, or take blood thinners — ask a pharmacist first.",
  },
  {
    name: "Aspirin",
    aliases: [],
    category: "Pain & fever relief",
    uses: "Relieves pain and fever; low-dose used for heart-attack/stroke prevention under medical guidance.",
    typicalDosage: "Pain/fever: 325–650mg every 4 hours. Heart protection: low-dose (81mg) as directed by a doctor.",
    sideEffects: "Stomach upset, increased bleeding risk.",
    warnings: "Not recommended for children/teens with viral illness (risk of Reye's syndrome). Avoid with certain blood thinners without medical advice.",
  },
  {
    name: "Cetirizine",
    aliases: ["Zyrtec"],
    category: "Allergy relief",
    uses: "Relieves sneezing, itching, runny nose, and hives from allergies.",
    typicalDosage: "Adults: 10mg once daily.",
    sideEffects: "Mild drowsiness, dry mouth.",
    warnings: "Less sedating than older antihistamines, but check before driving until you know how it affects you.",
  },
  {
    name: "Loratadine",
    aliases: ["Claritin"],
    category: "Allergy relief",
    uses: "Non-drowsy relief for allergy symptoms like sneezing and itchy eyes.",
    typicalDosage: "Adults: 10mg once daily.",
    sideEffects: "Headache, rarely drowsiness.",
    warnings: "Generally non-sedating, but individual response varies.",
  },
  {
    name: "Diphenhydramine",
    aliases: ["Benadryl"],
    category: "Allergy relief",
    uses: "Relieves allergy symptoms and is also used as a short-term sleep aid.",
    typicalDosage: "Adults: 25–50mg every 4–6 hours as needed.",
    sideEffects: "Significant drowsiness, dry mouth, blurred vision.",
    warnings: "Do not drive or operate machinery. Avoid with alcohol. Use caution in older adults (higher fall/confusion risk).",
  },
  {
    name: "Pseudoephedrine",
    aliases: ["Sudafed"],
    category: "Cold & flu",
    uses: "Relieves nasal and sinus congestion.",
    typicalDosage: "Adults: 60mg every 4–6 hours, max 240mg/day.",
    sideEffects: "Increased heart rate, jitteriness, trouble sleeping.",
    warnings: "Avoid if you have high blood pressure or heart conditions without medical advice. Kept behind the pharmacy counter in many regions.",
  },
  {
    name: "Dextromethorphan",
    aliases: ["Robitussin DM", "Delsym"],
    category: "Cold & flu",
    uses: "Suppresses dry, non-productive cough.",
    typicalDosage: "Adults: follow product label, typically every 6–12 hours depending on formulation.",
    sideEffects: "Drowsiness, dizziness, nausea.",
    warnings: "Do not combine with MAOI antidepressants. Check combination cold products to avoid duplicate ingredients.",
  },
  {
    name: "Metformin",
    aliases: ["Glucophage"],
    category: "Diabetes care",
    uses: "First-line prescription medication to manage blood sugar in type 2 diabetes.",
    typicalDosage: "As prescribed — commonly started at 500mg once or twice daily with meals, adjusted by a doctor.",
    sideEffects: "GI upset (nausea, diarrhea), especially when starting — usually improves over time.",
    warnings: "Requires a prescription. Take with food. Tell your doctor before any imaging scan requiring contrast dye.",
  },
  {
    name: "Semaglutide",
    aliases: ["Ozempic", "Wegovy"],
    category: "Diabetes care",
    uses: "Prescription injectable for type 2 diabetes management and, at higher doses, weight management.",
    typicalDosage: "Weekly injection, dose titrated by a prescriber (commonly starting at 0.25mg/week).",
    sideEffects: "Nausea, vomiting, diarrhea, especially during dose increases.",
    warnings: "Prescription only. Requires prior authorization with most insurers. Not for use in certain thyroid cancer histories — discuss with your doctor.",
  },
  {
    name: "Lisinopril",
    aliases: ["Prinivil", "Zestril"],
    category: "Heart health",
    uses: "Prescription ACE inhibitor for high blood pressure and heart failure.",
    typicalDosage: "As prescribed — commonly 10–40mg once daily.",
    sideEffects: "Dry cough, dizziness, elevated potassium.",
    warnings: "Prescription only. Avoid in pregnancy. Regular blood pressure and kidney function monitoring recommended.",
  },
  {
    name: "Atorvastatin",
    aliases: ["Lipitor"],
    category: "Heart health",
    uses: "Prescription statin to lower LDL cholesterol and reduce cardiovascular risk.",
    typicalDosage: "As prescribed — commonly 10–80mg once daily, usually in the evening.",
    sideEffects: "Muscle aches, mild liver enzyme changes.",
    warnings: "Prescription only. Report unexplained muscle pain to your doctor. Avoid grapefruit juice in large amounts.",
  },
  {
    name: "Omeprazole",
    aliases: ["Prilosec"],
    category: "Digestive health",
    uses: "Reduces stomach acid to relieve frequent heartburn/acid reflux.",
    typicalDosage: "Adults (OTC use): 20mg once daily for up to 14 days.",
    sideEffects: "Headache, stomach pain, nausea.",
    warnings: "OTC course shouldn't exceed 14 days more than 3x/year without a doctor's advice. Can affect absorption of some other medications.",
  },
];
