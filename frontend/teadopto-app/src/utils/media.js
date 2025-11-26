export const getMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";
  const baseUrl = API_BASE_URL.replace('/api/', '').replace('/api', '');
  const mediaPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${mediaPath}`;
};

export const getAdminUrl = () => {
  return import.meta.env.VITE_API_ADMIN_URL || "http://127.0.0.1:8000/admin";
};

