exports.id=94,exports.ids=[94],exports.modules={1593:(a,b,c)=>{"use strict";c.d(b,{D:()=>s,P:()=>t});var d=c(8249),e=c(7484);let f=[/^(.+?)\s{2,}([\d.]+)\s+([\w/^³⁶μ%°]+)\s+([\d.]+ [–-] [\d.]+)\s+(HIGH|LOW)?/,/^(.+?)[:]\s*([\d.]+)\s*([\w/^³μ%°]*)\s*(?:\(Normal[:\s]+([\d.]+ ?[–-] ?[\d.]+)\))?/i,/^(.+?)\s{2,}([\d.]+)\s+([\w/^³μ%°]+)\s+([\d.]+ ?[–-] ?[\d.]+)/];function g(a){let b=[],c=new Set;for(let d of a.split("\n").map(a=>a.trim()).filter(Boolean))if(!/^(TEST|RESULT|UNIT|REFERENCE|FLAG|SECTION|PANEL|PROFILE|COUNT|STUDY)/i.test(d)&&!(d.length<5))for(let a of f){let e=d.match(a);if(!e)continue;let f=e[1].trim().replace(/\s+/g," "),g=e[2],h=e[3]||"",i=e[4]||"",j=e[5]||"";if(f.length<2||f.length>80||!g||isNaN(parseFloat(g)))continue;let k=f.toLowerCase();if(c.has(k))continue;c.add(k);let l=j||function(a,b){if(!b)return"";let c=parseFloat(a);if(isNaN(c))return"";let d=b.match(/([\d.]+)\s*[–-]\s*([\d.]+)/);if(!d){let a=b.match(/< ?([\d.]+)/),d=b.match(/> ?([\d.]+)/);return a&&c>parseFloat(a[1])?"HIGH":d&&c<parseFloat(d[1])?"LOW":""}let e=parseFloat(d[1]),f=parseFloat(d[2]);return c<e?"LOW":c>f?"HIGH":"NORMAL"}(g,i);b.push({test:f,value:g,unit:h,refRange:i,flag:l});break}return b}let h=[{id:"mock-001",name:"lab_results_march_2026.pdf",fileType:"application/pdf",size:124800,uploadedAt:"2026-03-14T09:30:00.000Z",status:"ready",isMock:!0,textContent:`CLINICAL LABORATORY REPORT

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

CONCLUSION: Results within normal reference range. Follow-up recommended in 6 months.`,analysis:{classification:{type:"Lab Report",confidence:.94},entities:{persons:["Sarah Mitchell","Dr. James Harrington"],dates:["14/08/1982","14 March 2026"],organizations:["Clinical Laboratory"],medications:[]},metrics:{"Patient ID":"PT-2026-04521","Date of Birth":"14/08/1982","Attending Physician":"Dr. James Harrington","Primary Diagnosis":"Results within normal reference range"},summary:"Complete blood count and metabolic panel results for patient Sarah Mitchell show all values within normal reference ranges. Lipid panel shows total cholesterol of 195 mg/dL with LDL 118 mg/dL. Follow-up recommended in 6 months.",patientName:"Sarah Mitchell",labValues:g(`COMPLETE BLOOD COUNT (CBC)
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
GP, Parkside Medical Practice`,analysis:{classification:{type:"Referral Letter",confidence:.93},entities:{persons:["Anna Kowalski","Dr. Helen Walsh"],dates:["15/06/1965","10 April 2026"],organizations:["Royal General Hospital","Parkside Medical Practice"],medications:["Metformin","Lisinopril"]},metrics:{"Patient ID":"PT-2026-06234","Date of Birth":"15/06/1965","Attending Physician":"Dr. Helen Walsh","Primary Diagnosis":"Exertional chest tightness and palpitations"},summary:"Referral from Dr. Helen Walsh to cardiology for Anna Kowalski presenting with exertional chest tightness and palpitations over 3 months. Background of Type 2 diabetes and hypertension with a family history of ischaemic heart disease. Resting ECG shows occasional ectopics.",patientName:"Anna Kowalski"}}],i=1,j=0;async function k(){let a=await c.e(889).then(c.t.bind(c,4889,23));return a.GlobalWorkerOptions.workerSrc="/pdf.worker.min.mjs",a}async function l(a){let b=await k(),c=await a.arrayBuffer(),d=await b.getDocument({data:new Uint8Array(c)}).promise,e="";for(let a=1;a<=Math.min(d.numPages,10);a++){let b=await d.getPage(a);e+=(await b.getTextContent()).items.map(a=>a.str).join(" ")+"\n"}return e.trim()}let m=[{type:"Lab Report",keywords:["laboratory","lab report","test result","reference range","specimen","cbc","hba1c","glucose","hemoglobin","platelet","wbc","rbc","cholesterol","triglyceride","creatinine","sodium","potassium","metabolic panel","blood count"]},{type:"Prescription",keywords:["prescription","prescribe","prescribed","rx:","tablet","capsule","mg daily","mg twice","mg three times","take 1","pharmacy","prescribing physician","refill","sig:"]},{type:"Discharge Summary",keywords:["discharge summary","discharge date","admission date","chief complaint","hospital course","discharge instructions","discharge medications","admitted via","inpatient"]},{type:"Imaging Report",keywords:["mri","ct scan","x-ray","ultrasound","imaging","radiolog","impression:","findings:","scan date","dicom","contrast","parenchymal","ischaemia","radiologist"]},{type:"Referral Letter",keywords:["referral","dear dr","i would be grateful","kindly review","kindly see","please see","refer","specialist","kind regards","re:","from:"]},{type:"Consent Form",keywords:["consent","authorize","authorise","acknowledge","i agree","i understand","signature","procedure","risk","informed consent","patient consent"]}],n=[/patient(?:\s+name)?[:]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,/(?:re|patient):?\s+(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g,/(?:Mr|Mrs|Ms|Miss)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g],o=[/\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/g,/\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi],p=["amoxicillin","ibuprofen","paracetamol","acetaminophen","metformin","lisinopril","atorvastatin","omeprazole","aspirin","warfarin","insulin","prednisone","amlodipine","sertraline","levothyroxine","metoprolol","ramipril","simvastatin","furosemide","clopidogrel"];function q(a){let b,c,d,e=(b=a.toLowerCase(),(c=m.map(({type:a,keywords:c})=>({type:a,hits:c.filter(a=>b.includes(a)).length,total:c.length}))).sort((a,b)=>b.hits-a.hits),0===(d=c[0]).hits?{type:"Other",confidence:.3}:{type:d.type,confidence:Math.min(.97,.45+d.hits/d.total*1.5)}),f=function(a){let b={persons:[],dates:[],organizations:[],medications:[]};for(let c of n)for(let d of[...a.matchAll(c)]){let a=d[1]?.trim();a&&a.length>3&&!b.persons.includes(a)&&b.persons.push(a)}for(let c of o)for(let d of[...a.matchAll(c)]){let a=d[0]?.trim();a&&!b.dates.includes(a)&&b.dates.push(a)}let c=a.toLowerCase();for(let a of p)if(c.includes(a)){let c=a.charAt(0).toUpperCase()+a.slice(1);b.medications.includes(c)||b.medications.push(c)}for(let c of[...a.matchAll(/([A-Z][A-Za-z\s]+(?:Hospital|Clinic|Medical Centre|Medical Center|Health|Pharmacy|Practice|Institute)[A-Za-z\s]*)/g)]){let a=c[1]?.trim();a&&a.length<60&&!b.organizations.includes(a)&&b.organizations.push(a)}return b}(a),h=function(a){let b={};for(let[c,d]of Object.entries({"Patient ID":/patient\s+(?:id|number|no)\.?[:]\s*([A-Z0-9-]+)/i,"Date of Birth":/(?:date of birth|dob|d\.o\.b)\.?[:]\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{1,2}\s+\w+\s+\d{4})/i,"Attending Physician":/(?:attending|prescribing physician|reporting radiologist|from)[:]\s*(?:Dr\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/,"Primary Diagnosis":/(?:diagnosis|impression|chief complaint|indication)[:]\s*([^\n.]{5,100})/i,"Next Appointment":/(?:next appointment|follow.?up|review date)[:]\s*([^\n]{5,80})/i})){let e=a.match(d);e&&(b[c]=e[1].trim().replace(/\s+/g," "))}return b}(a),i=a.replace(/\n+/g," ").split(/(?<=[.!?])\s+/).map(a=>a.trim()).filter(a=>a.length>40&&a.length<300&&!/^(date|patient id|rx:|sig:)/i.test(a)).slice(0,3).join(" ")||a.slice(0,250)+"…",j=f.persons[0]||null;return{classification:e,entities:f,metrics:h,summary:i,patientName:j,labValues:g(a)}}let r=(0,e.createContext)(null);function s({children:a}){let{toasts:b,addToast:f,removeToast:g}=function(){let[a,b]=(0,e.useState)([]);return{toasts:a,addToast:(0,e.useCallback)((a,c="info",d=4e3)=>{let e=++j;return b(b=>[...b,{id:e,message:a,type:c}]),d>0&&setTimeout(()=>b(a=>a.filter(a=>a.id!==e)),d),e},[]),removeToast:(0,e.useCallback)(a=>{b(b=>b.filter(b=>b.id!==a))},[])}}(),{documents:k,addDocument:m,updateDocument:n,deleteDocument:o}=function(){let[a,b]=(0,e.useState)(h),c=(0,e.useCallback)(a=>{let c=`doc-${Date.now()}-${i++}`,d=URL.createObjectURL(a),e={id:c,name:a.name,fileType:a.type,size:a.size,uploadedAt:new Date().toISOString(),status:"uploading",isMock:!1,file:a,objectUrl:d,textContent:null,analysis:null};return b(a=>[e,...a]),c},[]);return{documents:a,addDocument:c,updateDocument:(0,e.useCallback)((a,c)=>{b(b=>b.map(b=>{if(b.id!==a)return b;let d="function"==typeof c?c(b):c;return{...b,...d}}))},[]),deleteDocument:(0,e.useCallback)(a=>{b(b=>{let c=b.find(b=>b.id===a);return c?.objectUrl&&URL.revokeObjectURL(c.objectUrl),b.filter(b=>b.id!==a)})},[])}}(),p=function({updateDocument:a,addToast:b}){let[d,f]=(0,e.useState)(null),[g,h]=(0,e.useState)(null),[i,j]=(0,e.useState)(!1),[k,m]=(0,e.useState)(!1),n=(0,e.useRef)([]),o=(0,e.useCallback)(async(b,d)=>{f(b);try{let{loadModels:e,enhanceAnalysis:f}=await c.e(31).then(c.bind(c,31));await e(a=>{"progress"===a.status&&h({loaded:a.loaded,total:a.total,file:a.file})});let g=await f(d);g&&a(b,a=>({analysis:{...a.analysis||{},classification:g.classification,entities:{...a.analysis?.entities||{},...g.entities},...g.summary?{summary:g.summary}:{},aiEnhanced:!0}}))}catch(a){console.error("AI enhancement failed",a)}finally{f(null),h(null)}},[a]),p=(0,e.useCallback)(async(d,e)=>{a(d,{status:"analysing"});try{let b="";if("application/pdf"===e.type)b=await l(e);else if(e.type.startsWith("text/"))b=await e.text();else if(e.type.startsWith("image/")){let{generateImageAnalysis:f}=await c.e(250).then(c.bind(c,1250)),g=f(e);try{let a=await c.e(31).then(c.bind(c,31));b=a.isLoaded()?await a.extractTextFromImage(e):e.name.replace(/\.[^.]+$/,"").replace(/[-_]/g," ")}catch{b=e.name.replace(/\.[^.]+$/,"").replace(/[-_]/g," ")}let h=q(b);a(d,{status:"ready",textContent:b,analysis:{...h,classification:{type:("X-Ray"===g.modality||"MRI"===g.modality||g.modality,"Imaging Report"),confidence:.97},imageAnalysis:g,aiEnhanced:!0}});return}else b=e.name.replace(/\.[^.]+$/,"").replace(/[-_]/g," ");let f=q(b);a(d,{status:"ready",textContent:b,analysis:f}),i?o(d,b):n.current.push({id:d,text:b})}catch(c){console.error("Analysis failed",c),a(d,{status:"error"}),b(`Analysis failed for ${e.name}`,"error")}},[a,b,i,o]);return{analyzeFile:p,enhanceWithAI:(0,e.useCallback)(async(a,c)=>{await o(a,c),b("AI analysis complete","success")},[o,b]),aiLoading:null!==d,aiLoadingId:d,aiLoadProgress:g,modelsReady:i,modelsPreloading:k}}({updateDocument:n,addToast:f}),t={documents:k,addDocument:m,updateDocument:n,deleteDocument:o,toasts:b,addToast:f,removeToast:g,...p};return(0,d.jsx)(r.Provider,{value:t,children:a})}function t(){let a=(0,e.useContext)(r);if(!a)throw Error("useMedDocs must be used within MedDocsProvider");return a}},1840:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,1921,23)),Promise.resolve().then(c.t.bind(c,440,23)),Promise.resolve().then(c.t.bind(c,4342,23)),Promise.resolve().then(c.t.bind(c,2265,23)),Promise.resolve().then(c.t.bind(c,5421,23)),Promise.resolve().then(c.t.bind(c,1335,23)),Promise.resolve().then(c.t.bind(c,664,23)),Promise.resolve().then(c.bind(c,4661))},2112:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,5547,23)),Promise.resolve().then(c.t.bind(c,5098,23)),Promise.resolve().then(c.t.bind(c,7644,23)),Promise.resolve().then(c.t.bind(c,3859,23)),Promise.resolve().then(c.t.bind(c,8099,23)),Promise.resolve().then(c.t.bind(c,6237,23)),Promise.resolve().then(c.t.bind(c,8562,23)),Promise.resolve().then(c.t.bind(c,6675,23))},2263:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,1921,23))},2704:()=>{},3041:(a,b,c)=>{Promise.resolve().then(c.bind(c,4476))},3313:(a,b,c)=>{Promise.resolve().then(c.bind(c,3962))},3962:(a,b,c)=>{"use strict";c.d(b,{Providers:()=>f});var d=c(8249),e=c(1593);function f({children:a}){return(0,d.jsx)(e.D,{children:a})}},4476:(a,b,c)=>{"use strict";c.d(b,{Providers:()=>d});let d=(0,c(7943).registerClientReference)(function(){throw Error("Attempted to call Providers() from the server but Providers is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"/Users/appu/Documents/medical-analysis/app/providers.js","Providers")},6487:()=>{},7839:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,5547,23))},8335:()=>{},9450:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>g,metadata:()=>f});var d=c(5735);c(2704);var e=c(4476);let f={title:"MedDocs — Medical Document Manager",description:"Upload and analyse medical documents with AI-powered analysis"};function g({children:a}){return(0,d.jsx)("html",{lang:"en",children:(0,d.jsx)("body",{children:(0,d.jsx)(e.Providers,{children:a})})})}}};