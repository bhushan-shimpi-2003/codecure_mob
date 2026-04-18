#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const fullMode = args.includes("--full");

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadDotEnv() {
  try {
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    const envPath = path.resolve(scriptDir, "..", ".env");

    if (!fs.existsSync(envPath)) {
      return { loadedCount: 0, envPath };
    }

    const content = fs.readFileSync(envPath, "utf8");
    const lines = content.split(/\r?\n/);
    let loadedCount = 0;

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const line = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
      const equalsIndex = line.indexOf("=");
      if (equalsIndex <= 0) continue;

      const key = line.slice(0, equalsIndex).trim();
      if (!key) continue;

      let value = line.slice(equalsIndex + 1).trim();
      value = value.replace(/;+\s*$/, "").trim();
      value = stripWrappingQuotes(value);

      if (process.env[key] === undefined) {
        process.env[key] = value;
        loadedCount += 1;
      }
    }

    return { loadedCount, envPath };
  } catch (error) {
    return { loadedCount: 0, envPath: null, error: String(error) };
  }
}

const envLoadInfo = loadDotEnv();

const apiBaseInput = process.env.API_BASE_URL || "https://codecure-acedamy.onrender.com";
const API_BASE = apiBaseInput.endsWith("/api") ? apiBaseInput : `${apiBaseInput}/api`;

const DUMMY_ID = process.env.DUMMY_ID || "00000000-0000-0000-0000-000000000000";
const DUMMY_SLUG = process.env.DUMMY_SLUG || "non-existent-course-slug";
const TEST_COURSE_SLUG = process.env.TEST_COURSE_SLUG;
const TEST_LESSON_ID = process.env.TEST_LESSON_ID;

const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
const TEST_TOKEN = process.env.TEST_TOKEN;

const summary = {
  pass: 0,
  fail: 0,
  skip: 0,
};

const results = [];

const color = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

function formatUrl(path) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

function isLikelyRouteMissing(method, path, payload, text) {
  const joined = `${text || ""} ${JSON.stringify(payload || {})}`;
  const methodUpper = method.toUpperCase();
  const cannotToken = `Cannot ${methodUpper}`;
  return joined.includes(cannotToken) && joined.includes(path);
}

async function requestEndpoint(endpoint, token) {
  const controller = new AbortController();
  const timeoutMs = 20000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const url = formatUrl(endpoint.path);
  const headers = {};

  if (endpoint.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  let responsePayload = null;
  let responseText = "";

  try {
    response = await fetch(url, {
      method: endpoint.method,
      headers,
      body: endpoint.body !== undefined ? JSON.stringify(endpoint.body) : undefined,
      signal: controller.signal,
    });

    responseText = await response.text();
    try {
      responsePayload = responseText ? JSON.parse(responseText) : null;
    } catch {
      responsePayload = null;
    }
  } catch (error) {
    clearTimeout(timeout);
    return {
      ok: false,
      status: null,
      error: error?.name === "AbortError" ? `Timed out after ${timeoutMs}ms` : String(error),
      payload: null,
      text: "",
      routeMissing: false,
    };
  }

  clearTimeout(timeout);

  const routeMissing =
    response.status === 404 &&
    isLikelyRouteMissing(endpoint.method, endpoint.path, responsePayload, responseText);

  const ok = endpoint.accept.includes(response.status) && !routeMissing;

  return {
    ok,
    status: response.status,
    payload: responsePayload,
    text: responseText,
    routeMissing,
  };
}

function addResult(type, label, detail) {
  results.push({ type, label, detail });
  summary[type] += 1;
}

function printResult(result) {
  const statusColor =
    result.type === "pass" ? color.green : result.type === "skip" ? color.yellow : color.red;
  const tag = result.type.toUpperCase().padEnd(4, " ");
  console.log(`${statusColor(tag)} ${result.label} ${result.detail ? `- ${result.detail}` : ""}`);
}

function getTokenFromLoginPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const root = payload.data ?? payload;

  return (
    root?.session?.access_token ||
    root?.access_token ||
    root?.token ||
    null
  );
}

function getUserRoleFromMePayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const root = payload.data ?? payload;
  return root?.user?.role || root?.role || null;
}

