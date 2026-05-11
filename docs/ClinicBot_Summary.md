# ClinicBot: Guideline-Grounded Clinical Chatbot

## 🧠 Overview
ClinicBot is an AI-powered clinical chatbot designed to provide:
- Accurate medical answers
- Verifiable evidence
- Zero hallucination responses

Unlike traditional AI systems, it strictly follows **official clinical guidelines**.

---

## 🚨 Problem Statement
Traditional AI and RAG systems:
- Treat all data equally ❌
- Produce generic responses ❌
- May hallucinate ❌

👉 This is dangerous in healthcare.

---

## 💡 Core Innovations

### 1. Structured Knowledge Base
Instead of raw documents, data is structured into:
- **Recommendations** (highest priority)
- **Tables** (numeric criteria)
- **Narrative Text** (supporting explanation)

Stored as structured JSON.

---

### 2. Prioritized Retrieval
Unlike similarity-based retrieval, ClinicBot uses **priority-based retrieval**:

1. Recommendations
2. Tables
3. Narrative text

👉 Ensures clinically correct outputs.

---

### 3. Verifiable Answers
Before returning results:
- Every claim must have a **citation**
- Numeric values must match exactly
- If insufficient data → system **refuses to answer**

---

## ⚙️ System Architecture

### Pipeline Flow:
1. User submits query
2. System identifies relevant guideline section
3. Retrieves evidence (priority-based)
4. Generates response
5. Validates response
6. Displays:
   - Concise Answer
   - Supporting Evidence

---

## 🧪 Example Use Case

### Input:
Patient with glucose level = 130 mg/dL

### Process:
- Identify guideline section
- Retrieve:
  - Recommendation
  - Diagnostic table
  - Supporting text

### Output:
- Diagnosis: Prediabetes
- Recommendation: Perform A1C or OGTT
- Includes citations

---

## 📊 Risk Assessment Feature

ClinicBot includes a diabetes risk calculator based on:
- Age
- Gender
- Family history
- Physical activity
- BMI

### Output:
- Risk score
- Risk category
- Clinical recommendations

---

## 🏗️ Technology Stack

- Backend: Python (Flask)
- AI Model: GPT-4o (via OpenRouter)
- Retrieval: LlamaIndex
- Data Format: JSON (structured guidelines)

---

## 📈 Performance

- Overall Accuracy: **96%**
  - Fully correct: 63%
  - Partially correct: 33%
  - Incorrect: 3%

---

## 🧠 Key Takeaways

### 1. Avoid Raw RAG
Structure your data instead of using raw documents.

### 2. Prioritize Data
Not all data is equal:
- Rules > Tables > Text

### 3. Add Validation Layer
Always verify:
- Source
- Numbers
- Evidence

### 4. Improve UX
Split output into:
- Short answer
- Detailed evidence

---

## 🚀 Practical Applications

You can apply this approach to:
- Financial decision systems
- Loan approval engines
- Enterprise AI platforms

---

## 🎯 Final Summary

ClinicBot combines:

**RAG + Structured Data + Priority Logic + Validation + Explainability**

Transforms:
LLM → Smart Assistant → Trustworthy System
