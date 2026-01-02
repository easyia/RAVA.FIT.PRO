# RAVA.FIT.PRO – Comprehensive Technical Documentation
## Senior Developer Onboarding Guide

**Last Updated:** 2025-12-31  
**Project Status:** Active Development (MVP Complete)  
**Tech Lead:** AI-Assisted Development  
**Target Users:** Personal Trainers & Nutrition Coaches

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack Deep Dive](#technology-stack-deep-dive)
4. [Database Schema & Data Model](#database-schema--data-model)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend & Edge Functions](#backend--edge-functions)
7. [AI Integration Layer](#ai-integration-layer)
8. [Authentication & Security](#authentication--security)
9. [Critical Business Logic](#critical-business-logic)
10. [API Reference](#api-reference)
11. [State Management Patterns](#state-management-patterns)
12. [UI/UX Design System](#uiux-design-system)
13. [Development Workflow](#development-workflow)
14. [Testing Strategy](#testing-strategy)
15. [Deployment & DevOps](#deployment--devops)
16. [Performance Optimization](#performance-optimization)
17. [Known Issues & Technical Debt](#known-issues--technical-debt)
18. [Future Roadmap](#future-roadmap)
19. [Troubleshooting Guide](#troubleshooting-guide)

---

## 1. Executive Summary

### 1.1 Project Vision
RAVA.FIT.PRO is a **full-stack SaaS platform** designed to revolutionize how personal trainers and nutrition coaches manage their clients. The platform combines traditional client management with **AI-powered diet and training plan generation**, creating a seamless workflow from client onboarding to protocol deployment.

### 1.2 Core Value Propositions
- **AI-First Approach**: Leverage GPT-4o-mini to generate personalized diet plans with 3 meal options per time slot
- **Single Source of Truth**: Centralized student data with comprehensive anamnesis tracking
- **Protocol Management**: Edit, version, and deploy AI-generated training and nutrition protocols
- **Scientific Accuracy**: TMB/GET calculations using Mifflin-St Jeor and Tinsley equations
- **Coach Autonomy**: Full control over AI suggestions with inline editing capabilities

### 1.3 Key Metrics
- **Target Response Time**: < 2s for AI diet generation
- **Database Tables**: 15+ core entities
- **UI Components**: 60+ reusable ShadCN components
- **Edge Functions**: 1 production (generate-diet), 2 planned
- **Supported Browsers**: Chrome 90+, Firefox 88+, Safari 14+

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  React 18 + Vite + TypeScript + TailwindCSS + ShadCN UI   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Dashboard   │  │ AI Assistant │  │  Protocols   │    │
│  │   Pages      │  │    Pages     │  │    Editor    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  STATE MANAGEMENT                           │
│         @tanstack/react-query (Server State)               │
│         React Context (UI State)                           │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  PostgreSQL  │  │  Auth (JWT)  │  │ Edge Funcs   │    │
│  │   Database   │  │     RLS      │  │   (Deno)     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI LAYER                                 │
│              OpenAI GPT-4o-mini API                        │
│         (Structured JSON Output Mode)                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow Example (Diet Generation)
```
1. User clicks "Generate Diet" in AINutritionAssistant.tsx
   ↓
2. Component validates student has training program
   ↓
3. Calculates TMB/GET using nutritionCalculations.ts
   ↓
4. Calls Supabase Edge Function via supabase.functions.invoke()
   ↓
5. Edge Function (generate-diet/index.ts):
   - Fetches student data (anamnesis, training)
   - Constructs system + user prompts
   - Calls OpenAI API with JSON mode
   - Returns structured diet object
   ↓
6. Frontend receives diet, displays 3 options per meal
   ↓
7. User selects options, clicks "Save"
   ↓
8. saveMealPlan() inserts into meal_plans + meals + meal_foods tables
   ↓
9. Navigate to /protocolos to view/edit saved plan
```

### 2.3 Data Flow Patterns
- **Optimistic Updates**: Not currently implemented (future enhancement)
- **Cache Invalidation**: React Query automatically refetches on window focus
- **Real-time Sync**: Supabase Realtime not yet enabled (planned for collaborative editing)

---

## 3. Technology Stack Deep Dive

### 3.1 Frontend Stack

#### 3.1.1 Core Framework
- **React 18.3.1**: Concurrent features, automatic batching, Suspense
- **TypeScript 5.8.3**: Strict mode enabled, full type coverage
- **Vite 5.4.19**: Lightning-fast HMR, optimized production builds

#### 3.1.2 UI Library
- **ShadCN UI**: Headless components built on Radix UI primitives
  - **Why ShadCN?** Copy-paste components, full customization, no runtime overhead
  - **Components Used**: Button, Card, Dialog, Tooltip, Slider, Tabs, Select, Input, Label, Badge, Skeleton
- **Tailwind CSS 3.4.17**: Utility-first styling, custom design tokens
- **Lucide React 0.462.0**: 1000+ SVG icons, tree-shakeable

#### 3.1.3 State Management
- **@tanstack/react-query 5.83.0**: Server state management
  - **Query Keys**: `['students']`, `['studentDetails', id]`, `['trainingPrograms', studentId]`
  - **Stale Time**: Default 0ms (always refetch on mount)
  - **Cache Time**: 5 minutes
  - **Retry Logic**: 3 attempts with exponential backoff
- **React Context**: Minimal usage for theme, sidebar collapse state

#### 3.1.4 Form Handling
- **react-hook-form 7.61.1**: Performant form validation
- **zod 3.25.76**: Runtime type validation, schema inference
- **@hookform/resolvers 3.10.0**: Zod integration

#### 3.1.5 Routing
- **react-router-dom 6.30.1**: Client-side routing
  - **Lazy Loading**: Not yet implemented (future optimization)
  - **Protected Routes**: Auth check in App.tsx

### 3.2 Backend Stack

#### 3.2.1 Supabase Services
- **PostgreSQL 15**: Relational database with JSONB support
- **PostgREST**: Auto-generated REST API from schema
- **GoTrue**: JWT-based authentication
- **Storage**: File uploads (avatars, assessment photos)
- **Edge Functions**: Deno runtime (TypeScript native)

#### 3.2.2 Edge Function Runtime
- **Deno 1.x**: Secure by default, TypeScript native
- **Dependencies**: `@supabase/supabase-js@2`, `openai` (via fetch)
- **Environment Variables**: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

### 3.3 AI Stack
- **OpenAI API**: GPT-4o-mini model
- **Response Format**: JSON mode (`response_format: { type: "json_object" }`)
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Max Tokens**: ~2000 per diet generation

### 3.4 Development Tools
- **ESLint 9.32.0**: Code linting with React hooks plugin
- **Prettier**: Code formatting (configured via .prettierrc)
- **Bun**: Alternative package manager (lockfile present)
- **Git**: Version control with conventional commits

---

## 4. Database Schema & Data Model

### 4.1 Core Entities

#### 4.1.1 Coaches Table
```sql
CREATE TABLE coaches (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```
- **Purpose**: Store coach profiles linked to Supabase Auth
- **RLS**: Coaches can only view/update their own profile
- **Relationships**: One-to-many with students

#### 4.1.2 Students Table
```sql
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  birth_date date,
  sex text,
  phone text,
  email text,
  profession text,
  marital_status text,
  avatar_url text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
```
- **Purpose**: Core student entity
- **RLS**: Coach can only access their own students
- **Cascade**: Deleting coach deletes all students
- **Status Values**: 'active', 'inactive', 'waiting'

#### 4.1.3 Anamnesis Table
```sql
CREATE TABLE anamnesis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  -- Health History
  medical_conditions text,
  surgeries text,
  medications text,
  family_history text,
  injuries text,
  allergies text,
  -- Lifestyle
  diet_habits text,
  alcohol_use text,
  sleep_pattern text,
  physical_activity_history text,
  stress_level text,
  activity_level numeric, -- NAF value (1.2 - 1.9)
  -- Body Composition
  weight_kg numeric,
  height_cm numeric,
  bmi numeric,
  body_fat_percentage numeric,
  lean_mass numeric,
  fat_mass numeric,
  -- Goals
  main_goal text,
  secondary_goal text,
  goal_deadline text,
  motivation_barriers text,
  -- Preferences
  training_preferences text,
  equipment_availability text,
  schedule_availability text,
  physical_limitations text,
  created_at timestamptz DEFAULT now()
);
```
- **Purpose**: Comprehensive health and fitness assessment
- **Critical Fields**: `weight_kg`, `height_cm`, `main_goal`, `activity_level`
- **Used By**: TMB calculations, AI prompt generation

#### 4.1.4 Training Programs Table
```sql
CREATE TABLE training_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES coaches(id),
  title text,
  number_weeks int,
  sessions_per_week int,
  max_exercises_per_session int,
  start_date date,
  status text,
  created_at timestamptz DEFAULT now()
);
```
- **Purpose**: Container for training protocols
- **Status Values**: 'active', 'completed', 'draft'
- **Relationships**: One-to-many with training_sessions

#### 4.1.5 Training Sessions Table
```sql
CREATE TABLE training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_program_id uuid NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  division text, -- 'A', 'B', 'C', etc.
  name text, -- 'Superior', 'Inferior', 'Full Body'
  created_at timestamptz DEFAULT now()
);
```
- **Purpose**: Individual workout sessions within a program
- **Division**: Alphabetical split (A/B/C for 3-day split)

#### 4.1.6 Training Exercises Table
```sql
CREATE TABLE training_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id uuid NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  execution_order int,
  sets int,
  reps_min int,
  reps_max int,
  rest_time text, -- '60s', '90s', '2min'
  notes text,
  created_at timestamptz DEFAULT now()
);
```
- **Purpose**: Individual exercises within a session
- **Execution Order**: Determines display sequence in UI

#### 4.1.7 Meal Plans Table
```sql
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES coaches(id),
  title text,
  goal text,
  total_calories numeric,
  total_protein numeric,
  total_carbs numeric,
  total_fats numeric,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
```
- **Purpose**: Container for nutrition protocols
- **Macros**: Stored at plan level for quick reference

#### 4.1.8 Meals Table
```sql
CREATE TABLE meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id uuid NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  name text NOT NULL, -- 'Café da Manhã', 'Almoço'
  meal_time text, -- '08:00', '12:00'
  meal_order int,
  created_at timestamptz DEFAULT now()
);
```
- **Purpose**: Individual meals within a plan
- **Meal Order**: Determines display sequence (1 = breakfast, 2 = snack, etc.)

#### 4.1.9 Meal Foods Table
```sql
CREATE TABLE meal_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric,
  unit text, -- 'g', 'ml', 'unidade'
  calories numeric,
  protein numeric,
  carbs numeric,
  fats numeric,
  order_index int,
  created_at timestamptz DEFAULT now()
);
```
- **Purpose**: Individual food items within a meal
- **Macros**: Stored per food for granular tracking

#### 4.1.10 Physical Assessments Table
```sql
CREATE TABLE physical_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessment_date date NOT NULL,
  weight_kg numeric,
  body_fat_percentage numeric,
  muscle_mass_kg numeric,
  front_photo_url text,
  back_photo_url text,
  left_side_photo_url text,
  right_side_photo_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);
```
- **Purpose**: Track student progress over time
- **Photos**: Stored in Supabase Storage, URLs in DB

### 4.2 Row Level Security (RLS) Policies

#### 4.2.1 Critical RLS Patterns
All tables follow the same security model:
```sql
-- Coaches can only access their own students' data
CREATE POLICY "Coach accesses own students"
ON students FOR ALL
USING (auth.uid() = coach_id);

-- Nested RLS for related tables
CREATE POLICY "Coach accesses students anamnesis"
ON anamnesis FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM students 
    WHERE students.id = anamnesis.student_id 
    AND students.coach_id = auth.uid()
  )
);
```

#### 4.2.2 Common RLS Issues
- **401 Errors**: Usually caused by missing `auth.uid()` in request context
- **403 Errors**: Policy mismatch (e.g., trying to access another coach's student)
- **Empty Results**: RLS silently filters rows, check policies first

### 4.3 Database Migrations

#### 4.3.1 Migration Files (Chronological)
1. `20251230023418_init_schema.sql` - Initial schema (coaches, students, anamnesis, training, meals)
2. `20251230024500_automagic_coach_profile.sql` - Auto-create coach profile on signup
3. `20251230025100_add_missing_student_columns.sql` - Added avatar_url, emergency contacts
4. `20251230025444_auth_schema.sql` - Auth triggers and functions
5. `20251230030415_add_emergency_contacts_to_students.sql` - Emergency contact fields
6. `20251230034000_ai_agent_schema.sql` - AI-specific tables (future use)

#### 4.3.2 Migration Best Practices
- **Never edit existing migrations**: Create new migration files
- **Test locally first**: `supabase db reset` to test from scratch
- **Backup before deploy**: `supabase db dump > backup.sql`

---

## 5. Frontend Architecture

### 5.1 Project Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── AppSidebar.tsx          # Main navigation
│   │   └── Header.tsx              # Top bar (future)
│   ├── dashboard/
│   │   ├── StudentCard.tsx         # Student list item
│   │   ├── StudentDetailsModal.tsx # Quick view modal
│   │   └── StatsCard.tsx           # Dashboard metrics
│   ├── ui/                         # ShadCN components (60+)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── tooltip.tsx
│   │   ├── slider.tsx
│   │   └── ...
│   └── ...
├── pages/
│   ├── Dashboard.tsx               # Coach dashboard
│   ├── StudentList.tsx             # Student management
│   ├── StudentRegistration.tsx     # Onboarding form
│   ├── AITrainingAssistant.tsx     # Training plan generator
│   ├── AINutritionAssistant.tsx    # Diet plan generator ⭐
│   ├── Protocols.tsx               # Protocol editor ⭐
│   ├── ComparativeAnalysis.tsx     # Progress photos
│   ├── CalendarPage.tsx            # Schedule (future)
│   ├── Reports.tsx                 # Analytics (future)
│   ├── Settings.tsx                # User preferences
│   ├── Auth.tsx                    # Login/signup
│   ├── Onboarding.tsx              # First-time setup
│   └── NotFound.tsx                # 404 page
├── services/
│   ├── studentService.ts           # Student CRUD operations ⭐
│   └── statsService.ts             # Dashboard metrics
├── hooks/
│   ├── useAuth.ts                  # Authentication hook
│   ├── useToast.ts                 # Toast notifications
│   └── useMediaQuery.ts            # Responsive breakpoints
├── utils/
│   └── nutritionCalculations.ts    # TMB/GET formulas ⭐
├── types/
│   ├── student.ts                  # Student interfaces
│   └── database.ts                 # Supabase types (auto-generated)
├── lib/
│   ├── supabase.ts                 # Supabase client
│   └── utils.ts                    # cn() helper, etc.
├── App.tsx                         # Router configuration
├── main.tsx                        # Vite entry point
└── index.css                       # Global styles + Tailwind
```

### 5.2 Critical Components

#### 5.2.1 AINutritionAssistant.tsx (489 lines)
**Purpose**: AI-powered diet generation interface

**Key Features**:
- Student selection with search
- TMB/GET calculation display
- NAF (activity level) slider with descriptions
- Caloric adjustment input (deficit/surplus)
- Editable macronutrients
- AI diet generation with 3 options per meal
- Meal option selection
- Save to database

**State Management**:
```typescript
const [selectedStudentId, setSelectedStudentId] = useState<string>('');
const [naf, setNaf] = useState(1.55); // Activity level
const [calorieAdjustment, setCalorieAdjustment] = useState(0); // +/- kcal
const [customMacros, setCustomMacros] = useState({ p: 0, c: 0, f: 0 });
const [generatedDiet, setGeneratedDiet] = useState<any>(null);
const [isGenerating, setIsGenerating] = useState(false);
```

**Critical Logic**:
```typescript
// TMB calculation
const calculations = useMemo(() => {
  const mifflin = calculateMifflin(params);
  const get = mifflin * naf;
  return { mifflin, get, ... };
}, [anamnesis, naf, studentDetails]);

// Final target calories
const targetKcal = useMemo(() => {
  return Math.round(calculations.get) + calorieAdjustment;
}, [calculations, calorieAdjustment]);

// AI generation call
const handleGenerateDiet = async () => {
  const { data, error } = await supabase.functions.invoke('generate-diet', {
    body: {
      coach_id: coach.id,
      student_id: selectedStudentId,
      target_calories: targetKcal,
      macros: { p: customMacros.p, c: customMacros.c, f: customMacros.f }
    }
  });
};
```

#### 5.2.2 Protocols.tsx (367 lines)
**Purpose**: Central hub for viewing/editing AI-generated protocols

**Key Features**:
- Student selection
- Tabbed interface (Training / Nutrition)
- Inline editing of exercises and meals
- Add/remove exercises and foods
- Save changes to database
- Empty states with CTA to AI assistants

**State Management**:
```typescript
const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
const [editingDietId, setEditingDietId] = useState<string | null>(null);
const [editedSessions, setEditedSessions] = useState<Session[]>([]);
const [editedMeals, setEditedMeals] = useState<any[]>([]);
```

**Critical Logic**:
```typescript
// Start editing training
const handleEditTraining = (program: TrainingProgram) => {
  setEditingTrainingId(program.id);
  setEditedSessions(program.training_sessions.map(s => ({
    id: s.id,
    division: s.division,
    name: s.name,
    exercises: s.training_exercises.map(e => ({ ...e }))
  })));
};

// Save edited training
const handleSaveEditedTraining = async () => {
  for (const session of editedSessions) {
    // Delete old exercises
    await supabase.from('training_exercises').delete().eq('training_session_id', session.id);
    // Insert new exercises
    await supabase.from('training_exercises').insert(exercisesToInsert);
  }
};
```

#### 5.2.3 studentService.ts (576 lines)
**Purpose**: Centralized data access layer

**Key Functions**:
- `getStudents()`: Fetch all students with anamnesis
- `getStudentDetails(id)`: Fetch single student with full data
- `createStudent(formData)`: Multi-table insert (student + anamnesis)
- `getTrainingPrograms(studentId)`: Fetch with nested sessions/exercises
- `getMealPlans(studentId)`: Fetch with nested meals/foods
- `saveTrainingProgram(data)`: Insert training program
- `saveMealPlan(data)`: Insert meal plan
- `uploadAvatar(file)`: Upload to Supabase Storage

**Critical Pattern** (Multi-table Insert):
```typescript
export async function createStudent(formData: any): Promise<void> {
  // 1. Insert student
  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert({ ...studentData })
    .select()
    .single();

  // 2. Insert anamnesis
  const { error: anamnesisError } = await supabase
    .from('anamnesis')
    .insert({ student_id: student.id, ...anamnesisData });

  // 3. Handle errors
  if (studentError || anamnesisError) {
    // Rollback not automatic, need manual cleanup
    throw new Error('Failed to create student');
  }
}
```

### 5.3 Routing Configuration

#### 5.3.1 App.tsx Routes
```typescript
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/alunos" element={<StudentList />} />
  <Route path="/cadastro-aluno" element={<StudentRegistration />} />
  <Route path="/ia-assistant" element={<AITrainingAssistant />} />
  <Route path="/ia-diet-assistant" element={<AINutritionAssistant />} />
  <Route path="/protocolos" element={<Protocols />} />
  <Route path="/analise-comparativa" element={<ComparativeAnalysis />} />
  <Route path="/calendario" element={<CalendarPage />} />
  <Route path="/relatorios" element={<Reports />} />
  <Route path="/configuracoes" element={<Settings />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/onboarding" element={<Onboarding />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

#### 5.3.2 Protected Routes (Future Enhancement)
Currently all routes are accessible. Need to add:
```typescript
<Route element={<ProtectedRoute />}>
  <Route path="/" element={<Dashboard />} />
  {/* ... other protected routes */}
</Route>
```

---

## 6. Backend & Edge Functions

### 6.1 Supabase Edge Functions

#### 6.1.1 generate-diet Function (146 lines)
**Location**: `supabase/functions/generate-diet/index.ts`

**Purpose**: Orchestrate AI diet generation

**Request Schema**:
```typescript
interface GenerateDietRequest {
  coach_id: string;
  student_id: string;
  target_calories: number;
  macros: {
    p: number; // protein grams
    c: number; // carb grams
    f: number; // fat grams
  };
  prompt_users?: string; // optional custom instructions
}
```

**Response Schema**:
```typescript
interface DietResponse {
  success: boolean;
  diet: {
    titulo: string;
    objetivo: string;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fats: number;
    refeicoes: Array<{
      nome: string;
      horario: string;
      opcoes: Array<{
        id: number;
        itens: Array<{
          alimento: string;
          quantidade: number;
          unidade: string;
          carb: number;
          prot: number;
          gord: number;
        }>;
      }>;
    }>;
    justificativa: string;
    suplementacao_sugerida: string[];
  };
}
```

**Implementation Flow**:
```typescript
serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 2. Fetch student data
  const { data: student } = await supabase
    .from("students")
    .select("*, anamnesis(*)")
    .eq("id", body.student_id)
    .single();

  // 3. Fetch latest training program
  const { data: training } = await supabase
    .from("training_programs")
    .select("*, training_sessions(*, training_exercises(*))")
    .eq("student_id", body.student_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // 4. Build AI prompt
  const systemPrompt = `Você é um Nutricionista Esportivo...`;
  const userPrompt = `Dados do aluno: ${student.anamnesis}...`;

  // 5. Call OpenAI
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  // 6. Parse and return
  const result = await response.json();
  const generatedDiet = JSON.parse(result.choices[0].message.content);
  return new Response(JSON.stringify({ success: true, diet: generatedDiet.dieta }));
});
```

**Deployment**:
```bash
npx supabase functions deploy generate-diet --project-ref xoiyhgquyiqycqjkiebf --no-verify-jwt
```

**Environment Variables** (Set in Supabase Dashboard):
- `OPENAI_API_KEY`: OpenAI API key
- `SUPABASE_URL`: Auto-injected
- `SUPABASE_SERVICE_ROLE_KEY`: Auto-injected

#### 6.1.2 Common Edge Function Issues

**Issue**: 401 Unauthorized
**Cause**: JWT verification enabled but client not sending token
**Solution**: Deploy with `--no-verify-jwt` flag

**Issue**: 500 Internal Server Error
**Cause**: Missing environment variables
**Solution**: Check Supabase Dashboard > Edge Functions > Settings

**Issue**: Timeout (>60s)
**Cause**: OpenAI API slow response
**Solution**: Implement client-side timeout, show loading state

---

## 7. AI Integration Layer

### 7.1 OpenAI API Configuration

#### 7.1.1 Model Selection
- **Model**: `gpt-4o-mini`
- **Why?**: Cost-effective ($0.15/1M input tokens), fast, supports JSON mode
- **Alternatives**: `gpt-4o` (more expensive but higher quality)

#### 7.1.2 Prompt Engineering

**System Prompt** (Nutrition Expert Persona):
```
Você é um Nutricionista Esportivo de ALTO NÍVEL especializado em performance e estética física.

PAPEL:
- Assistir treinadores na criação de planos alimentares (dietas) precisos.
- Fornecer 3 OPÇÕES (variantes) de refeições para cada horário.
- Garantir que as calorias e macros totais sejam respeitados em todas as opções.
- Considerar o protocolo de treino atual do aluno para sugerir refeições pré e pós-treino adequadas.

DADOS ALVO:
- Calorias Alvo: ${target_calories} kcal
- Proteínas: ${macros.p}g
- Carboidratos: ${macros.c}g
- Gorduras: ${macros.f}g
```

**User Prompt** (Student Context):
```
# DADOS DO ALUNO
- Objetivo: ${main_goal}
- Peso: ${weight_kg}kg
- Treino Atual: ${training.title}
- Detalhes do Treino: ${JSON.stringify(training_sessions)}

# SOLICITAÇÃO ADICIONAL:
"${prompt_users || 'Gere uma dieta equilibrada com 3 variações por refeição'}"
```

#### 7.1.3 JSON Schema Enforcement
OpenAI's JSON mode guarantees valid JSON, but schema validation is still needed:
```typescript
// Validate response structure
if (!generatedDiet.dieta || !generatedDiet.dieta.refeicoes) {
  throw new Error('Invalid diet structure');
}

// Validate each meal has 3 options
generatedDiet.dieta.refeicoes.forEach(meal => {
  if (meal.opcoes.length !== 3) {
    throw new Error(`Meal ${meal.nome} must have exactly 3 options`);
  }
});
```

### 7.2 Nutrition Calculation Utilities

#### 7.2.1 TMB Formulas (nutritionCalculations.ts)

**Mifflin-St Jeor Equation** (Most Accurate):
```typescript
export const calculateMifflin = (p: TMBParameters): number => {
  const { weight, height, age, sex } = p;
  const base = (9.99 * weight) + (6.25 * height) - (4.92 * age);
  return sex === 'male' ? base + 5 : base - 161;
};
```

**Tinsley Total Body Weight**:
```typescript
export const calculateTinsleyTotal = (weight: number): number => {
  return 24.8 * weight;
};
```

**Tinsley Lean Body Mass** (Requires Body Fat %):
```typescript
export const calculateTinsleyLBM = (weight: number, bodyFat: number): number => {
  const lbm = weight * (1 - bodyFat / 100);
  return 25.9 * lbm + 284;
};
```

**GET (Total Daily Energy Expenditure)**:
```typescript
const get = tmb * naf; // NAF = 1.2 to 1.9
```

#### 7.2.2 Macro Calculation
```typescript
export const calculateMacros = (calories: number, weight: number, goal: string) => {
  let pRatio = 2.0; // g/kg protein
  let fRatio = 0.8; // g/kg fat

  if (goal === 'emagrecimento') {
    pRatio = 2.2; // Higher protein for satiety
    fRatio = 0.7; // Lower fat
  } else if (goal === 'hipertrofia') {
    pRatio = 2.0;
    fRatio = 1.0; // Higher fat for hormones
  }

  const pCal = weight * pRatio * 4; // 4 kcal/g protein
  const fCal = weight * fRatio * 9; // 9 kcal/g fat
  const cCal = calories - (pCal + fCal);
  const cGrams = cCal / 4; // 4 kcal/g carbs

  return {
    protein: { grams: weight * pRatio, calories: pCal, percentage: (pCal / calories) * 100 },
    fats: { grams: weight * fRatio, calories: fCal, percentage: (fCal / calories) * 100 },
    carbs: { grams: cGrams, calories: cCal, percentage: (cCal / calories) * 100 },
    totalCalories: calories
  };
};
```

#### 7.2.3 NAF (Activity Level) Values
```typescript
const nafDescriptions = {
  "1.2": "Sedentário (pouco ou nenhum exercício)",
  "1.375": "Levemente ativo (exercício leve 1-3 dias/semana)",
  "1.55": "Moderadamente ativo (exercício moderado 3-5 dias/semana)",
  "1.725": "Muito ativo (exercício intenso 6-7 dias/semana)",
  "1.9": "Extremamente ativo (exercício muito intenso, trabalho físico)"
};
```

---

## 8. Authentication & Security

### 8.1 Supabase Auth Flow

#### 8.1.1 Signup Process
```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      full_name: name,
    }
  }
});

// Trigger: Auto-create coach profile
// See migration: 20251230024500_automagic_coach_profile.sql
```

#### 8.1.2 Login Process
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password,
});

// JWT stored in localStorage
// Auto-attached to all Supabase requests
```

#### 8.1.3 Session Management
```typescript
// Check current session
const { data: { session } } = await supabase.auth.getSession();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    navigate('/');
  } else if (event === 'SIGNED_OUT') {
    navigate('/auth');
  }
});
```

### 8.2 Row Level Security (RLS)

#### 8.2.1 RLS Best Practices
- **Always enable RLS**: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- **Test with non-admin user**: Admin bypasses RLS
- **Use `auth.uid()`**: Returns current user's ID from JWT
- **Cascade policies**: Use EXISTS for nested relationships

#### 8.2.2 Common RLS Patterns

**Direct Ownership**:
```sql
CREATE POLICY "Users access own data"
ON table_name FOR ALL
USING (auth.uid() = user_id);
```

**Nested Ownership** (e.g., coach → student → anamnesis):
```sql
CREATE POLICY "Coach accesses student anamnesis"
ON anamnesis FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM students
    WHERE students.id = anamnesis.student_id
    AND students.coach_id = auth.uid()
  )
);
```

**Read-Only Public Data**:
```sql
CREATE POLICY "Public read access"
ON table_name FOR SELECT
USING (true);
```

### 8.3 API Security

#### 8.3.1 Environment Variables
**Never commit**:
- `SUPABASE_ANON_KEY` (client-side, safe to expose)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only, bypasses RLS)
- `OPENAI_API_KEY` (server-side only)

**Storage**:
- Local: `.env` file (gitignored)
- Production: Supabase Dashboard > Edge Functions > Settings

#### 8.3.2 CORS Configuration
Edge functions must include CORS headers:
```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Preflight response
if (req.method === "OPTIONS") {
  return new Response("ok", { headers: corsHeaders });
}

// Actual response
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, "Content-Type": "application/json" }
});
```

---

## 9. Critical Business Logic

### 9.1 Diet Generation Workflow

#### 9.1.1 Prerequisites
1. Student must exist with anamnesis (weight, height, age, sex, goal)
2. Student should have active training program (optional but recommended)
3. Coach must be authenticated

#### 9.1.2 Calculation Steps
```typescript
// 1. Calculate TMB (Basal Metabolic Rate)
const tmb = calculateMifflin({ weight, height, age, sex });

// 2. Apply activity level (NAF)
const get = tmb * naf; // GET = Total Daily Energy Expenditure

// 3. Apply caloric adjustment (deficit/surplus)
const targetKcal = get + calorieAdjustment;

// 4. Calculate macros based on goal
const macros = calculateMacros(targetKcal, weight, goal);

// 5. Send to AI for meal planning
const diet = await generateDiet({ targetKcal, macros, student, training });
```

#### 9.1.3 Validation Rules
- `targetKcal` must be > 0
- `weight` must be > 0
- `macros.p + macros.c + macros.f` should approximately equal `targetKcal / 4` (accounting for 9 kcal/g fat)

### 9.2 Training Program Creation

#### 9.2.1 AI-Generated Training (Future)
Currently manual, but planned AI integration similar to diet generation.

#### 9.2.2 Manual Creation Flow
1. Select student
2. Define program parameters (weeks, sessions/week)
3. Create sessions (A, B, C splits)
4. Add exercises to each session
5. Save to database (multi-table insert)

### 9.3 Protocol Editing

#### 9.3.1 Edit Training Protocol
```typescript
// 1. Load existing program
const program = await getTrainingProgram(id);

// 2. Convert to editable state
setEditedSessions(program.training_sessions.map(s => ({
  id: s.id,
  exercises: s.training_exercises.map(e => ({ ...e }))
})));

// 3. User modifies exercises (add/remove/edit)

// 4. Save changes
for (const session of editedSessions) {
  // Delete old exercises
  await supabase.from('training_exercises').delete().eq('training_session_id', session.id);
  
  // Insert new exercises
  const exercisesToInsert = session.exercises.map((ex, idx) => ({
    training_session_id: session.id,
    name: ex.name,
    sets: ex.sets,
    reps_min: ex.reps_min,
    reps_max: ex.reps_max,
    rest_time: ex.rest_time,
    notes: ex.notes,
    execution_order: idx + 1
  }));
  
  await supabase.from('training_exercises').insert(exercisesToInsert);
}
```

#### 9.3.2 Edit Diet Protocol
Similar pattern to training, but with meals and foods:
```typescript
// Delete old foods
await supabase.from('meal_foods').delete().eq('meal_id', meal.id);

// Insert new foods
const foodsToInsert = meal.foods.map((f, idx) => ({
  meal_id: meal.id,
  name: f.name,
  quantity: parseFloat(f.quantity) || 0,
  unit: f.unit,
  order_index: idx + 1
}));

await supabase.from('meal_foods').insert(foodsToInsert);
```

---

## 10. Known Issues & Technical Debt

### 10.1 Critical Issues
1. **No Transaction Support**: Multi-table inserts can fail partially, leaving orphaned records
2. **Missing Error Boundaries**: React errors crash entire app
3. **No Optimistic Updates**: UI waits for server response before updating
4. **Hardcoded Strings**: No i18n support, all text in Portuguese

### 10.2 Technical Debt
1. **No Unit Tests**: Zero test coverage
2. **No E2E Tests**: Manual testing only
3. **No TypeScript Strict Mode**: Some `any` types remain
4. **No Code Splitting**: All routes loaded upfront
5. **No Image Optimization**: Large avatar uploads not compressed

### 10.3 Security Concerns
1. **No Rate Limiting**: AI endpoint can be spammed
2. **No Input Sanitization**: XSS risk in user-generated content
3. **No CSRF Protection**: Supabase handles this, but custom endpoints need it

---

## 11. Future Roadmap

### 11.1 High Priority
- [ ] Implement transaction support for multi-table operations
- [ ] Add React Error Boundaries
- [ ] Implement optimistic UI updates
- [ ] Add unit tests for critical business logic
- [ ] Implement rate limiting on Edge Functions

### 11.2 Medium Priority
- [ ] Add i18n support (English, Spanish)
- [ ] Implement code splitting and lazy loading
- [ ] Add image compression for uploads
- [ ] Create AI training plan generator
- [ ] Add Supabase Realtime for collaborative editing

### 11.3 Low Priority
- [ ] Dark mode toggle (currently always dark)
- [ ] Export protocols to PDF
- [ ] Email notifications
- [ ] Mobile app (React Native)

---

## 12. Deployment

### 12.1 Frontend Deployment (Vercel)
```bash
# Build
npm run build

# Deploy
vercel --prod
```

### 12.2 Edge Function Deployment
```bash
# Deploy single function
npx supabase functions deploy generate-diet --project-ref xoiyhgquyiqycqjkiebf --no-verify-jwt

# Deploy all functions
npx supabase functions deploy --project-ref xoiyhgquyiqycqjkiebf
```

### 12.3 Database Migrations
```bash
# Apply migrations
npx supabase db push --project-ref xoiyhgquyiqycqjkiebf

# Reset database (DANGER: deletes all data)
npx supabase db reset --project-ref xoiyhgquyiqycqjkiebf
```

---

**End of Documentation**

*This document should be updated with every major architectural change.*
