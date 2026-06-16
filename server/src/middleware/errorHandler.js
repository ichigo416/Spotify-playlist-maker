export function errorHandler(error, req, res, next) {
  console.error(error);

  const status = error.response?.status ?? error.statusCode ?? 500;
  const message =
    error.response?.data?.error?.message ?? error.message ?? "Something went wrong.";

  res.status(status).json({ message });
} 