/**
 * Consistently calculates course progress percentage based on watched lessons vs total uploaded.
 */
export const parseCompletedLessons = (lessons: any): any[] => {
  if (Array.isArray(lessons)) return lessons;
  if (typeof lessons === "string") {
    try {
      const parsed = JSON.parse(lessons);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [];
    }
  }
  return [];
};

/**
 * Consistently calculates course progress percentage based on watched lessons vs total uploaded.
 */
export const calculateProgress = (enrollment: any): number => {
  if (!enrollment) return 0;

  // Safely parse completed_lessons from either JSON string or array
  const completed = parseCompletedLessons(enrollment.completed_lessons).length;

  // The course object might have lesson_count or a lessons array
  const courseRef = enrollment.courses || enrollment.course || {};
  const total = courseRef.lesson_count || courseRef.total_lessons || courseRef.lessons_count || (Array.isArray(courseRef.lessons) ? courseRef.lessons.length : 0);

  if (total > 0) {
    const calc = Math.round((completed / total) * 100);
    return Math.min(100, Math.max(0, calc));
  }

  const fallback = enrollment.progress || 0;
  // If we only know progress and completed, but NOT total, don't just say 0% if completed > 0
  if (total === 0 && completed > 0 && fallback > 0) {
    return Math.min(100, Math.max(0, fallback));
  } else if (total === 0 && completed > 0) {
    // We completed lessons but progress is zero/missing, we just show a safe >0% (fake 50% or something? No, fallback is fine)
    return Math.min(100, Math.max(0, fallback));
  }
  
  return Math.min(100, Math.max(0, fallback));
};

/**
 * Returns a human-readable progress string, e.g. "2 of 5 Lessons"
 */
export const getProgressString = (enrollment: any): string => {
  if (!enrollment) return "0 Lessons";
  
  const completed = parseCompletedLessons(enrollment.completed_lessons).length;
  const courseRef = enrollment.courses || enrollment.course || {};
  let total = courseRef.lesson_count || courseRef.total_lessons || courseRef.lessons_count || (Array.isArray(courseRef.lessons) ? courseRef.lessons.length : 0);
  
  if (total === 0 && completed > 0) {
    const fallbackProgress = enrollment.progress || 0;
    if (fallbackProgress > 0) {
       total = Math.round((completed / fallbackProgress) * 100);
    }
  }

  if (total === 0 && completed > 0) {
    return `${completed} Lessons Played`;
  }
  
  return `${completed} of ${total} Lessons Played`;
};
