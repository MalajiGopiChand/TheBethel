# Instructions for Converting Remaining Files

All TypeScript files need to be converted to JavaScript. Here's what needs to be done:

## Files Already Converted:
- ✅ `src/config/firebase.ts` → `firebase.js`
- ✅ `src/types/index.ts` → `index.js`
- ✅ `src/utils/theme.ts` → `theme.js`
- ✅ `vite.config.ts` → `vite.config.js`
- ✅ `src/main.tsx` → `main.jsx`
- ✅ `src/App.tsx` → `App.jsx`
- ✅ `src/contexts/AuthContext.tsx` → `AuthContext.jsx`
- ✅ `src/components/ActionGrid.tsx` → `ActionGrid.jsx`
- ✅ `src/components/AttendanceCard.tsx` → `AttendanceCard.jsx`
- ✅ `src/components/PodiumSection.tsx` → `PodiumSection.jsx`
- ✅ `src/components/AnnouncementsSection.tsx` → `AnnouncementsSection.jsx`

## Files Still Need Conversion:

### Auth Pages:
- `src/pages/auth/RoleSelection.tsx` → `RoleSelection.jsx`
- `src/pages/auth/TeacherLogin.tsx` → `TeacherLogin.jsx`
- `src/pages/auth/TeacherSignUp.tsx` → `TeacherSignUp.jsx`
- `src/pages/auth/ParentLogin.tsx` → `ParentLogin.jsx`
- `src/pages/auth/ParentSignUp.tsx` → `ParentSignUp.jsx`

### Teacher Pages:
- `src/pages/teacher/TeacherDashboard.tsx` → `TeacherDashboard.jsx`
- `src/pages/teacher/components/HomeTab.tsx` → `HomeTab.jsx`
- `src/pages/teacher/components/AttendanceTab.tsx` → `AttendanceTab.jsx`
- `src/pages/teacher/components/RewardsTab.tsx` → `RewardsTab.jsx`
- `src/pages/teacher/components/StudentsTab.tsx` → `StudentsTab.jsx`
- `src/pages/teacher/components/TeachersTab.tsx` → `TeachersTab.jsx`
- `src/pages/teacher/pages/HomeworkPage.tsx` → `HomeworkPage.jsx`
- `src/pages/teacher/pages/MessagingPage.tsx` → `MessagingPage.jsx`

### Parent Pages:
- `src/pages/parent/ParentDashboard.tsx` → `ParentDashboard.jsx`
- `src/pages/parent/components/HomeTab.tsx` → `HomeTab.jsx`
- `src/pages/parent/components/HomeworkTab.tsx` → `HomeworkTab.jsx`
- `src/pages/parent/components/LeaderboardTab.tsx` → `LeaderboardTab.jsx`
- `src/pages/parent/components/ProfileTab.tsx` → `ProfileTab.jsx`

## Conversion Rules:

1. **Remove TypeScript annotations:**
   - Remove `interface` definitions
   - Remove `: Type` type annotations
   - Remove `React.FC<Props>` and use just function declarations
   - Remove `as Type` type assertions

2. **Update imports:**
   - Remove `.ts` and `.tsx` extensions (or change to `.js`/`.jsx`)
   - Change `import { UserRole } from '../types'` to `import { UserRole } from '../types'` (types.js now exports UserRole)

3. **Update function signatures:**
   - `const Component: React.FC<Props> = ({ prop }) => {}` → `const Component = ({ prop }) => {}`
   - `function func(param: Type): ReturnType {}` → `function func(param) {}`

4. **Remove type assertions:**
   - `data as Type` → `data`
   - `user as User` → `user`

5. **Update error handling:**
   - `catch (err: any)` → `catch (err)`

6. **Remove optional chaining types:**
   - Keep optional chaining (`?.`) but remove type annotations

After conversion, delete all `.ts` and `.tsx` files.

