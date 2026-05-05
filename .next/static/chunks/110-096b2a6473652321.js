"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[110],{8110:(e,t,a)=>{a.d(t,{D:()=>b,P:()=>w});var i=a(5155),r=a(2115);let n=[/^(.+?)\s{2,}([\d.]+)\s+([\w/^³⁶μ%°]+)\s+([\d.]+ [–-] [\d.]+)\s+(HIGH|LOW)?/,/^(.+?)[:]\s*([\d.]+)\s*([\w/^³μ%°]*)\s*(?:\(Normal[:\s]+([\d.]+ ?[–-] ?[\d.]+)\))?/i,/^(.+?)\s{2,}([\d.]+)\s+([\w/^³μ%°]+)\s+([\d.]+ ?[–-] ?[\d.]+)/];function s(e){let t=[],a=new Set;for(let i of e.split("\n").map(e=>e.trim()).filter(Boolean))if(!/^(TEST|RESULT|UNIT|REFERENCE|FLAG|SECTION|PANEL|PROFILE|COUNT|STUDY)/i.test(i)&&!(i.length<5))for(let e of n){let r=i.match(e);if(!r)continue;let n=r[1].trim().replace(/\s+/g," "),s=r[2],o=r[3]||"",l=r[4]||"",c=r[5]||"";if(n.length<2||n.length>80||!s||isNaN(parseFloat(s)))continue;let d=n.toLowerCase();if(a.has(d))continue;a.add(d);let m=c||function(e,t){if(!t)return"";let a=parseFloat(e);if(isNaN(a))return"";let i=t.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);if(!i){let e=t.match(/< ?([\d.]+)/),i=t.match(/> ?([\d.]+)/);return e&&a>parseFloat(e[1])?"HIGH":i&&a<parseFloat(i[1])?"LOW":""}let r=parseFloat(i[1]),n=parseFloat(i[2]);return a<r?"LOW":a>n?"HIGH":"NORMAL"}(s,l);t.push({test:n,value:s,unit:o,refRange:l,flag:m});break}return t}let o=[{id:"mock-001",name:"lab_results_march_2026.pdf",fileType:"application/pdf",size:124800,uploadedAt:"2026-03-14T09:30:00.000Z",status:"ready",isMock:!0,textContent:`CLINICAL LABORATORY REPORT

Patient Name: Sarah Mitchell
Patient ID: PT-2026-04521
Date of Birth: 14/08/1982
Attending Physician: Dr. James Harrington
Date Collected: 14 March 2026

COMPLETE BLOOD COUNT (CBC)
Hemoglobin: 12.8 g/dL (Normal: 12.0-16.0)
White Blood Cell Count: 7.2 x 10^3/uL (Normal: 4.5-11.0)
Platelet Count: 245 x 10^3/uL (Normal: 150-400)
Hematocrit: 38.4% (Normal: 36-46)

METABOLIC PANEL
Glucose: 98 mg/dL (Normal: 70-100)
Creatinine: 0.9 mg/dL (Normal: 0.6-1.2)
Sodium: 140 mEq/L

LIPID PANEL
Total Cholesterol: 195 mg/dL
LDL: 118 mg/dL
HDL: 52 mg/dL
Triglycerides: 130 mg/dL

CONCLUSION: Results within normal reference range. Follow-up recommended in 6 months.`,analysis:{classification:{type:"Lab Report",confidence:.94},entities:{persons:["Sarah Mitchell","Dr. James Harrington"],dates:["14/08/1982","14 March 2026"],organizations:["Clinical Laboratory"],medications:[]},metrics:{"Patient ID":"PT-2026-04521","Date of Birth":"14/08/1982","Attending Physician":"Dr. James Harrington","Primary Diagnosis":"Results within normal reference range"},summary:"Complete blood count and metabolic panel results for patient Sarah Mitchell show all values within normal reference ranges. Lipid panel shows total cholesterol of 195 mg/dL with LDL 118 mg/dL. Follow-up recommended in 6 months.",patientName:"Sarah Mitchell",labValues:s(`COMPLETE BLOOD COUNT (CBC)
Hemoglobin: 12.8 g/dL (Normal: 12.0-16.0)
White Blood Cell Count: 7.2 x 10^3/uL (Normal: 4.5-11.0)
Platelet Count: 245 x 10^3/uL (Normal: 150-400)
Hematocrit: 38.4% (Normal: 36-46)

