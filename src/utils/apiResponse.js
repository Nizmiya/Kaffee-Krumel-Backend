export const success = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

export const fail = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

export const getRedirectTo = (role) =>
  role === "superadmin" ? "/superadmin/dashboard" : "/admin/dashboard";
