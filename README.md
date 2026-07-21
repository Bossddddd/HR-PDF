# HR-PDF — ระบบสร้างแบบฟอร์ม PDF อัตโนมัติสำหรับงาน HR

> ระบบจัดการเอกสาร HR แบบดิจิทัล รองรับการสร้างแบบฟอร์มแบบ Dynamic, ลงลายเซ็นอิเล็กทรอนิกส์, Workflow อนุมัติหลายขั้นตอน และส่งออกเป็น PDF/DOCX อัตโนมัติ

---

## 📋 สารบัญ

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Infrastructure](#-infrastructure)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router, Server Actions) |
| **Language** | TypeScript |
| **Styling** | TailwindCSS 4 |
| **ORM** | Prisma 7 |
| **Database** | Neon PostgreSQL (ap-southeast-1) |
| **File Storage** | Vercel Blob |
| **PDF Generation** | pdf-lib, docxtemplater |
| **Deployment** | Vercel |
| **Doc Conversion** | doc2pdf API (Render.com) |

---

## ✨ Features

- **Document Builder** — สร้างเอกสาร HR แบบ Canvas (ลาก-วาง) หรืออัปโหลดไฟล์ PDF/Word
- **Workflow Management** — กำหนดขั้นตอนอนุมัติหลายระดับ (User → Manager → HR)
- **Electronic Signature** — ลงลายเซ็นผ่านมือถือด้วย QR Code (sign-mobile)
- **PDF/DOCX Export** — ส่งออกเอกสารเป็น PDF หรือ DOCX พร้อมข้อมูลที่กรอกแล้ว
- **Role-Based Access** — ระบบ Role & Permission ควบคุมสิทธิ์การเข้าถึง
- **Admin Dashboard** — จัดการเอกสาร, ผู้ใช้, บทบาท, และดู Audit Logs
- **Inbox System** — ระบบแจ้งเตือนและติดตามสถานะเอกสาร

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone repository
git clone https://github.com/Bossddddd/HR-PDF.git
cd HR-PDF

# ติดตั้ง dependencies (จะ generate Prisma Client อัตโนมัติผ่าน postinstall)
npm install

# ตั้งค่า environment variables
cp .env.example .env
# แก้ไขค่าใน .env ให้ตรงกับ database ของคุณ

# รัน development server
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) เพื่อเข้าใช้งาน

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | รัน development server |
| `npm run build` | Build production (`prisma generate && next build`) |
| `npm run start` | รัน production server |
| `npm run lint` | ตรวจสอบโค้ดด้วย ESLint |

---

## 📁 Project Structure

```
HR-PDF/
├── prisma/
│   └── schema.prisma          # Database schema (Role, User, Document, Workflow ฯลฯ)
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── actions/           # Server Actions
│   │   ├── admin/             # Admin Dashboard (documents, forms, roles, users, logs)
│   │   ├── api/               # API Routes (export-document, file, seed)
│   │   ├── context/           # React Context (Auth, Role)
│   │   ├── form/              # แบบฟอร์มสำหรับผู้ใช้กรอกข้อมูล
│   │   ├── inbox/             # ระบบติดตามสถานะเอกสาร
│   │   ├── sign-mobile/       # ลงลายเซ็นผ่านมือถือ
│   │   ├── layout.tsx         # Root Layout
│   │   ├── page.tsx           # หน้าแรก (Login / Landing)
│   │   └── globals.css        # Global styles
│   ├── components/            # Shared components (Header, RoleGuard, RoleSwitcher)
│   └── lib/
│       └── prisma.ts          # Prisma Client singleton
├── vercel.json                # Vercel deployment config
├── package.json
└── tsconfig.json
```

---

## 🔄 CI/CD Pipeline

โปรเจกต์นี้ใช้ **Vercel Git Integration** สำหรับ CI/CD Pipeline แบบอัตโนมัติ — ไม่ต้องเขียน GitHub Actions หรือ CI config เพิ่มเติม ทุกอย่าง trigger อัตโนมัติเมื่อ push code ไปยัง GitHub

### Architecture Overview