METABOLIC PANEL
Glucose: 98 mg/dL (Normal: 70-100)
Creatinine: 0.9 mg/dL (Normal: 0.6-1.2)
Sodium: 140 mEq/L

LIPID PANEL
Total Cholesterol: 195 mg/dL
LDL: 118 mg/dL
HDL: 52 mg/dL
Triglycerides: 130 mg/dL`)}},{id:"mock-002",name:"discharge_summary_jones.pdf",fileType:"application/pdf",size:98304,uploadedAt:"2026-02-28T11:00:00.000Z",status:"ready",isMock:!0,textContent:`DISCHARGE SUMMARY

Patient Name: Robert Jones
Patient ID: PT-2026-03847
Date of Birth: 22/03/1955
Admission Date: 24 February 2026
Discharge Date: 28 February 2026
Attending Physician: Dr. Priya Sharma

CHIEF COMPLAINT: Acute chest pain with shortness of breath.

HOSPITAL COURSE: Mr. Jones was admitted via emergency department with acute onset chest pain. ECG showed ST changes. Troponin levels were mildly elevated. Patient was managed with aspirin 300mg and anticoagulation therapy. Echocardiogram performed on day 2 showed preserved ejection fraction. Patient stabilised over 48 hours.

DISCHARGE MEDICATIONS: Aspirin 75mg daily, Atorvastatin 40mg nightly, Metoprolol 25mg twice daily.

DISCHARGE INSTRUCTIONS: Rest for 2 weeks. Avoid strenuous activity. Follow-up with cardiology in 4 weeks.

Next Appointment: 28 March 2026 at 10:00am, Cardiology Clinic.`,analysis:{classification:{type:"Discharge Summary",confidence:.96},entities:{persons:["Robert Jones","Dr. Priya Sharma"],dates:["22/03/1955","24 February 2026","28 February 2026","28 March 2026"],organizations:["Cardiology Clinic"],medications:["Aspirin","Atorvastatin","Metoprolol"]},metrics:{"Patient ID":"PT-2026-03847","Date of Birth":"22/03/1955","Attending Physician":"Dr. Priya Sharma","Primary Diagnosis":"Acute chest pain with shortness of breath","Next Appointment":"28 March 2026 at 10:00am, Cardiology Clinic"},summary:"Robert Jones was admitted with acute chest pain and shortness of breath. ECG showed ST changes with mildly elevated troponin. Managed with aspirin and anticoagulation; discharged on aspirin, atorvastatin, and metoprolol with cardiology follow-up in 4 weeks.",patientName:"Robert Jones"}},{id:"mock-003",name:"prescription_amoxicillin.pdf",fileType:"application/pdf",size:43008,uploadedAt:"2026-03-02T08:15:00.000Z",status:"ready",isMock:!0,textContent:`PRESCRIPTION

Patient Name: Emily Carter
Patient ID: PT-2026-05102
Date of Birth: 30/11/1990
Date: 02 March 2026
Prescribing Physician: Dr. Alan Brooks
Licence No: GMC-7845123

Rx:
1. Amoxicillin 500mg capsule — Take 1 capsule three times daily for 7 days
2. Ibuprofen 400mg tablet — Take 1 tablet twice daily with food as needed for pain

Diagnosis: Acute tonsillitis

Allergies: None known
Repeat: No

Pharmacy: St. Mary's Medical Centre Pharmacy
Signed: Dr. Alan Brooks
Date: 02 March 2026`,analysis:{classification:{type:"Prescription",confidence:.97},entities:{persons:["Emily Carter","Dr. Alan Brooks"],dates:["30/11/1990","02 March 2026"],organizations:["St. Mary's Medical Centre Pharmacy"],medications:["Amoxicillin","Ibuprofen"]},metrics:{"Patient ID":"PT-2026-05102","Date of Birth":"30/11/1990","Attending Physician":"Dr. Alan Brooks","Primary Diagnosis":"Acute tonsillitis"},summary:"Prescription for Emily Carter for acute tonsillitis. Prescribed amoxicillin 500mg three times daily for 7 days alongside ibuprofen 400mg twice daily as needed. No known allergies; non-repeat prescription.",patientName:"Emily Carter"}},{id:"mock-004",name:"mri_report_brain.pdf",fileType:"application/pdf",size:215040,uploadedAt:"2026-01-21T15:45:00.000Z",status:"ready",isMock:!0,textContent:`MRI BRAIN REPORT

