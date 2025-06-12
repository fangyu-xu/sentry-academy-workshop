import * as Sentry from "@sentry/react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const { logger } = Sentry;

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new ApiError(
        response.status,
        error.message || `HTTP ${response.status}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error("Network error: Unable to connect to the server");
  }
}

export const api = {
  // Courses
  courses: {
    getAll: (params?: {
      category?: string;
      level?: string;
      featured?: string;
    }) => {
      const queryString = params
        ? "?" + new URLSearchParams(params).toString()
        : "";
      return fetchApi<any[]>(`/courses${queryString}`);
    },
    getById: (id: string) => fetchApi<any>(`/courses/${id}`),
    create: (data: any) =>
      fetchApi<any>("/courses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchApi<any>(`/courses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    getCategories: () => fetchApi<any[]>("/courses/categories"),
  },

  // Lessons
  lessons: {
    getByCourse: (courseId: string) =>
      fetchApi<any[]>(`/lessons/course/${courseId}`),
    getById: (id: string) => fetchApi<any>(`/lessons/${id}`),
    create: (data: any) =>
      fetchApi<any>("/lessons", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchApi<any>(`/lessons/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    markComplete: (id: string) =>
      fetchApi<any>(`/lessons/${id}/complete`, {
        method: "POST",
      }),
  },

  // Users
  users: {
    getProfile: () => fetchApi<any>("/users/me"),
    updateProfile: (data: any) =>
      fetchApi<any>("/users/me", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    getEnrollments: () => fetchApi<any[]>("/users/me/enrollments"),
  },

  // TOFIX Module 3: Broken enrollments missing userId
  enrollments: {
    create: (courseId: string, userId: string | undefined) =>
      Sentry.startSpan(
        {
          name: "enrollment.create.frontend",
          op: "http.client",
          attributes: {
            "enrollment.course_id": courseId,
            "enrollment.user_id": userId || "undefined",
            "enrollment.user_id_provided": !!userId,
          },
        },
        () => {
          logger.info(
            logger.fmt`Creating enrollment for course: ${courseId}, user: ${
              userId || "undefined"
            }`
          );
          return fetchApi<any>("/enrollments", {
            method: "POST",
            body: JSON.stringify({ courseId, userId }),
          });
        }
      ),
    getUserEnrollments: (userId: string) =>
      fetchApi<any[]>(`/enrollments/user/${userId}`),
    getProgress: (enrollmentId: string) =>
      fetchApi<any>(`/enrollments/${enrollmentId}/progress`),
    delete: (enrollmentId: string) =>
      fetchApi<any>(`/enrollments/${enrollmentId}`, {
        method: "DELETE",
      }),
  },

  // Search
  search: {
    courses: (query: string) =>
      Sentry.startSpan(
        {
          name: "search.courses.frontend",
          op: "http.client",
          attributes: {
            "search.query": query,
            "http.url": `/search/courses?query=${encodeURIComponent(query)}`,
          },
        },
        () => {
          logger.info(logger.fmt`Searching courses with query: ${query}`);
          return fetchApi<any[]>(
            `/search/courses?q=${encodeURIComponent(query)}`
          );
        }
      ),
  },
};

export type { ApiError };
