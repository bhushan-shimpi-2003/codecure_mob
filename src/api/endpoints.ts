import client from "./client";

// ─── 1. AUTHENTICATION & PROFILE ──────────────────────────────────────────────
export const authApi = {
  signup: (data: any) => client.post("/auth/signup", data),
  login: (email: string, password: string) =>
    client.post("/auth/login", { email, password }),
  me: () => client.get("/auth/me"),
  updateProfile: (data: any) => client.put("/auth/me", data),
  deleteProfile: () => client.delete("/auth/me"),
  logout: () => client.post("/auth/logout"),
};

// ─── 2. COURSES & MODULES ─────────────────────────────────────────────────────
// Exact backend routes from courseRoutes.js
export const coursesApi = {
  list: () => client.get("/courses"),                                         // GET /courses (public)
  detail: (slug: string) => client.get(`/courses/${slug}`),                  // GET /courses/:slug
  teacherCourses: () => client.get("/courses/teacher/my"),                   // GET /courses/teacher/my (teacher/admin)
  adminAll: () => client.get("/courses/admin/all"),                          // GET /courses/admin/all (admin)
  create: (data: any) => client.post("/courses", data),                      // POST /courses
  update: (id: string, data: any) => client.put(`/courses/${id}`, data),     // PUT /courses/:id
  delete: (id: string) => client.delete(`/courses/${id}`),                   // DELETE /courses/:id
  addModule: (courseId: string, data: any) =>
    client.post(`/courses/${courseId}/modules`, data),                       // POST /courses/:courseId/modules
  updateModule: (moduleId: string, data: any) =>
    client.put(`/courses/modules/${moduleId}`, data),                        // PUT /courses/modules/:id
  deleteModule: (moduleId: string) =>
    client.delete(`/courses/modules/${moduleId}`),                           // DELETE /courses/modules/:id
};

// ─── 3. ENROLLMENTS ───────────────────────────────────────────────────────────
// Exact backend routes from enrollmentRoutes.js
export const enrollmentsApi = {
  request: (courseId: string) =>
    client.post("/enrollments/request", { course_id: courseId }),            // POST /enrollments/request
  myRequests: () => client.get("/enrollments/requests/me"),                  // GET /enrollments/requests/me (student)
  myEnrollments: () => client.get("/enrollments/me"),                        // GET /enrollments/me (student) ← was /my (wrong!)
  pendingRequests: () => client.get("/enrollments/requests/pending"),        // GET /enrollments/requests/pending (admin)
  updateRequest: (id: string, status: string) =>
    client.put(`/enrollments/requests/${id}`, { status }),                   // PUT /enrollments/requests/:id (admin)
  deleteRequest: (id: string) => client.delete(`/enrollments/requests/${id}`), // DELETE /enrollments/requests/:id
  all: () => client.get("/enrollments"),                                     // GET /enrollments (admin/teacher)
  update: (id: string, data: any) => client.put(`/enrollments/${id}`, data),// PUT /enrollments/:id
  delete: (id: string) => client.delete(`/enrollments/${id}`),              // DELETE /enrollments/:id
};

// ─── 4. LESSONS ───────────────────────────────────────────────────────────────
// Exact backend routes from lessonRoutes.js
export const lessonsApi = {
  byCourse: (courseId: string) => client.get(`/lessons/course/${courseId}`), // GET /lessons/course/:courseId
  latestByCourse: (courseId: string) => client.get(`/lessons/course/${courseId}/latest`), // GET /lessons/course/:courseId/latest
  create: (data: any) => client.post("/lessons", data),                      // POST /lessons
  update: (id: string, data: any) => client.put(`/lessons/${id}`, data),    // PUT /lessons/:id
  delete: (id: string) => client.delete(`/lessons/${id}`),                  // DELETE /lessons/:id
};

// ─── 5. ASSIGNMENTS ───────────────────────────────────────────────────────────
// Exact backend routes from assignmentRoutes.js
export const assignmentsApi = {
  myAssignments: () => client.get("/assignments/my-assignments"),            // GET /assignments/my-assignments ← was /my (wrong!)
  mySubmissions: () => client.get("/assignments/submissions/me"),            // GET /assignments/submissions/me
  byCourse: (courseId: string) => client.get(`/assignments/course/${courseId}`), // GET /assignments/course/:courseId
  submissionsByAssignment: (id: string) => client.get(`/assignments/${id}/submissions`), // GET /assignments/:id/submissions
  create: (data: any) => client.post("/assignments", data),                  // POST /assignments
  update: (id: string, data: any) => client.put(`/assignments/${id}`, data),// PUT /assignments/:id
  delete: (id: string) => client.delete(`/assignments/${id}`),              // DELETE /assignments/:id
  submit: (id: string, submissionUrl: string) =>
    client.post(`/assignments/${id}/submit`, { submission_url: submissionUrl }), // POST /assignments/:id/submit
  updateSubmission: (id: string, data: any) =>
    client.put(`/assignments/submissions/${id}`, data),                      // PUT /assignments/submissions/:id
  deleteSubmission: (id: string) =>
    client.delete(`/assignments/submissions/${id}`),                         // DELETE /assignments/submissions/:id
  gradeSubmission: (id: string, data: { score: number; feedback: string }) =>
    client.put(`/assignments/submissions/${id}/grade`, data),                // PUT /assignments/submissions/:id/grade
};

