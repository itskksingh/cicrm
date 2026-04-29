/**
 * Crest Care Hospital — Complete Knowledge Base Seeding Script
 * 
 * Run with:  npx tsx scripts/seed-knowledge.ts
 * 
 * This script inserts all 3 tiers of knowledge into the Vector DB:
 *   Tier 1: Doctor Profiles (specializations, OPD schedule, surgeries)
 *   Tier 2: Condition → Department Routing (for quick lead classification)
 *   Tier 3: Hospital General Info (Ayushman, diagnostics, address, facilities)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing from .env.local");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });

  if (!res.ok) throw new Error(`Embedding failed: ${await res.text()}`);
  const data = await res.json();
  return data.data[0].embedding;
}

async function addKnowledgeChunk(department: string, content: string, metadata?: Record<string, string>) {
  let embedText = content;
  if (metadata && Object.keys(metadata).length > 0) {
    const metaString = Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(", ");
    embedText = `[Metadata: ${metaString}] \n\n ${content}`;
  }
  const embedding = await generateEmbedding(embedText);
  const embeddingString = `[${embedding.join(',')}]`;
  const metadataJson = metadata ? JSON.stringify(metadata) : null;
  await prisma.$executeRaw`
    INSERT INTO knowledge_chunks (id, department, content, metadata, embedding, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${department}, ${content}, ${metadataJson}::jsonb, ${embeddingString}::vector, NOW(), NOW())
  `;
}

// ─────────────────────────────────────────────────────────────────
// TIER 1: DOCTOR PROFILES
// ─────────────────────────────────────────────────────────────────

const doctorProfiles = [
  {
    department: "Orthopedics",
    metadata: {
      type: "doctor_profile",
      doctor: "Dr. Rahul Kumar Chandan",
      doctor_hi: "डॉ. राहुल कुमार चंदन",
      keywords: "fracture,joint replacement,spine surgery,arthroscopy,haddi,ghutna,kamar dard,bone,ortho",
    },
    content: `डॉ. राहुल कुमार चंदन (Dr. Rahul Kumar Chandan) Crest Care Hospital में Orthopedics, Joint and Spine Surgery के विशेषज्ञ हैं।
OPD दिन: हर गुरुवार (Thursday) और रविवार (Sunday)
OPD समय: सुबह 10 बजे से शाम 4 बजे तक
परामर्श शुल्क: ₹500

विशेषज्ञता:
- Joint Replacement (Arthroplasty): घुटना, कूल्हा और कंधे का रिप्लेसमेंट। Muscle-sparing surgery तकनीक से जल्दी ठीक होना।
- Spine Surgery: Endoscopic Spine Surgery (पेंसिल जितनी छोटी ट्यूब से disc हटाना)। पीठ दर्द, स्लिप डिस्क, sciatica का उपचार।
- Fracture Management: टूटी हड्डियों को plaster, splint या plates-screws से जोड़ना।
- Arthroscopy: घुटने के अंदर कैमरे से देखकर इलाज। Torn cartilage, loose bone fragments।
- Sports Medicine: ACL tear, meniscus injury, rotator cuff repair।
- Deformity Correction: Clubfoot, limb length discrepancy।
- Regenerative Medicine: PRP (Platelet-Rich Plasma), Stem Cell therapy।

Advanced Surgeries: Total Hip Replacement, Total Knee Replacement, Minimally Invasive Spine Surgery (MISS), Microdiscectomy, Endoscopic Spine Surgery, Computer-Navigated Joint Replacement, Scoliosis Correction, Laminoplasty, Osteotomy, Total Ankle Replacement, Total Elbow Replacement।`,
  },

  {
    department: "Urology",
    metadata: {
      type: "doctor_profile",
      doctor: "Dr. Shrawan Kumar",
      doctor_hi: "डॉ. श्रवण कुमार",
      keywords: "kidney stone,pathri,urology,prostate,bladder,peshab,urine,stone surgery,PCNL",
    },
    content: `डॉ. श्रवण कुमार (Dr. Shrawan Kumar) Crest Care Hospital में Urology विभाग के विशेषज्ञ हैं।
OPD दिन: हर शुक्रवार (Every Friday)
OPD समय: सुबह 10 बजे से शाम 4 बजे तक
परामर्श शुल्क: ₹500

Kidney Stone (पथरी) की सर्जरी और इलाज डॉ. श्रवण कुमार करते हैं। अगर किसी के kidney में पथरी है, urine रुक रहा है, पेशाब में दर्द है — तो Dr. Shrawan Kumar से मिलें।

विशेषज्ञता:
- Kidney Stones (पथरी): PCNL, URS, Lithotripsy (shock waves से पथरी तोड़ना), Ureteroscopy।
- Prostate (BPH/Enlarged Prostate): TURP, medication management।
- Bladder Issues: Incontinence, Overactive Bladder, Urinary Retention।
- Male Sexual Health: Erectile Dysfunction, Low Sperm Count, Male Infertility, Vasectomy।
- UTI (Urinary Tract Infection): बार-बार पेशाब आना, जलन, infection।
- Uro-Oncology: Kidney, Bladder, Prostate Cancer की जांच और इलाज।
- Cystoscopy: Bladder के अंदर Camera से देखना।
- Urodynamics: Bladder function testing।`,
  },

  {
    department: "Gynecology & Maternity",
    metadata: {
      type: "doctor_profile",
      doctor: "Dr. Priyamvada",
      doctor_hi: "डॉ. प्रियम्वदा",
      keywords: "pregnancy,delivery,gynecology,ladies problem,period,PCOD,PCOS,cesarean,normal delivery,mahila rog",
    },
    content: `डॉ. प्रियम्वदा (Dr. Priyamvada) Crest Care Hospital में Gynecology और Maternity Care की विशेषज्ञ हैं।
OPD दिन: हर दिन (Daily)
OPD समय: सुबह 10 बजे से शाम 5 बजे तक
परामर्श शुल्क: ₹300

महिलाओं की सभी समस्याओं का इलाज — गर्भावस्था, डिलीवरी, periods की समस्या, PCOD/PCOS, बच्चेदानी से जुड़ी कोई भी तकलीफ।

विशेषज्ञता:
- Pregnancy & Maternity: Normal delivery, Cesarean delivery (C-section), Painless delivery, High-risk pregnancy, Antenatal care।
- PCOD/PCOS: Hormonal imbalance, irregular periods, cysts का इलाज।
- Infertility Treatment: गर्भ न ठहरना, fertility treatment।
- Fibroids & Ovarian Cysts: Uterus में गांठ का इलाज।
- Menstrual Problems: अनियमित periods, ज्यादा bleeding, white discharge।
- Gynecological Infections: योनि संक्रमण, cervical screening।
- Family Planning & Contraception: परिवार नियोजन, sterilization।

Advanced Surgeries: Hysterectomy (uterus removal), Vaginal Hysterectomy, Vaginal Prolapse Repair, Tubal Ligation, D&C, Hysteroscopy, Laparoscopic Gynecological Surgery।`,
  },

  {
    department: "General Surgery",
    metadata: {
      type: "doctor_profile",
      doctor: "Dr. Sushil Kumar",
      doctor_hi: "डॉ. सुशिल कुमार",
      keywords: "appendix,piles,bawasir,hernia,gallbladder,laparoscopy,general surgery,stomach surgery,fissure,fistula",
    },
    content: `डॉ. सुशिल कुमार (Dr. Sushil Kumar) Crest Care Hospital में General Surgery और Gastroenterology के विशेषज्ञ हैं।
OPD दिन: हर दिन (Daily)
OPD समय: सुबह 10 बजे से शाम 4 बजे तक

पेट की सर्जरी, Appendix, Piles (बवासीर), Hernia, Gallbladder (पित्त की थैली), Laparoscopy — सब डॉ. सुशिल कुमार करते हैं।

विशेषज्ञता:
- Appendix Surgery (Appendicectomy): पेट के नीचे तेज दर्द, appendix की सूजन।
- Piles / Bawasir (Hemorrhoids): बवासीर का laser surgery और conventional surgery। Laser surgery में कम दर्द, जल्दी ठीक।
- Fissure & Fistula: मलद्वार में दरार, नासूर का इलाज।
- Hernia Repair: पेट की नस उतरना, inguinal और umbilical hernia।
- Gallbladder / Cholecystectomy: पित्त की थैली में पथरी निकालना।
- Laparoscopic Surgery: छोटे छेद से बड़ी सर्जरी (Keyhole surgery)।
- Stomach & Digestion: Acidity, Ulcer, IBS, Gas, पेट में जलन।`,
  },

  {
    department: "General Medicine",
    metadata: {
      type: "doctor_profile",
      doctor: "Dr. Ajay Kumar",
      doctor_hi: "डॉ. अजय कुमार",
      keywords: "fever,diabetes,bp,thyroid,blood pressure,bukhar,sugar,dengue,malaria,typhoid,general medicine",
    },
    content: `डॉ. अजय कुमार (Dr. Ajay Kumar) Crest Care Hospital में General Medicine के विशेषज्ञ हैं।
OPD दिन: हर गुरुवार (Thursday) और रविवार (Sunday)
OPD समय: दोपहर 1 बजे से शाम 5 बजे तक
परामर्श शुल्क: ₹500

बुखार, Sugar (Diabetes), BP, Thyroid, Dengue, Malaria, Typhoid, कमजोरी — इन सबका इलाज Dr. Ajay Kumar करते हैं।

महत्वपूर्ण: डॉ. अजय कुमार surgery नहीं करते। वे medical management (दवाइयों से इलाज) में विशेषज्ञ हैं।

विशेषज्ञता:
- Diabetes (Sugar): Type 1 & 2, HbA1c management, blood sugar control।
- High Blood Pressure (Hypertension): BP control, heart care।
- Thyroid Management: T3, T4, TSH disorders।
- Infectious Diseases: Dengue, Malaria, Typhoid, Tuberculosis, Jaundice, Pneumonia।
- Respiratory Illnesses: Asthma, Bronchitis, COPD।
- General Weakness & Fatigue: कमजोरी, थकान, भूख न लगना।
- Complete Health Checkups: Full body checkup।`,
  },

  {
    department: "Cardiology",
    metadata: {
      type: "doctor_profile",
      doctor: "Dr. Rohit Kumar",
      doctor_hi: "डॉ. रोहित कुमार",
      keywords: "heart,chest pain,heart attack,cardiology,ECG,Echo,BP,dhadkan,seene me dard,palpitations",
    },
    content: `डॉ. रोहित कुमार (Dr. Rohit Kumar) Crest Care Hospital में Cardiology (Heart) के विशेषज्ञ हैं।
OPD दिन: हर महीने का तीसरा शनिवार (Every month's 3rd Saturday)
OPD समय: सुबह 10 बजे से दोपहर 1 बजे तक
परामर्श शुल्क: ₹500

दिल की धड़कन तेज होना, सीने में दर्द, BP ज्यादा होना — ये सब Dr. Rohit Kumar देखते हैं।

महत्वपूर्ण: Dr. Rohit Kumar heart की दवाइयों और जांच के विशेषज्ञ हैं, open heart surgery नहीं करते।

विशेषज्ञता:
- Preventive Cardiology: BP, cholesterol, obesity से heart attack रोकना।
- Clinical Cardiology: Heart failure, Heart valve diseases, Endocarditis।
- Heart Rhythm: Arrhythmia, palpitations, irregular heartbeat।
- Emergency Cardiac Care: Heart attack के बाद stabilization।

Advanced Diagnostic Procedures: ECG, 2D Echocardiography (Echo), Stress Test (TMT), Holter Monitoring (24-hour ECG), Coronary Angiography, Angioplasty (Stenting)।`,
  },

  {
    department: "Pediatrics",
    metadata: {
      type: "doctor_profile",
      doctor: "Dr. Rakesh Ranjan",
      doctor_hi: "डॉ. राकेश रंजन",
      keywords: "child,baccha,baby,newborn,neonatal,pediatric,kids fever,vaccination,immunization,shishu",
    },
    content: `डॉ. राकेश रंजन (Dr. Rakesh Ranjan) Crest Care Hospital में Pediatrics (बच्चों के रोग) के विशेषज्ञ हैं।
OPD दिन: हर गुरुवार (Thursday) और रविवार (Sunday)
OPD समय: सुबह 11 बजे से शाम 4 बजे तक
OPD शुल्क: ₹500

बच्चों की हर बीमारी के लिए — बुखार, नवजात शिशु की देखभाल, टीकाकरण, विकास संबंधी समस्याएं।

विशेषज्ञता:
- Neonatal Care: नवजात शिशु की देखभाल — jaundice, feeding issues, birth infections।
- Immunization (टीकाकरण): Polio, Hepatitis, Meningitis, BCG सभी टीके।
- Growth & Development: Height, weight milestones, autism, ADHD screening।
- Infectious Diseases: Chickenpox, Mumps, Measles, Bronchiolitis।
- Nutrition: कुपोषण, vitamin deficiency, childhood obesity।
- Pediatric Critical Care: NICU में premature/sick babies की देखभाल।
- Adolescent Medicine: बड़े होते बच्चों की समस्याएं।`,
  },
];

// ─────────────────────────────────────────────────────────────────
// TIER 2: CONDITION → DEPARTMENT ROUTING CHUNKS
// ─────────────────────────────────────────────────────────────────

const conditionChunks = [
  {
    department: "Urology",
    metadata: { type: "condition_routing", intent: "kidney_stone_urology" },
    content: `Kidney stone (पथरी / गुर्दे की पथरी) की surgery और इलाज के लिए Crest Care Hospital में डॉ. श्रवण कुमार (Dr. Shrawan Kumar) हैं। वे Urology विभाग के विशेषज्ञ हैं। अगर पेशाब में दर्द हो, पेशाब रुक रहा हो, पीठ या कमर में तेज दर्द हो, ultrasound में पथरी दिखे — तो Dr. Shrawan Kumar से मिलें। OPD हर शुक्रवार 10 AM से 4 PM।`,
  },
  {
    department: "Orthopedics",
    metadata: { type: "condition_routing", intent: "orthopedic_bone_joint" },
    content: `हड्डी टूटना (fracture), घुटना दर्द (knee pain), जोड़ों का दर्द (joint pain), कमर/पीठ दर्द (back pain), spine surgery, joint replacement के लिए Crest Care Hospital में डॉ. राहुल कुमार चंदन (Dr. Rahul Kumar Chandan) हैं। OPD हर गुरुवार और रविवार 10 AM से 4 PM।`,
  },
  {
    department: "General Surgery",
    metadata: { type: "condition_routing", intent: "piles_surgery_laser" },
    content: `Piles (बवासीर), Fissure, Fistula का laser surgery और इलाज Crest Care Hospital में होता है। Laser surgery से बहुत कम दर्द होता है और मरीज जल्दी ठीक हो जाता है। इसके लिए डॉ. सुशिल कुमार से मिलें। Appendix surgery, hernia, gallbladder stone भी Dr. Sushil Kumar करते हैं।`,
  },
  {
    department: "Gynecology & Maternity",
    metadata: { type: "condition_routing", intent: "pregnancy_delivery_ladies" },
    content: `गर्भावस्था (Pregnancy), Normal Delivery, C-Section, Painless Delivery, PCOD/PCOS, अनियमित periods, white discharge, बांझपन (Infertility) — सभी महिला रोगों के लिए डॉ. प्रियम्वदा (Dr. Priyamvada) हैं। OPD हर दिन 10 AM से 5 PM। Consultation fee ₹300।`,
  },
  {
    department: "General Medicine",
    metadata: { type: "condition_routing", intent: "fever_diabetes_infection" },
    content: `बुखार (Fever), Sugar (Diabetes), High BP, Thyroid, Dengue, Malaria, Typhoid, Jaundice, कमजोरी के लिए डॉ. अजय कुमार (Dr. Ajay Kumar) से मिलें। OPD हर गुरुवार और रविवार दोपहर 1 PM से 5 PM।`,
  },
  {
    department: "Cardiology",
    metadata: { type: "condition_routing", intent: "heart_chest_pain" },
    content: `सीने में दर्द (Chest Pain), दिल की धड़कन तेज होना, heart attack, BP बहुत ज्यादा होना — ये सब emergency हैं। Crest Care Hospital 24/7 Emergency के लिए हमेशा खुला है। Cardiology OPD के लिए डॉ. रोहित कुमार (Dr. Rohit Kumar) हैं। OPD हर महीने तीसरे शनिवार 10 AM से 1 PM।`,
  },
];

// ─────────────────────────────────────────────────────────────────
// TIER 3: HOSPITAL GENERAL INFORMATION
// ─────────────────────────────────────────────────────────────────

const hospitalInfoChunks = [
  // Ayushman / PMJAY
  {
    department: "Hospital Info",
    metadata: {
      type: "insurance_scheme",
      intent: "ayushman_pmjay",
      keywords: "ayushman,PMJAY,free surgery,sarkari yojana,government scheme",
    },
    content: `Crest Care Hospital Ayushman Bharat (PMJAY) योजना में empanelled है।

Ayushman card से FREE में surgery होती है — लेकिन सिर्फ इन दो departments के लिए:
1. General Surgery (Laparoscopy): Appendix, Hernia, Gallbladder, Piles, Fistula जैसी सर्जरियां।
2. Orthopedic Surgery: Fracture, Joint Replacement, Spine Surgery।

ध्यान दें: Ayushman card से सिर्फ surgery का खर्च cover होता है। General OPD consultation, medicines, या सिर्फ admit होने के लिए Ayushman नहीं लगता।

अगर आपके पास Ayushman card है और आपको General Surgery या Orthopedic Surgery चाहिए, तो बिना पैसे के operation हो सकता है। आज ही hospital से संपर्क करें।`,
  },

  // Diagnostics
  {
    department: "Hospital Info",
    metadata: {
      type: "facility",
      intent: "diagnostics_lab_scan",
      keywords: "ultrasound,USG,CT scan,X-Ray,blood test,ECG,Echo,MRI,lab,pathology,test",
    },
    content: `Crest Care Hospital में सभी प्रमुख जांचें (Diagnostic Tests) उपलब्ध हैं।

Imaging (Radiology) — 24/7 उपलब्ध:
- Digital X-Ray (Fixed और Mobile दोनों)
- High-resolution Ultrasound (USG) / Color Doppler — PC-PNDT registered
- Multi-slice CT Scan (16-slice)
- 2D Echo (Echocardiography)
- C-Arm (Orthopedic और Urology OT के लिए)

Pathology Lab — सभी Blood और Body Tests:
- CBC (Complete Blood Count), LFT, KFT/RFT, HbA1c, Blood Glucose
- Cardiac Biomarkers (Troponin, CK-MB)
- Lipid Profile, Thyroid Profile (T3 T4 TSH)
- Electrolytes (Na+, K+, Cl-), Arterial Blood Gas (ABG)
- Coagulation Profile (PT/INR)
- Urine Routine & Microscopy
- Culture & Sensitivity, Histopathology, Cytology (FNAC/Pap Smear)
- Dengue, Malaria, Typhoid Serology
- HIV, HBsAg, HCV screening
- ECG, Holter Monitoring`,
  },

  // Address, Contact, Timing
  {
    department: "Hospital Info",
    metadata: {
      type: "contact_address",
      intent: "hospital_location_contact",
      keywords: "address,location,contact,phone,email,hospital kaha hai,jamua,giridih",
    },
    content: `Crest Care Hospital का पता और संपर्क जानकारी:

पता (Address): नजदीक जमुआ थाना, जमुआ, गिरीडीह, झारखण्ड — 815318
(Near Jamua Police Station, Jamua, Giridih, Jharkhand - 815318)

फोन नंबर (Phone):
- Main: +91 92418 07380
- Alternative: 77650 26030

Email: contact@crestcarehospital.com

समय (Timing): Emergency और Trauma Care 24 घंटे, 7 दिन खुली रहती है।
OPD timing अलग-अलग doctors के अनुसार होती है।`,
  },

  // Emergency & Facilities
  {
    department: "Hospital Info",
    metadata: {
      type: "facility",
      intent: "hospital_facilities_emergency",
      keywords: "ICU,emergency,operation theater,24 hour,ambulance,NICU,trauma,facility",
    },
    content: `Crest Care Hospital की सुविधाएं:

Emergency & Trauma Unit: 24/7 खुली। Dedicated entrance, triage area, resuscitation beds, life-saving drugs, defibrillators।

ICU (Intensive Care Unit):
- MICU (Medical ICU) — गंभीर बीमार मरीजों के लिए
- SICU (Surgical ICU) — operation के बाद recovery
- NICU (Neonatal ICU) — नवजात शिशुओं के लिए

Modular Operation Theaters (OT): 2-3 OT, HEPA filters, Laminar airflow, LED surgical lights।

OPD: सभी specialties के लिए अलग-अलग consultation rooms।

Wards: General Ward, Semi-private, Private/Deluxe rooms।

24/7 Pharmacy: In-house licensed pharmacy।

Ambulance Service: उपलब्ध।

Power Backup: 100% DG generator backup — OT और ICU में कभी बिजली नहीं जाती।

अन्य सुविधाएं: RO पानी, साफ waiting area, अलग male/female toilets, Biomedical waste management, Medical Gas Pipeline (Oxygen, Nitrous Oxide)।`,
  },

  // Laser Piles Surgery Benefits
  {
    department: "General Surgery",
    metadata: {
      type: "treatment_info",
      intent: "laser_piles_surgery_benefits",
      keywords: "laser surgery,piles,bawasir,hemorrhoid,laser ke fayde,no cut surgery",
    },
    content: `Crest Care Hospital में Piles (बवासीर) का Laser Surgery होता है। Laser surgery, traditional surgery से बहुत बेहतर है।

Laser Surgery के फायदे:
1. कोई बड़ा कट नहीं: Laser से बिना चीरे के बवासीर हटती है।
2. बहुत कम दर्द: Traditional surgery के मुकाबले दर्द नाममात्र।
3. जल्दी ठीक होना: मरीज 1-2 दिन में घर जा सकता है।
4. Infection का खतरा कम: कोई खुला घाव नहीं।
5. कोई stitches नहीं: बाहर से देखने में कुछ पता नहीं चलता।
6. Day Care Procedure: ज्यादातर मामलों में उसी दिन घर।

Traditional surgery में 7-10 दिन hospital में रहना पड़ सकता है और दर्द भी ज्यादा होता है।

Laser surgery के लिए डॉ. सुशिल कुमार से मिलें। Ayushman card से भी piles surgery हो सकती है।`,
  },
];

// ─────────────────────────────────────────────────────────────────
// MAIN SEEDING FUNCTION
// ─────────────────────────────────────────────────────────────────

async function seedKnowledgeBase() {
  const allChunks = [
    ...doctorProfiles.map(c => ({ ...c, tier: "Tier 1 (Doctor Profile)" })),
    ...conditionChunks.map(c => ({ ...c, tier: "Tier 2 (Condition Routing)" })),
    ...hospitalInfoChunks.map(c => ({ ...c, tier: "Tier 3 (Hospital Info)" })),
  ];

  console.log(`\n🏥 Crest Care Hospital — Knowledge Base Seeder`);
  console.log(`📦 Total chunks to seed: ${allChunks.length}\n`);

  let success = 0;
  let failed = 0;

  for (const chunk of allChunks) {
    try {
      process.stdout.write(`  ⏳ [${chunk.tier}] ${chunk.department}...`);
      await addKnowledgeChunk(chunk.department, chunk.content, chunk.metadata as any);
      console.log(` ✅`);
      success++;
      // Small delay to avoid OpenAI rate limits
      await new Promise(r => setTimeout(r, 400));
    } catch (err: any) {
      console.log(` ❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n═══════════════════════════════════`);
  console.log(`✅ Successfully seeded: ${success} chunks`);
  if (failed > 0) console.log(`❌ Failed: ${failed} chunks`);
  console.log(`🚀 Your AI is now ready!\n`);

  process.exit(0);
}

seedKnowledgeBase().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
