# Learnix Backend - AI Assistant & Claude Code Rules

This file sets strictly binding conventions, architecture rules, and coding standards for the **Learnix Backend** project (Node.js/Express + TypeScript + Prisma).
ALL AI assistants (Claude Code, Gemini, Cursor) MUST strictly follow these rules when writing, refactoring, or reviewing backend code.

---

## 1. Technology Stack

- **Runtime & Framework**: Node.js, Express.js (v4+)
- **Language**: Strict TypeScript (`noImplicitAny: true`, exact types for DTOs, interfaces, and function return values). Use `tsx` for development watch mode.
- **ORM & Database**: Prisma ORM (`@prisma/client`), PostgreSQL (Neon.tech / Supabase).
- **Validation**: Zod (`zod`) for strict request body, params, and query validation.
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), Bcrypt (`bcryptjs`) for password hashing.
- **Realtime**: Socket.io (`socket.io`) wrapped around the native Node.js HTTP server.

---

## 2. Directory Structure & File Roles

Never dump everything into single files. Strictly adhere to this workspace structure:

```text
LEARNIX-BACKEND/
├── prisma/
│   └── schema.prisma         # Prisma DB Models (Minimalist 1-word naming)
├── src/
│   ├── config/               # Env config, DB connection, CORS, Socket initialization
│   ├── controllers/          # Express Controllers (Handle req/res, call Services)
│   ├── services/             # Business Logic Layer (Heavy computation, grading, AI)
│   ├── routes/               # Express Routes (Map URLs to Middlewares & Controllers)
│   ├── middlewares/          # Auth JWT check, Role RBAC, Zod validation, Error handler
│   ├── models/               # Prisma wrappers or custom repository queries
│   ├── sockets/              # Socket.io event handlers (Exam countdown, Anti-cheat room)
│   ├── validations/          # Zod schemas for incoming requests
│   ├── utils/                # Helper utilities (Bcrypt, JWT generators, formatters)
│   ├── types/                # Shared TypeScript interfaces & Express Request overrides
│   ├── app.ts                # Express App setup (CORS, JSON body, attach routes/middlewares)
│   └── server.ts             # Entry point (Import app, init DB, wrap Socket.io, listen PORT)
```

**CRITICAL RULE FOR `app.ts` vs `server.ts`:**
- `app.ts`: ONLY configures Express, CORS, and mounts routes. **NEVER call `app.listen()` here.**
- `server.ts`: Imports `app`, connects to Prisma DB, creates HTTP server, attaches Socket.io, and calls `listen(PORT)`.

---

## 3. Coding Guidelines & Constraints

### 3.1. Layered Architecture Enforcement
- **Controllers**: Keep them thin. Use `try/catch` (or an `asyncHandler` wrapper) to pass errors to the global error middleware.
  ```typescript
  // YES (Standard Controller Method):
  export const submitExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ExamService.gradeSubmission(req.user.id, req.body);
      res.status(200).json({ status: "SUCCESS", message: "Nộp bài thành công!", data: result });
    } catch (error) {
      next(error);
    }
  };
  ```
- **Services**: All business logic goes here (e.g., matching answers against DB `solution`, calculating score, calling Gemini AI).
- **Middlewares**: Use `validateRequest(zodSchema)` middleware on routes before they hit controllers.

### 3.2. Database & Prisma Rules (Minimalist 1-Word)
- Always follow the Minimalist 1-word naming convention established in `schema.prisma`.
- When fetching exam questions for a student, **ALWAYS exclude the `solution` field** to prevent cheating:
  ```typescript
  // YES:
  const questions = await prisma.question.findMany({
    where: { examId, active: true },
    select: { id: true, content: true, type: true, options: true, points: true } // NO solution!
  });
  ```
- Use Soft Delete: Never execute `prisma.model.delete()`. Use `prisma.model.update({ where: { id }, data: { deleted: new Date() } })`.

### 3.3. Realtime Socket.io Rules
- Keep Socket.io logic modular inside `src/sockets/`.
- Handle the `CHEAT_WARNING` event: When received from a student's socket, increment `cheats` in the DB and emit an alert to the Teacher's room.

### 3.4. Security & Authentication
- Always extend Express `Request` interface to include `user?: { id: string; role: Role }`.
- Never store plain text passwords. Use `bcrypt.hash()` with salt rounds >= 10.
- All protected API routes must be guarded by `authenticateJWT` middleware.