Patient Name: David Nguyen
Patient ID: PT-2026-02981
Date of Birth: 07/04/1978
Referring Physician: Dr. Susan Lee
Date of Scan: 21 January 2026
Reporting Radiologist: Dr. Kemal Ozturk

EXAMINATION: MRI Brain without contrast

INDICATION: Persistent headaches and visual disturbances.

FINDINGS:
Brain volume appears normal for age. No focal parenchymal signal abnormality. No restricted diffusion to suggest acute ischaemia. Ventricles are normal in size. No midline shift. No extra-axial collections. Orbits appear normal. Visualised paranasal sinuses are clear.

IMPRESSION: Normal MRI brain. No acute intracranial abnormality identified. Clinical correlation recommended.

Next Appointment: Follow-up with neurology on 14 February 2026.`,analysis:{classification:{type:"Imaging Report",confidence:.95},entities:{persons:["David Nguyen","Dr. Susan Lee","Dr. Kemal Ozturk"],dates:["07/04/1978","21 January 2026","14 February 2026"],organizations:[],medications:[]},metrics:{"Patient ID":"PT-2026-02981","Date of Birth":"07/04/1978","Attending Physician":"Dr. Kemal Ozturk","Primary Diagnosis":"Normal MRI brain. No acute intracranial abnormality identified","Next Appointment":"Follow-up with neurology on 14 February 2026"},summary:"MRI brain without contrast for David Nguyen indicated for persistent headaches and visual disturbances. All findings within normal limits — no focal abnormality, ischaemia, or midline shift. Clinical correlation recommended with neurology follow-up scheduled.",patientName:"David Nguyen"}},{id:"mock-005",name:"referral_cardiology_kowalski.pdf",fileType:"application/pdf",size:61440,uploadedAt:"2026-04-10T16:00:00.000Z",status:"ready",isMock:!0,textContent:`REFERRAL LETTER

Date: 10 April 2026
From: Dr. Helen Walsh, GP
To: Cardiology Department, Royal General Hospital

Dear Dr. Specialist,

Re: Ms. Anna Kowalski, DOB: 15/06/1965, Patient ID: PT-2026-06234

I would be grateful if you could kindly review Ms. Kowalski, who has been experiencing exertional chest tightness and palpitations over the past 3 months. Her resting ECG shows occasional ectopics but is otherwise unremarkable. BP is 145/92 mmHg on two readings.

Background: Type 2 diabetes (on Metformin 1g twice daily), hypertension (Lisinopril 10mg daily). Non-smoker. Family history of ischaemic heart disease.

I would appreciate your assessment and any further investigations you deem appropriate.