function extractData(payload) {
  if (!payload || typeof payload !== "object") return payload;
  return payload.data ?? payload;
}

function getEntityId(value) {
  if (!value || typeof value !== "object") return null;
  return value.id || value._id || null;
}

function getCourseSlug(value) {
  if (!value || typeof value !== "object") return null;
  return value.slug || value.course_slug || null;
}

function getFirstCourseFromPayload(payload) {
  const data = extractData(payload);

  if (Array.isArray(data) && data.length > 0) return data[0];
  if (Array.isArray(data?.courses) && data.courses.length > 0) return data.courses[0];
  if (Array.isArray(data?.items) && data.items.length > 0) return data.items[0];

  return null;
}

function getFirstEntityFromPayload(payload, preferredKeys = []) {
  const entities = getEntityArrayFromPayload(payload, preferredKeys);
  return entities.length > 0 ? entities[0] : null;
}

function getEntityArrayFromPayload(payload, preferredKeys = []) {
  const data = extractData(payload);

  if (Array.isArray(data)) return data;

  if (data && typeof data === "object") {
    for (const key of preferredKeys) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        return data[key];
      }
    }

    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.length > 0) {
        return value;
      }
    }
  }

  return [];
}

function findFirstLessonId(value, seen = new Set()) {
  if (!value || typeof value !== "object") return null;
  if (seen.has(value)) return null;
  seen.add(value);

  if (typeof value.lesson_id === "string" || typeof value.lesson_id === "number") {
    return String(value.lesson_id);
  }
  if (typeof value.lessonId === "string" || typeof value.lessonId === "number") {
    return String(value.lessonId);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const id = findFirstLessonId(item, seen);
      if (id) return id;
    }
    return null;
  }

  for (const [key, child] of Object.entries(value)) {
    const lowered = key.toLowerCase();
    if (lowered.includes("lesson")) {
      if (Array.isArray(child)) {
        for (const lesson of child) {
          const lessonId = getEntityId(lesson);
          if (lessonId) return lessonId;

          const nested = findFirstLessonId(lesson, seen);
          if (nested) return nested;
        }
      } else if (typeof child === "string" || typeof child === "number") {
        return String(child);
      } else {
        const lessonId = getEntityId(child);
        if (lessonId) return lessonId;

        const nested = findFirstLessonId(child, seen);
        if (nested) return nested;
      }
    }
  }

  for (const child of Object.values(value)) {
    const nested = findFirstLessonId(child, seen);
    if (nested) return nested;
  }

  return null;
}

