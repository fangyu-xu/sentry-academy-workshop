import * as Sentry from "@sentry/react";
import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import React from "react";

const ErrorBoundary = () => {
  const error = useRouteError();

  React.useEffect(() => {
    // Send route errors to Sentry
    if (error) {
      Sentry.captureException(error);
    }
  }, [error]);

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">
            {error.status}
          </h1>
          <p className="text-xl text-gray-600 mb-4">{error.statusText}</p>
          <p className="text-gray-500">{error.data}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : "Unknown error occurred"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reload page
        </button>
      </div>
    </div>
  );
};

export default ErrorBoundary;