```mermaid
graph TB
    subgraph DEV["🧑‍💻 Development"]
        direction TB
        D1["Developer Workstation<br/>(VS Code / IDE)"]
        D2["Local Dev Server<br/><code>npm run dev</code>"]
        D3["Prisma Studio<br/>(DB Management)"]
        D1 --> D2
        D1 --> D3
    end

    subgraph VCS["📦 Version Control"]
        direction TB
        G1["GitHub Repository<br/><code>Bossddddd/HR-PDF</code>"]
        G2["Branch: main"]
        G3["Branch: feature/*"]
        G1 --- G2
        G1 --- G3
    end

    subgraph CI["⚙️ Continuous Integration"]
        direction TB
        CI1["Trigger:<br/>Push / Pull Request"]
        CI2["Install Dependencies<br/><code>npm install</code>"]
        CI3["Generate Prisma Client<br/><code>prisma generate</code>"]
        CI4["ESLint Check<br/><code>npm run lint</code>"]
        CI5["TypeScript Compile<br/><code>next build</code>"]
        CI1 --> CI2 --> CI3 --> CI4 --> CI5
    end

    subgraph CD["🚀 Continuous Deployment"]
        direction TB
        CD1{"Branch?"}
        CD2["Preview Deployment<br/>(*.vercel.app)"]
        CD3["Production Deployment<br/>(Custom Domain)"]
        CD4["Build Output: .next<br/>(SSR + Static)"]
        CD1 -->|"feature/* / PR"| CD2
        CD1 -->|"main"| CD3
        CD2 --> CD4
        CD3 --> CD4
    end

    subgraph INFRA["☁️ Infrastructure"]
        direction TB
        I1["Neon PostgreSQL<br/>(Connection Pooling)"]
        I2["Vercel Blob Storage<br/>(PDF/DOCX Files)"]
        I3["doc2pdf API<br/>(Render.com)"]
        I4["Vercel Edge Network<br/>(CDN + Serverless)"]
    end

    DEV -->|"git push"| VCS
    VCS -->|"Webhook"| CI
    CI -->|"Build Success ✅"| CD
    CD --> INFRA
    I4 --> I1
    I4 --> I2
    I4 --> I3

    style DEV fill:#1a1a2e,stroke:#16213e,color:#e0e0e0
    style VCS fill:#0d1b2a,stroke:#1b263b,color:#e0e0e0
    style CI fill:#1b2838,stroke:#2a4066,color:#e0e0e0
    style CD fill:#0a2239,stroke:#1d4e89,color:#e0e0e0
    style INFRA fill:#132a13,stroke:#31572c,color:#e0e0e0
```

### Deployment Flow

```mermaid
sequenceDiagram
    actor Dev as 👩‍💻 Developer
    participant Git as GitHub
    participant Vercel as Vercel CI/CD
    participant Build as Build Process
    participant Preview as Preview Env
    participant Prod as Production
    participant Neon as Neon PostgreSQL
    participant Blob as Vercel Blob

    Note over Dev,Blob: 🔄 Development → Deployment Flow

    Dev->>Dev: แก้ไขโค้ดใน Next.js app
    Dev->>Dev: ทดสอบในเครื่อง (npm run dev)
    Dev->>Git: git push (feature branch)
    
    Git->>Vercel: Webhook: Push event
    activate Vercel
    
    Vercel->>Build: npm install
    Build->>Build: postinstall → prisma generate
    Build->>Build: ESLint validation
    Build->>Build: prisma generate && next build
    Build->>Build: สร้าง .next output
    
    alt Build Failed ❌
        Build-->>Vercel: Build Error
        Vercel-->>Dev: ❌ แจ้งเตือน (Email/Slack)
    else Build Success ✅
        Build-->>Vercel: Build artifacts พร้อม
    end
    
    alt Feature Branch (PR)
        Vercel->>Preview: Deploy ไปยัง Preview URL
        Preview-->>Dev: 🔗 ได้รับ Preview URL
        Dev->>Dev: ตรวจสอบและทดสอบ Preview
        Dev->>Git: Merge PR เข้า main
        Git->>Vercel: Webhook: Push to main
    end
    
    Vercel->>Prod: Deploy ไปยัง Production
    deactivate Vercel
    
    Note over Prod,Blob: 🌐 Runtime Connections
    
    Prod->>Neon: Database queries (Prisma Client)
    Prod->>Blob: อัปโหลด/ดาวน์โหลดไฟล์ (PDF, DOCX)
```

### Build Steps

| Step | Command | รายละเอียด |
|------|---------|------------|
| 1️⃣ Install | `npm install` | ติดตั้ง dependencies ทั้งหมด |
| 2️⃣ Postinstall | `prisma generate` | สร้าง Prisma Client จาก schema.prisma |
| 3️⃣ Lint | `npm run lint` | ตรวจสอบคุณภาพโค้ดด้วย ESLint |
| 4️⃣ Build | `prisma generate && next build` | Build production bundle (SSR + Static) |
| 5️⃣ Output | `.next/` directory | Vercel deploy จาก output directory นี้ |

