export function obtenerErrorApi(error, fallback = "Error inesperado") {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}
