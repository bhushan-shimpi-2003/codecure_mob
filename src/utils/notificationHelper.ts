/**
 * notificationHelper.ts
 *
 * Silent fire-and-forget notification dispatcher.
 *
 * PURPOSE
 * -------
 * The backend's /api/notifications/send endpoint currently requires an admin
 * JWT. Non-admin roles (teacher, student) receive a 403 Forbidden response.
 *
 * This helper wraps every call in a silent try/catch so that:
 *   1. Primary actions (publish lesson, submit doubt, etc.) NEVER get blocked.
 *   2. When the backend admin enables teacher/student notification sending,
 *      everything starts working instantly — zero code changes required.
 *   3. All event triggers are centralized here for easy auditing.
 *
 * ENABLING TEACHER/STUDENT BROADCASTS ON THE BACKEND
 * ---------------------------------------------------
 * In your Supabase backend, update the RLS policy or Express middleware for
 * POST /api/notifications/send to also allow 'teacher' and 'student' roles.
 */

import { notificationsApi } from "../api/endpoints";

export interface AutoNotificationPayload {
  user_id?: string;
  role?: string;
  title: string;
  message: string;
  type?: string;
}

/**
 * Send a notification silently — never throws, never blocks the caller.
 */
export async function sendAutoNotification(
  payload: AutoNotificationPayload
): Promise<void> {
  try {
    // validateStatus: treat any HTTP status (including 403) as a resolved promise.
    // This prevents Axios from throwing on 4xx, which would otherwise print
    // a red XHR error in the browser DevTools console even though we catch it.
    await notificationsApi.send(payload);
  } catch (_) {
    // Silently swallow network/5xx errors. 403 is handled by validateStatus above.
    // Uncomment to debug: console.log('[AutoNotif] skipped:', payload.title);
  }
}

// ─── Pre-composed Notification Factories ─────────────────────────────────────
// Each function returns the full payload for a specific event type.

/** Student: A new lesson was published in their course */
export const notifyStudentNewLesson = (lessonTitle: string, courseTitle: string) =>
  sendAutoNotification({
    role: "student",
    title: "📚 New Lesson Available!",
    message: `"${lessonTitle}" has just been published in ${courseTitle}. Start learning now!`,
    type: "course",
  });

/** Student: A new module was added to their course */
export const notifyStudentNewModule = (moduleName: string, courseTitle: string) =>
  sendAutoNotification({
    role: "student",
    title: "📂 Course Updated!",
    message: `A new module "${moduleName}" has been added to ${courseTitle}. Explore the expanded curriculum!`,
    type: "course",
  });

/** Student: A new assignment has been posted */
export const notifyStudentNewAssignment = (
  assignmentTitle: string,
  dueDate?: string
) =>
  sendAutoNotification({
    role: "student",
    title: "📝 New Assignment Posted!",
    message: `"${assignmentTitle}" is now live.${dueDate ? ` Due: ${dueDate}.` : ""} Submit before the deadline!`,
    type: "assignment",
  });

/** Specific student: Their assignment was graded */
export const notifyStudentGraded = (
  studentId: string,
  assignmentTitle: string,
  score: number
) =>
  sendAutoNotification({
    user_id: studentId,
    title: "⭐ Your Assignment Was Graded!",
    message: `Your submission for "${assignmentTitle}" has been reviewed. Score: ${score}/100. Check your feedback now!`,
    type: "system",
  });

/** Specific student: Their doubt was resolved by a teacher */
export const notifyStudentDoubtResolved = (studentId: string, snippet: string) =>
  sendAutoNotification({
    user_id: studentId,
    title: "✅ Doubt Resolved!",
    message: `Your instructor replied to your query: "${snippet.substring(0, 80)}..."`,
    type: "message",
  });

/** Specific student: An interview was scheduled for them */
export const notifyStudentInterviewScheduled = (
  studentId: string,
  courseTitle: string,
  scheduledAt: string
) =>
  sendAutoNotification({
    user_id: studentId,
    title: "🎯 Interview Scheduled!",
    message: `Your technical interview for "${courseTitle}" is booked for ${new Date(scheduledAt).toLocaleString()}. Be prepared!`,
    type: "general",
  });

/** Specific student: Their interview was completed and evaluated */
export const notifyStudentInterviewCompleted = (studentId: string) =>
  sendAutoNotification({
    user_id: studentId,
    title: "🏁 Interview Evaluated!",
    message: "Your recent technical interview has been reviewed and scored. Log in to check your readiness report.",
    type: "system",
  });

/** Student: A new job opportunity was posted */
export const notifyStudentNewJob = (jobTitle: string, company: string) =>
  sendAutoNotification({
    role: "student",
    title: "💼 New Career Opportunity!",
    message: `${company} is hiring for "${jobTitle}". Check the Careers section and apply before it closes!`,
    type: "general",
  });

/** Specific student: Their enrollment request was approved */
export const notifyStudentEnrollmentApproved = (
  studentId: string,
  courseTitle: string
) =>
  sendAutoNotification({
    user_id: studentId,
    title: "🎉 Enrollment Approved!",
    message: `Your request to join "${courseTitle}" has been approved. Start your learning journey now!`,
    type: "system",
  });

/** Specific student: Their enrollment request was rejected */
export const notifyStudentEnrollmentRejected = (
  studentId: string,
  courseTitle: string
) =>
  sendAutoNotification({
    user_id: studentId,
    title: "📋 Enrollment Update",
    message: `Your enrollment request for "${courseTitle}" was not approved at this time. Contact support for assistance.`,
    type: "system",
  });

/** Teacher: A student submitted a new doubt */
export const notifyTeacherNewDoubt = (
  studentName: string,
  preview: string
) =>
  sendAutoNotification({
    role: "teacher",
    title: "❓ Student Doubt Submitted",
    message: `${studentName} raised a question: "${preview.substring(0, 80)}..." — Check the Doubts section to respond.`,
    type: "message",
  });

/** Teacher: A student submitted an assignment */
export const notifyTeacherNewSubmission = (
  studentName: string,
  assignmentTitle: string
) =>
  sendAutoNotification({
    role: "teacher",
    title: "📬 New Assignment Submission",
    message: `${studentName} submitted their work for "${assignmentTitle}". Review it in the Assignments section.`,
    type: "assignment",
  });

/** Specific teacher: They were assigned to teach a course */
export const notifyTeacherCourseAssigned = (
  teacherId: string,
  courseTitle: string
) =>
  sendAutoNotification({
    user_id: teacherId,
    title: "📘 New Course Assignment",
    message: `You have been assigned to teach "${courseTitle}". Log in to start setting up your curriculum.`,
    type: "general",
  });

/** All teachers: Platform-wide admin broadcast */
export const notifyAllTeachers = (title: string, message: string) =>
  sendAutoNotification({ role: "teacher", title, message, type: "system" });

/** All students: Platform-wide admin broadcast */
export const notifyAllStudents = (title: string, message: string) =>
  sendAutoNotification({ role: "student", title, message, type: "system" });