async function discoverCourseAndLessonIds() {
  const discovered = {
    courseSlug: TEST_COURSE_SLUG || null,
    lessonId: TEST_LESSON_ID || null,
    courseId: null,
    courseIds: [],
    notes: [],
  };

  if (discovered.courseSlug && discovered.lessonId) {
    return discovered;
  }

  const coursesRes = await requestEndpoint(
    {
      label: "Course discovery",
      method: "GET",
      path: "/courses",
      accept: [200],
    },
    null
  );

  if (coursesRes.status !== 200) {
    discovered.notes.push("Could not discover course from /courses");
    return discovered;
  }

  const firstCourse = getFirstCourseFromPayload(coursesRes.payload);
  const courseEntities = getEntityArrayFromPayload(coursesRes.payload, ["courses", "items"]);
  discovered.courseIds = courseEntities.map((course) => getEntityId(course)).filter(Boolean);

  if (!firstCourse) {
    discovered.notes.push("No course found in /courses response");
    return discovered;
  }

  discovered.courseId = getEntityId(firstCourse);

  if (!discovered.courseSlug) {
    discovered.courseSlug = getCourseSlug(firstCourse);
    if (discovered.courseSlug) {
      discovered.notes.push(`Auto-discovered TEST_COURSE_SLUG=${discovered.courseSlug}`);
    }
  }

  if (!discovered.courseSlug) {
    const fallbackCourseId = getEntityId(firstCourse);
    if (fallbackCourseId) {
      discovered.courseSlug = fallbackCourseId;
      discovered.notes.push(`Auto-discovered course identifier from id=${fallbackCourseId}`);
    }
  }

  if (discovered.lessonId) {
    return discovered;
  }

  if (!discovered.courseSlug) {
    discovered.notes.push("Course slug was not found in /courses response");
    return discovered;
  }

  const courseDetailRes = await requestEndpoint(
    {
      label: "Lesson discovery",
      method: "GET",
      path: `/courses/${discovered.courseSlug}`,
      accept: [200],
    },
    null
  );

  if (courseDetailRes.status !== 200) {
    discovered.notes.push("Could not discover lesson from course detail");
    return discovered;
  }

  const lessonId = findFirstLessonId(extractData(courseDetailRes.payload));
  if (lessonId) {
    discovered.lessonId = lessonId;
    discovered.notes.push(`Auto-discovered TEST_LESSON_ID=${lessonId}`);
  } else {
    discovered.notes.push("No lesson id found in course detail response");
  }

  if (!discovered.lessonId && (TEST_TOKEN || (TEST_EMAIL && TEST_PASSWORD))) {
    const authToken = TEST_TOKEN || null;
    let effectiveToken = authToken;

    if (!effectiveToken && TEST_EMAIL && TEST_PASSWORD) {
      const loginRes = await requestEndpoint(
        {
          label: "Lesson discovery login",
          method: "POST",
          path: "/auth/login",
          body: { email: TEST_EMAIL, password: TEST_PASSWORD },
          accept: [200],
        },
        null
      );

      if (loginRes.status === 200) {
        effectiveToken = getTokenFromLoginPayload(loginRes.payload);
      }
    }

    if (effectiveToken) {
      const assignmentRes = await requestEndpoint(
        {
          label: "Lesson discovery via assignments",
          method: "GET",
          path: "/assignments/my-assignments",
          accept: [200, 401, 403],
        },
        effectiveToken
      );

      if (assignmentRes.status === 200) {
        const lessonFromAssignments = findFirstLessonId(extractData(assignmentRes.payload));
        if (lessonFromAssignments) {
          discovered.lessonId = lessonFromAssignments;
          discovered.notes.push(`Auto-discovered TEST_LESSON_ID=${lessonFromAssignments} from assignments`);
        }
      }
    }
  }

  return discovered;
}