Kind regards,
Dr. Helen Walsh
GP, Parkside Medical Practice`,analysis:{classification:{type:"Referral Letter",confidence:.93},entities:{persons:["Anna Kowalski","Dr. Helen Walsh"],dates:["15/06/1965","10 April 2026"],organizations:["Royal General Hospital","Parkside Medical Practice"],medications:["Metformin","Lisinopril"]},metrics:{"Patient ID":"PT-2026-06234","Date of Birth":"15/06/1965","Attending Physician":"Dr. Helen Walsh","Primary Diagnosis":"Exertional chest tightness and palpitations"},summary:"Referral from Dr. Helen Walsh to cardiology for Anna Kowalski presenting with exertional chest tightness and palpitations over 3 months. Background of Type 2 diabetes and hypertension with a family history of ischaemic heart disease. Resting ECG shows occasional ectopics.",patientName:"Anna Kowalski"}}],l=1,c=0;async function d(){let e=await Promise.all([a.e(84),a.e(304)]).then(a.bind(a,6898));return e.GlobalWorkerOptions.workerSrc="/pdf.worker.min.mjs",e}async function m(e){let t=await d(),a=await e.arrayBuffer(),i=await t.getDocument({data:new Uint8Array(a)}).promise,r="";for(let e=1;e<=Math.min(i.numPages,10);e++){let t=await i.getPage(e);r+=(await t.getTextContent()).items.map(e=>e.str).join(" ")+"\n"}return r.trim()}let p=[{type:"Lab Report",keywords:["laboratory","lab report","test result","reference range","specimen","cbc","hba1c","glucose","hemoglobin","platelet","wbc","rbc","cholesterol","triglyceride","creatinine","sodium","potassium","metabolic panel","blood count"]},{type:"Prescription",keywords:["prescription","prescribe","prescribed","rx:","tablet","capsule","mg daily","mg twice","mg three times","take 1","pharmacy","prescribing physician","refill","sig:"]},{type:"Discharge Summary",keywords:["discharge summary","discharge date","admission date","chief complaint","hospital course","discharge instructions","discharge medications","admitted via","inpatient"]},{type:"Imaging Report",keywords:["mri","ct scan","x-ray","ultrasound","imaging","radiolog","impression:","findings:","scan date","dicom","contrast","parenchymal","ischaemia","radiologist"]},{type:"Referral Letter",keywords:["referral","dear dr","i would be grateful","kindly review","kindly see","please see","refer","specialist","kind regards","re:","from:"]},{type:"Consent Form",keywords:["consent","authorize","authorise","acknowledge","i agree","i understand","signature","procedure","risk","informed consent","patient consent"]}],u=[/patient(?:\s+name)?[:]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,/(?:re|patient):?\s+(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,/(?:Mr|Mrs|Ms|Miss)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g],h=[/\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/g,/\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi],y=["amoxicillin","ibuprofen","paracetamol","acetaminophen","metformin","lisinopril","atorvastatin","omeprazole","aspirin","warfarin","insulin","prednisone","amlodipine","sertraline","levothyroxine","metoprolol","ramipril","simvastatin","furosemide","clopidogrel"];function g(e){let t,a,i,r=(t=e.toLowerCase(),(a=p.map(({type:e,keywords:a})=>({type:e,hits:a.filter(e=>t.includes(e)).length,total:a.length}))).sort((e,t)=>t.hits-e.hits),0===(i=a[0]).hits?{type:"Other",confidence:.3}:{type:i.type,confidence:Math.min(.97,.45+i.hits/i.total*1.5)}),n=function(e){let t={persons:[],dates:[],organizations:[],medications:[]};for(let a of u)for(let i of[...e.matchAll(a)]){let e=i[1]?.trim();e&&e.length>3&&!t.persons.includes(e)&&t.persons.push(e)}for(let a of h)for(let i of[...e.matchAll(a)]){let e=i[0]?.trim();e&&!t.dates.includes(e)&&t.dates.push(e)}let a=e.toLowerCase();for(let e of y)if(a.includes(e)){let a=e.charAt(0).toUpperCase()+e.slice(1);t.medications.includes(a)||t.medications.push(a)}for(let a of[...e.matchAll(/([A-Z][A-Za-z\s]+(?:Hospital|Clinic|Medical Centre|Medical Center|Health|Pharmacy|Practice|Institute)[A-Za-z\s]*)/g)]){let e=a[1]?.trim();e&&e.length<60&&!t.organizations.includes(e)&&t.organizations.push(e)}return t}(e),o=function(e){let t={};for(let[a,i]of Object.entries({"Patient ID":/patient\s+(?:id|number|no)\.?[:]\s*([A-Z0-9-]+)/i,"Date of Birth":/(?:date of birth|dob|d\.o\.b)\.?[:]\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{1,2}\s+\w+\s+\d{4})/i,"Attending Physician":/(?:attending|prescribing physician|reporting radiologist|from)[:]\s*(?:Dr\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,"Primary Diagnosis":/(?:diagnosis|impression|chief complaint|indication)[:]\s*([^\n.]{5,100})/i,"Next Appointment":/(?:next appointment|follow.?up|review date)[:]\s*([^\n]{5,80})/i})){let r=e.match(i);r&&(t[a]=r[1].trim().replace(/\s+/g," "))}return t}(e),l=e.replace(/\n+/g," ").split(/(?<=[.!?])\s+/).map(e=>e.trim()).filter(e=>e.length>40&&e.length<300&&!/^(date|patient id|rx:|sig:)/i.test(e)).slice(0,3).join(" ")||e.slice(0,250)+"…",c=n.persons[0]||null;return{classification:r,entities:n,metrics:o,summary:l,patientName:c,labValues:s(e)}}let f=(0,r.createContext)(null);function b({children:e}){let{toasts:t,addToast:n,removeToast:s}=function(){let[e,t]=(0,r.useState)([]);return{toasts:e,addToast:(0,r.useCallback)((e,a="info",i=4e3)=>{let r=++c;return t(t=>[...t,{id:r,message:e,type:a}]),i>0&&setTimeout(()=>t(e=>e.filter(e=>e.id!==r)),i),r},[]),removeToast:(0,r.useCallback)(e=>{t(t=>t.filter(t=>t.id!==e))},[])}}(),{documents:d,addDocument:p,updateDocument:u,deleteDocument:h}=function(){let[e,t]=(0,r.useState)(o),a=(0,r.useCallback)(e=>{let a=`doc-${Date.now()}-${l++}`,i=URL.createObjectURL(e),r={id:a,name:e.name,fileType:e.type,size:e.size,uploadedAt:new Date().toISOString(),status:"uploading",isMock:!1,file:e,objectUrl:i,textContent:null,analysis:null};return t(e=>[r,...e]),a},[]);return{documents:e,addDocument:a,updateDocument:(0,r.useCallback)((e,a)=>{t(t=>t.map(t=>{if(t.id!==e)return t;let i="function"==typeof a?a(t):a;return{...t,...i}}))},[]),deleteDocument:(0,r.useCallback)(e=>{t(t=>{let a=t.find(t=>t.id===e);return a?.objectUrl&&URL.revokeObjectURL(a.objectUrl),t.filter(t=>t.id!==e)})},[])}}(),y=function({updateDocument:e,addToast:t}){let[i,n]=(0,r.useState)(null),[s,o]=(0,r.useState)(null),[l,c]=(0,r.useState)(!1),[d,p]=(0,r.useState)(!1),u=(0,r.useRef)([]);(0,r.useEffect)(()=>{let e=!1;return p(!0),a.e(419).then(a.bind(a,1419)).then(({loadModels:t,isLoaded:a})=>{if(a()){e||(c(!0),p(!1));return}t(t=>{e||"progress"!==t.status||o({loaded:t.loaded,total:t.total,file:t.file})}).then(()=>{e||(c(!0),p(!1),o(null),u.current.splice(0).forEach(({id:e,text:t})=>h(e,t)))}).catch(()=>{e||(p(!1),o(null))})}),()=>{e=!0}},[]);let h=(0,r.useCallback)(async(t,i)=>{n(t);try{let{loadModels:r,enhanceAnalysis:n}=await a.e(419).then(a.bind(a,1419));await r(e=>{"progress"===e.status&&o({loaded:e.loaded,total:e.total,file:e.file})});let s=await n(i);s&&e(t,e=>({analysis:{...e.analysis||{},classification:s.classification,entities:{...e.analysis?.entities||{},...s.entities},...s.summary?{summary:s.summary}:{},aiEnhanced:!0}}))}catch(e){console.error("AI enhancement failed",e)}finally{n(null),o(null)}},[e]),y=(0,r.useCallback)(async(i,r)=>{e(i,{status:"analysing"});try{let t="";if("application/pdf"===r.type)t=await m(r);else if(r.type.startsWith("text/"))t=await r.text();else if(r.type.startsWith("image/")){let{generateImageAnalysis:n}=await a.e(336).then(a.bind(a,9336)),s=n(r);try{let e=await a.e(419).then(a.bind(a,1419));t=e.isLoaded()?await e.extractTextFromImage(r):r.name.replace(/\.[^.]+$/,"").replace(/[-_]/g," ")}catch{t=r.name.replace(/\.[^.]+$/,"").replace(/[-_]/g," ")}let o=g(t);e(i,{status:"ready",textContent:t,analysis:{...o,classification:{type:("X-Ray"===s.modality||"MRI"===s.modality||s.modality,"Imaging Report"),confidence:.97},imageAnalysis:s,aiEnhanced:!0}});return}else t=r.name.replace(/\.[^.]+$/,"").replace(/[-_]/g," ");let n=g(t);e(i,{status:"ready",textContent:t,analysis:n}),l?h(i,t):u.current.push({id:i,text:t})}catch(a){console.error("Analysis failed",a),e(i,{status:"error"}),t(`Analysis failed for ${r.name}`,"error")}},[e,t,l,h]);return{analyzeFile:y,enhanceWithAI:(0,r.useCallback)(async(e,a)=>{await h(e,a),t("AI analysis complete","success")},[h,t]),aiLoading:null!==i,aiLoadingId:i,aiLoadProgress:s,modelsReady:l,modelsPreloading:d}}({updateDocument:u,addToast:n}),w={documents:d,addDocument:p,updateDocument:u,deleteDocument:h,toasts:t,addToast:n,removeToast:s,...y};return(0,i.jsx)(f.Provider,{value:w,children:e})}function w(){let e=(0,r.useContext)(f);if(!e)throw Error("useMedDocs must be used within MedDocsProvider");return e}}}]);