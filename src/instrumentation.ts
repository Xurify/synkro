import { type Instrumentation } from "next";
import posthog from "posthog-js";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  _request,
  _context,
) => {
  posthog.captureException(error as Error);
};