async function discoverRuntimeIds(token) {
  const runtime = {
    userRole: null,
    assignmentId: null,
    unsubmittedAssignmentId: null,
    submissionId: null,
    doubtId: null,
    usedEnrollmentCourseIds: [],
    notes: [],
  };

  if (!token) {
    return runtime;
  }

  const meRes = await requestEndpoint(
    {
      label: "Runtime me",
      method: "GET",
      path: "/auth/me",
      accept: [200, 401, 403],
    },
    token
  );

  if (meRes.status === 200) {
    runtime.userRole = getUserRoleFromMePayload(meRes.payload);
  }

  const assignmentsRes = await requestEndpoint(
    {
      label: "Runtime assignments",
      method: "GET",
      path: "/assignments/my-assignments",
      accept: [200, 401, 403],
    },
    token
  );

  if (assignmentsRes.status === 200) {
    const assignmentEntities = getEntityArrayFromPayload(assignmentsRes.payload, ["assignments", "items"]);
    const firstAssignment = assignmentEntities[0] || null;
    runtime.assignmentId = getEntityId(firstAssignment);
    if (runtime.assignmentId) {
      runtime.notes.push(`Runtime assignment id=${runtime.assignmentId}`);
    }

    runtime._assignmentEntities = assignmentEntities;
  }

  const submissionsRes = await requestEndpoint(
    {
      label: "Runtime submissions",
      method: "GET",
      path: "/assignments/submissions/me",
      accept: [200, 401, 403],
    },
    token
  );

  if (submissionsRes.status === 200) {
    const submissionEntities = getEntityArrayFromPayload(submissionsRes.payload, ["submissions", "items"]);
    const firstSubmission = submissionEntities[0] || null;
    runtime.submissionId = getEntityId(firstSubmission);
    if (runtime.submissionId) {
      runtime.notes.push(`Runtime submission id=${runtime.submissionId}`);
    }

    const submittedAssignmentIds = new Set(
      submissionEntities
        .map((item) => item?.assignment_id || item?.assignmentId || item?.assignments?.id || null)
        .filter(Boolean)
    );

    const firstUnsubmitted = (runtime._assignmentEntities || []).find((item) => {
      const assignmentId = getEntityId(item);
      return assignmentId && !submittedAssignmentIds.has(assignmentId);
    });

    runtime.unsubmittedAssignmentId = getEntityId(firstUnsubmitted);
    if (runtime.unsubmittedAssignmentId) {
      runtime.notes.push(`Runtime unsubmitted assignment id=${runtime.unsubmittedAssignmentId}`);
    }
  }

  const doubtsRes = await requestEndpoint(
    {
      label: "Runtime doubts",
      method: "GET",
      path: "/doubts/me",
      accept: [200, 401, 403],
    },
    token
  );

  if (doubtsRes.status === 200) {
    const firstDoubt = getFirstEntityFromPayload(doubtsRes.payload, ["doubts", "items"]);
    runtime.doubtId = getEntityId(firstDoubt);
    if (runtime.doubtId) {
      runtime.notes.push(`Runtime doubt id=${runtime.doubtId}`);
    }
  }

  const myRequestsRes = await requestEndpoint(
    {
      label: "Runtime enrollment requests",
      method: "GET",
      path: "/enrollments/requests/me",
      accept: [200, 401, 403],
    },
    token
  );

  const myEnrollmentsRes = await requestEndpoint(
    {
      label: "Runtime enrollments",
      method: "GET",
      path: "/enrollments/me",
      accept: [200, 401, 403],
    },
    token
  );

  const collectCourseIds = (entities) =>
    entities
      .map((item) => item?.course_id || item?.courseId || item?.courses?.id || item?.course?.id || null)
      .filter(Boolean);

  const requestCourseIds = myRequestsRes.status === 200
    ? collectCourseIds(getEntityArrayFromPayload(myRequestsRes.payload, ["requests", "items"]))
    : [];
  const enrollmentCourseIds = myEnrollmentsRes.status === 200
    ? collectCourseIds(getEntityArrayFromPayload(myEnrollmentsRes.payload, ["enrollments", "items"]))
    : [];

  runtime.usedEnrollmentCourseIds = [...new Set([...requestCourseIds, ...enrollmentCourseIds])];
  if (runtime.usedEnrollmentCourseIds.length > 0) {
    runtime.notes.push(`Runtime used enrollment course ids=${runtime.usedEnrollmentCourseIds.join(",")}`);
  }

  delete runtime._assignmentEntities;

  return runtime;
}

function buildBasicEndpoints() {
  const endpoints = [
    {
      label: "Courses public list",
      method: "GET",
      path: "/courses",
      accept: [200],
    },
    {
      label: "Auth me",
      method: "GET",
      path: "/auth/me",
      accept: [200, 401],
    },
  ];

  if (TEST_COURSE_SLUG) {
    endpoints.push({
      label: "Course by slug",
      method: "GET",
      path: `/courses/${TEST_COURSE_SLUG}`,
      accept: [200, 404],
    });
  }

  return endpoints;
}