// ─── 6. DOUBTS ────────────────────────────────────────────────────────────────
// Exact backend routes from doubtRoutes.js
export const doubtsApi = {
  myDoubts: () => client.get("/doubts/me"),                                  // GET /doubts/me ← was /my (wrong!)
  teacherDoubts: () => client.get("/doubts/teacher"),                        // GET /doubts/teacher
  all: () => client.get("/doubts"),                                          // GET /doubts (admin)
  create: (data: any) => client.post("/doubts", data),                       // POST /doubts
  update: (id: string, data: any) => client.put(`/doubts/${id}`, data),     // PUT /doubts/:id
  delete: (id: string) => client.delete(`/doubts/${id}`),                   // DELETE /doubts/:id
  resolve: (id: string, reply: string) =>
    client.put(`/doubts/${id}/resolve`, { reply }),                          // PUT /doubts/:id/resolve
};

// ─── 7. MOCK INTERVIEWS ───────────────────────────────────────────────────────
// Exact backend routes from interviewRoutes.js
export const interviewsApi = {
  myInterviews: () => client.get("/interviews/me"),                          // GET /interviews/me
  teacherInterviews: () => client.get("/interviews/teacher"),                // GET /interviews/teacher
  all: () => client.get("/interviews"),                                      // GET /interviews (admin)
  schedule: (data: any) => client.post("/interviews", data),                 // POST /interviews
  update: (id: string, data: any) => client.put(`/interviews/${id}`, data), // PUT /interviews/:id
  delete: (id: string) => client.delete(`/interviews/${id}`),               // DELETE /interviews/:id
  complete: (id: string, data: { score: number; notes: string }) =>
    client.put(`/interviews/${id}/complete`, data),                          // PUT /interviews/:id/complete
};

// ─── 8. ADMIN MANAGEMENT ──────────────────────────────────────────────────────
// Exact backend routes from adminRoutes.js (all require admin role)
export const adminApi = {
  getStudents: () => client.get("/admin/students"),                          // GET /admin/students
  getStaff: () => client.get("/admin/staff"),                                // GET /admin/staff
  registerStaff: (data: any) => client.post("/admin/staff", data),          // POST /admin/staff
  updateRole: (id: string, role: string) =>
    client.put(`/admin/users/${id}/role`, { role }),                         // PUT /admin/users/:id/role
  deleteUser: (id: string) => client.delete(`/admin/users/${id}`),          // DELETE /admin/users/:id
  getTransactions: () => client.get("/admin/transactions"),                  // GET /admin/transactions
  createTransaction: (data: any) => client.post("/admin/transactions", data),// POST /admin/transactions
  updateTransaction: (id: string, data: any) =>
    client.put(`/admin/transactions/${id}`, data),                           // PUT /admin/transactions/:id
  deleteTransaction: (id: string) =>
    client.delete(`/admin/transactions/${id}`),                              // DELETE /admin/transactions/:id
  getFeedback: () => client.get("/admin/feedback"),                          // GET /admin/feedback
  resolveComplaint: (id: string) =>
    client.put(`/admin/feedback/${id}/resolve`, {}),                         // PUT /admin/feedback/:id/resolve
  getSettings: () => client.get("/admin/settings"),                          // GET /admin/settings
  updateSetting: (key: string, value: string) =>
    client.put(`/admin/settings/${key}`, { value }),                         // PUT /admin/settings/:key
};

// ─── 9. PUBLIC / JOBS ────────────────────────────────────────────────────────
export const jobsApi = {
  list: () => client.get("/jobs"),                                          // GET /jobs
  create: (data: any) => client.post("/jobs", data),                        // POST /jobs
  update: (id: string, data: any) => client.put(`/jobs/${id}`, data),      // PUT /jobs/:id
  delete: (id: string) => client.delete(`/jobs/${id}`),                    // DELETE /jobs/:id
};

// ─── 10. TEACHER SPECIFIC DASHBOARD ──────────────────────────────────────────
export const teacherApi = {
  stats: () => client.get("teacher/dashboard/stats"),                      // GET /api/teacher/dashboard/stats
  activity: () => client.get("teacher/dashboard/activity"),                // GET /api/teacher/dashboard/activity
  courseStudents: (courseId: string) => client.get(`teacher/course/${courseId}/students`), // GET /api/teacher/course/:courseId/students
};