### Pipeline Features

| Feature | รายละเอียด |
|---------|------------|
| **Auto Preview** | ทุก PR / branch ได้ Preview URL อัตโนมัติ |
| **Zero-Downtime Deploy** | ใช้ immutable deployments ไม่มี downtime |
| **Instant Rollback** | สามารถ rollback ไปยัง deployment ก่อนหน้าได้ทันที |
| **Edge Caching** | Static pages ถูก cache ที่ Edge Network ทั่วโลก |
| **Serverless Functions** | API Routes ทำงานเป็น serverless functions |
| **Connection Pooling** | Neon PostgreSQL ใช้ PgBouncer สำหรับ connection pooling |

---

## ☁️ Infrastructure

```mermaid
graph TB
    subgraph CLIENT["🌐 Client"]
        C1["HR Staff / Managers"]
        C2["Mobile Signature<br/>(sign-mobile)"]
    end

    subgraph VERCEL["☁️ Vercel Platform"]
        V1["Edge Network (CDN)"]
        V2["Serverless Functions<br/>(API Routes + Server Actions)"]
        V3["Static Assets<br/>(Next.js Pages)"]
    end

    subgraph DATA["💾 Data Layer"]
        DB["Neon PostgreSQL<br/>(ap-southeast-1)"]
        BLOB["Vercel Blob<br/>(PDF/DOCX Storage)"]
    end

    subgraph EXTERNAL["🔗 External Services"]
        DOC2PDF["doc2pdf API<br/>(Render.com)<br/>DOCX → PDF Conversion"]
    end

    C1 -->|"HTTPS"| V1
    C2 -->|"HTTPS"| V1
    V1 --> V2
    V1 --> V3
    V2 -->|"Prisma Client<br/>(Connection Pooling)"| DB
    V2 -->|"Upload/Download"| BLOB
    V2 -->|"REST API"| DOC2PDF

    style CLIENT fill:#2d1b4e,stroke:#4a2d7a,color:#e0e0e0
    style VERCEL fill:#000000,stroke:#333,color:#e0e0e0
    style DATA fill:#1a2e1a,stroke:#2d4a2d,color:#e0e0e0
    style EXTERNAL fill:#3d2b1a,stroke:#5a3d2a,color:#e0e0e0
```

---

## 🗄 Database Schema

```mermaid
erDiagram
    Role ||--o{ User : "has many"
    Document ||--o{ WorkflowStep : "used in"
    Workflow ||--o{ WorkflowStep : "has steps"
    Workflow ||--o{ WorkflowResponse : "has responses"

    Role {
        string id PK
        string name UK
        int level
        string permissions
        boolean isSystem
    }

    User {
        string id PK
        string username UK
        string password
        string roleId FK
    }

    Document {
        string id PK
        string title
        string type
        string contentJson
        string fileUrl
    }

    Workflow {
        string id PK
        string title
        boolean isLoginRequired
    }

    WorkflowStep {
        string id PK
        int orderIndex
        string roleName
        string workflowId FK
        string documentId FK
    }

    WorkflowResponse {
        string id PK
        string submitterName
        string status
        int currentStep
        string dataJson
    }

    SignatureSession {
        string id PK
        string status
        string imageUrl
        datetime expiresAt
    }

    AuditLog {
        string id PK
        string action
        string details
        string user
    }

    Setting {
        string id PK
        string key UK
        string value
    }
```

---

## 🔐 Environment Variables

| Variable | รายละเอียด | ตัวอย่าง |
|----------|------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled) | `postgresql://...pooler.neon.tech/neondb` |
| `DATABASE_URL_UNPOOLED` | Direct connection (ไม่ผ่าน PgBouncer) | `postgresql://...neon.tech/neondb` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob access token | `vercel_blob_rw_...` |
| `BLOB_STORE_ID` | Vercel Blob store identifier | `store_...` |
| `PDF_CONVERTER_URL` | doc2pdf API endpoint | `https://doc2pdf-....onrender.com/api/convert-to-pdf` |

> **หมายเหตุ**: ไฟล์ `.env` อยู่ใน `.gitignore` — ไม่ถูก commit ขึ้น repository ตั้งค่า environment variables ผ่าน Vercel Dashboard สำหรับ Preview และ Production

---

## 📄 License

Private — Internal use only.