function buildFullEndpoints(runtime = {}) {
  const {
    courseDetailIdentifier = DUMMY_SLUG,
    courseId = DUMMY_ID,
    enrollmentCourseId = courseId,
    lessonId = null,
    assignmentId = DUMMY_ID,
    submissionId = DUMMY_ID,
    doubtId = DUMMY_ID,
    teacherCoursesTokenMode = "auth",
    teacherCoursesAccept = [200, 401, 403],
  } = runtime;

  const endpoints = [
    // Auth
    { label: "Auth signup", method: "POST", path: "/auth/signup", body: { name: "Smoke User", email: `smoke_${Date.now()}@example.com`, password: "password123", phone: "9999999999" }, accept: [200, 201, 400, 409, 422] },
    { label: "Auth login", method: "POST", path: "/auth/login", body: { email: TEST_EMAIL || "invalid@example.com", password: TEST_PASSWORD || "wrong-pass" }, accept: [200, 400, 401, 422] },
    { label: "Auth me", method: "GET", path: "/auth/me", accept: [200, 401] },
    { label: "Auth update me", method: "PUT", path: "/auth/me", body: { name: "Updated Name", phone: "1234567890" }, accept: [200, 400, 401, 403, 422] },
    { label: "Auth logout", method: "POST", path: "/auth/logout", accept: [200, 204, 401, 403] },

    // Courses & modules
    { label: "Courses list", method: "GET", path: "/courses", accept: [200] },
    { label: "Course detail", method: "GET", path: `/courses/${courseDetailIdentifier}`, accept: [200, 404] },
    { label: "Teacher courses", method: "GET", path: "/courses/teacher/my", accept: teacherCoursesAccept, tokenMode: teacherCoursesTokenMode },
    { label: "Course create", method: "POST", path: "/courses", body: { title: "Smoke Course" }, accept: [200, 201, 400, 401, 403, 422] },
    { label: "Course update", method: "PUT", path: `/courses/${DUMMY_ID}`, body: { title: "Updated" }, accept: [200, 400, 401, 403, 404, 422] },
    { label: "Course delete", method: "DELETE", path: `/courses/${DUMMY_ID}`, accept: [200, 204, 401, 403, 404] },
    { label: "Module add", method: "POST", path: `/courses/${DUMMY_ID}/modules`, body: { title: "Module" }, accept: [200, 201, 400, 401, 403, 404, 422] },
    { label: "Module update", method: "PUT", path: `/courses/modules/${DUMMY_ID}`, body: { title: "Module Updated" }, accept: [200, 400, 401, 403, 404, 422] },
    { label: "Module delete", method: "DELETE", path: `/courses/modules/${DUMMY_ID}`, accept: [200, 204, 401, 403, 404] },

    // Enrollments
    { label: "Enrollment request", method: "POST", path: "/enrollments/request", body: { course_id: enrollmentCourseId }, accept: [200, 201, 400, 401, 403, 404, 409, 422] },
    { label: "My enrollment requests", method: "GET", path: "/enrollments/requests/me", accept: [200, 401, 403] },
    { label: "My enrollments", method: "GET", path: "/enrollments/me", accept: [200, 401, 403] },
    { label: "Pending requests", method: "GET", path: "/enrollments/requests/pending", accept: [200, 401, 403] },
    { label: "Enrollment request update", method: "PUT", path: `/enrollments/requests/${DUMMY_ID}`, body: { status: "approved" }, accept: [200, 400, 401, 403, 404, 422] },
    { label: "Enrollment request delete", method: "DELETE", path: `/enrollments/requests/${DUMMY_ID}`, accept: [200, 204, 401, 403, 404] },
    { label: "Enrollments all", method: "GET", path: "/enrollments", accept: [200, 401, 403] },
    { label: "Enrollment update", method: "PUT", path: `/enrollments/${DUMMY_ID}`, body: { progress: 50 }, accept: [200, 400, 401, 403, 404, 422] },
    { label: "Enrollment delete", method: "DELETE", path: `/enrollments/${DUMMY_ID}`, accept: [200, 204, 401, 403, 404] },

    // Lessons
    { label: "Lesson create", method: "POST", path: "/lessons", body: { title: "Lesson" }, accept: [200, 201, 400, 401, 403, 422] },
    { label: "Lesson detail", method: "GET", path: `/lessons/${lessonId || DUMMY_ID}`, accept: [200, 401, 403, 404] },
    { label: "Lesson update", method: "PUT", path: `/lessons/${DUMMY_ID}`, body: { title: "Lesson Updated" }, accept: [200, 400, 401, 403, 404, 422] },
    { label: "Lesson delete", method: "DELETE", path: `/lessons/${DUMMY_ID}`, accept: [200, 204, 401, 403, 404] },

    // Assignments
    { label: "My assignments", method: "GET", path: "/assignments/my-assignments", accept: [200, 401, 403] },
    { label: "My submissions", method: "GET", path: "/assignments/submissions/me", accept: [200, 401, 403] },
    { label: "Assignments by course", method: "GET", path: `/assignments/course/${courseId}`, accept: [200, 401, 403, 404] },
    { label: "Assignment create", method: "POST", path: "/assignments", body: { title: "Assignment" }, accept: [200, 201, 400, 401, 403, 422] },
    { label: "Assignment update", method: "PUT", path: `/assignments/${DUMMY_ID}`, body: { title: "Assignment Updated" }, accept: [200, 400, 401, 403, 404, 422] },
    { label: "Assignment delete", method: "DELETE", path: `/assignments/${DUMMY_ID}`, accept: [200, 204, 401, 403, 404] },
    { label: "Assignment submit", method: "POST", path: `/assignments/${assignmentId}/submit`, body: { submission_url: "https://github.com/example/repo" }, accept: [200, 201, 400, 401, 403, 404, 409, 422] },
    { label: "Submission update", method: "PUT", path: `/assignments/submissions/${submissionId}`, body: { submission_url: "https://github.com/example/new-repo" }, accept: [200, 400, 401, 403, 404, 422] },
    { label: "Submission delete", method: "DELETE", path: `/assignments/submissions/${submissionId}`, accept: [200, 204, 401, 403, 404] },
    { label: "Submission grade", method: "PUT", path: `/assignments/submissions/${submissionId}/grade`, body: { score: 90, feedback: "Great work" }, accept: [200, 400, 401, 403, 404, 422] },

    // Doubts
    { label: "My doubts", method: "GET", path: "/doubts/me", accept: [200, 401, 403] },
    { label: "Teacher doubts", method: "GET", path: "/doubts/teacher", accept: [200, 401, 403] },
    { label: "All doubts", method: "GET", path: "/doubts", accept: [200, 401, 403] },
    { label: "Doubt create", method: "POST", path: "/doubts", body: { subject: "Doubt subject", description: "Doubt description", course_id: courseId, ...(lessonId ? { lesson_id: lessonId } : {}) }, accept: [200, 201, 400, 401, 403, 422] },
    { label: "Doubt update", method: "PUT", path: `/doubts/${doubtId}`, body: { subject: "Updated doubt subject", description: "Updated description" }, accept: [200, 400, 401, 403, 404, 422] },
    { label: "Doubt delete", method: "DELETE", path: `/doubts/${doubtId}`, accept: [200, 204, 401, 403, 404] },
    { label: "Doubt resolve", method: "PUT", path: `/doubts/${doubtId}/resolve`, body: { reply: "Resolved" }, accept: [200, 400, 401, 403, 404, 422] },

    // Interviews
    { label: "My interviews", method: "GET", path: "/interviews/me", accept: [200, 401, 403] },
    { label: "Teacher interviews", method: "GET", path: "/interviews/teacher", accept: [200, 401, 403] },
    { label: "All interviews", method: "GET", path: "/interviews", accept: [200, 401, 403] },
    { label: "Interview schedule", method: "POST", path: "/interviews", body: { title: "Mock Interview", scheduled_at: new Date().toISOString(), course_id: DUMMY_ID, student_id: DUMMY_ID, meeting_link: "https://meet.example.com" }, accept: [200, 201, 400, 401, 403, 404, 422] },
    { label: "Interview update", method: "PUT", path: `/interviews/${DUMMY_ID}`, body: { title: "Updated Interview" }, accept: [200, 400, 401, 403, 404, 422] },
    { label: "Interview delete", method: "DELETE", path: `/interviews/${DUMMY_ID}`, accept: [200, 204, 401, 403, 404] },
    { label: "Interview complete", method: "PUT", path: `/interviews/${DUMMY_ID}/complete`, body: { score: 8, notes: "Good problem solving" }, accept: [200, 400, 401, 403, 404, 422] },

    // Admin
    { label: "Admin students", method: "GET", path: "/admin/students", accept: [200, 401, 403] },
    { label: "Admin staff", method: "GET", path: "/admin/staff", accept: [200, 401, 403] },
    { label: "Admin register staff", method: "POST", path: "/admin/staff", body: { name: "Staff", email: `staff_${Date.now()}@example.com`, password: "password123", role: "teacher" }, accept: [200, 201, 400, 401, 403, 409, 422] },
    { label: "Admin update role", method: "PUT", path: `/admin/users/${DUMMY_ID}/role`, body: { role: "admin" }, accept: [200, 400, 401, 403, 404, 422] },
    { label: "Admin delete user", method: "DELETE", path: `/admin/users/${DUMMY_ID}`, accept: [200, 204, 401, 403, 404] },
    { label: "Admin transactions", method: "GET", path: "/admin/transactions", accept: [200, 401, 403] },
    { label: "Admin transaction create", method: "POST", path: "/admin/transactions", body: { type: "credit", description: "Smoke transaction", amount: 100, date: "2026-04-17" }, accept: [200, 201, 400, 401, 403, 422] },
    { label: "Admin transaction update", method: "PUT", path: `/admin/transactions/${DUMMY_ID}`, body: { amount: 120 }, accept: [200, 400, 401, 403, 404, 422] },
    { label: "Admin transaction delete", method: "DELETE", path: `/admin/transactions/${DUMMY_ID}`, accept: [200, 204, 401, 403, 404] },
    { label: "Admin feedback", method: "GET", path: "/admin/feedback", accept: [200, 401, 403] },
    { label: "Admin resolve feedback", method: "PUT", path: `/admin/feedback/${DUMMY_ID}/resolve`, body: {}, accept: [200, 400, 401, 403, 404, 422] },
    { label: "Admin settings", method: "GET", path: "/admin/settings", accept: [200, 401, 403] },
    { label: "Admin update setting", method: "PUT", path: `/admin/settings/${process.env.ADMIN_SETTING_KEY || "site_name"}`, body: { value: "CodeCure Academy" }, accept: [200, 400, 401, 403, 404, 422] },
  ];

  return endpoints;
}

async function run() {
  console.log(color.cyan(`\nCodeCure API Smoke Test`));
  console.log(`Mode: ${fullMode ? "FULL" : "BASIC"}`);
  console.log(`Base: ${API_BASE}`);

  if (envLoadInfo.error) {
    console.log(color.yellow(`Env preload warning: ${envLoadInfo.error}`));
  } else if (envLoadInfo.loadedCount > 0) {
    console.log(`Loaded ${envLoadInfo.loadedCount} vars from .env`);
  }

  let token = TEST_TOKEN || null;
  let resolvedCourseSlug = TEST_COURSE_SLUG || null;
  let resolvedLessonId = TEST_LESSON_ID || null;
  let resolvedCourseId = null;
  let runtimeRole = null;
  let runtimeAssignmentId = DUMMY_ID;
  let runtimeUnsubmittedAssignmentId = null;
  let runtimeSubmissionId = DUMMY_ID;
  let runtimeDoubtId = DUMMY_ID;
  let runtimeUsedEnrollmentCourseIds = [];
  let discoveredCourseIds = [];

  if (!token && TEST_EMAIL && TEST_PASSWORD) {
    const loginProbe = {
      label: "Bootstrap login",
      method: "POST",
      path: "/auth/login",
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
      accept: [200],
    };

    const loginRes = await requestEndpoint(loginProbe, null);
    if (loginRes.ok) {
      token = getTokenFromLoginPayload(loginRes.payload);
      if (token) {
        addResult("pass", "Bootstrap login", "Token acquired from TEST_EMAIL/TEST_PASSWORD");
      } else {
        addResult("fail", "Bootstrap login", "Login succeeded but token missing in response");
      }
    } else {
      addResult("fail", "Bootstrap login", `Status ${loginRes.status || "ERR"}`);
    }
  } else if (!token && !TEST_EMAIL && !TEST_PASSWORD) {
    addResult("skip", "Bootstrap login", "No TEST_TOKEN or TEST_EMAIL/TEST_PASSWORD provided");
  }

  if (fullMode && (!resolvedCourseSlug || !resolvedLessonId)) {
    const discovered = await discoverCourseAndLessonIds();
    resolvedCourseSlug = resolvedCourseSlug || discovered.courseSlug;
    resolvedLessonId = resolvedLessonId || discovered.lessonId;
    resolvedCourseId = discovered.courseId || resolvedCourseId;
    discoveredCourseIds = discovered.courseIds || [];

    for (const note of discovered.notes) {
      console.log(note);
    }
  }

  if (fullMode && token) {
    const runtime = await discoverRuntimeIds(token);
    runtimeRole = runtime.userRole;
    runtimeUnsubmittedAssignmentId = runtime.unsubmittedAssignmentId || null;
    runtimeAssignmentId = runtimeUnsubmittedAssignmentId || runtime.assignmentId || runtimeAssignmentId;
    runtimeSubmissionId = runtime.submissionId || runtimeSubmissionId;
    runtimeDoubtId = runtime.doubtId || runtimeDoubtId;
    runtimeUsedEnrollmentCourseIds = runtime.usedEnrollmentCourseIds || [];

    for (const note of runtime.notes) {
      console.log(note);
    }
  }

  if (fullMode) {
    if (!resolvedCourseSlug) {
      resolvedCourseSlug = DUMMY_SLUG;
      console.log("Using fallback course identifier for Course detail check");
    }
  }

  const effectiveCourseId = resolvedCourseId || DUMMY_ID;
  const teacherRole = runtimeRole === "teacher" || runtimeRole === "admin";
  const teacherCoursesTokenMode = "auth";
  const teacherCoursesAccept = teacherRole ? [200] : [401, 403];

  let enrollmentCourseId = effectiveCourseId;
  if (fullMode && discoveredCourseIds.length > 0) {
    const usedSet = new Set(runtimeUsedEnrollmentCourseIds);
    const availableCourseId = discoveredCourseIds.find((id) => !usedSet.has(id));
    if (availableCourseId) {
      enrollmentCourseId = availableCourseId;
      console.log(`Runtime enrollment candidate course id=${enrollmentCourseId}`);
    }
  }

  const endpoints = fullMode
    ? buildFullEndpoints({
      courseDetailIdentifier: resolvedCourseSlug,
      courseId: effectiveCourseId,
      enrollmentCourseId,
      lessonId: resolvedLessonId,
      assignmentId: runtimeAssignmentId,
      submissionId: runtimeSubmissionId,
      doubtId: runtimeDoubtId,
      teacherCoursesTokenMode,
      teacherCoursesAccept,
    })
    : buildBasicEndpoints();

  if (fullMode && !resolvedLessonId) {
    addResult("skip", "Lesson detail", "No discoverable lesson id found; set TEST_LESSON_ID to enable");
  }

  if (fullMode && !teacherRole) {
    addResult("skip", "Teacher courses", "Authenticated user is not teacher/admin");
  }

  const shouldSkipEnrollmentRequest =
    fullMode &&
    discoveredCourseIds.length > 0 &&
    runtimeUsedEnrollmentCourseIds.length > 0 &&
    runtimeUsedEnrollmentCourseIds.includes(enrollmentCourseId);

  if (shouldSkipEnrollmentRequest) {
    addResult("skip", "Enrollment request", "No enrollable course available for current user");
  }

  const shouldSkipAssignmentSubmit = fullMode && token && !runtimeUnsubmittedAssignmentId;
  if (shouldSkipAssignmentSubmit) {
    addResult("skip", "Assignment submit", "No unsubmitted assignment available for current user");
  }

  const effectiveEndpoints = endpoints.filter((endpoint) => {
    if (fullMode && endpoint.label === "Lesson detail" && !resolvedLessonId) {
      return false;
    }
    if (fullMode && endpoint.label === "Teacher courses" && !teacherRole) {
      return false;
    }
    if (shouldSkipEnrollmentRequest && endpoint.label === "Enrollment request") {
      return false;
    }
    if (shouldSkipAssignmentSubmit && endpoint.label === "Assignment submit") {
      return false;
    }
    return true;
  });

  for (const endpoint of effectiveEndpoints) {
    const endpointToken = endpoint.tokenMode === "none" ? null : token;
    const res = await requestEndpoint(endpoint, endpointToken);

    if (res.ok) {
      addResult("pass", endpoint.label, `Status ${res.status}`);
      continue;
    }

    if (res.routeMissing) {
      addResult("fail", endpoint.label, `Likely route missing (status ${res.status})`);
      continue;
    }

    if (res.status === null) {
      addResult("fail", endpoint.label, res.error || "Request failed");
      continue;
    }

    addResult("fail", endpoint.label, `Status ${res.status} (accepted: ${endpoint.accept.join(",")})`);
  }

  console.log("");
  for (const result of results) {
    printResult(result);
  }

  console.log("\nSummary:");
  console.log(color.green(`PASS: ${summary.pass}`));
  console.log(color.red(`FAIL: ${summary.fail}`));
  console.log(color.yellow(`SKIP: ${summary.skip}`));

  if (summary.fail > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(color.red(`Fatal error: ${String(error)}`));
  process.exitCode = 1;
});
