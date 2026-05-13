export const getUser = () => {
  const user = localStorage.getItem("user");
  try {
    return user ? JSON.parse(user) : null;
  } catch (_err) {
    return null;
  }
};

export const getCitizenEmail = () => {
  return localStorage.getItem("citizen_email");
};

export const hasCitizenSession = () => {
  return Boolean(getCitizenEmail());
};

export const hasStaffAdminSession = () => {
  const user = getUser();
  const token = user?.token || localStorage.getItem("token");
  return Boolean(token && (user?.role === "staff" || user?.role === "admin"));
};

export const getCurrentUserRole = () => {
  const user = getUser();
  const token = user?.token || localStorage.getItem("token");

  if (token && (user?.role === "staff" || user?.role === "admin")) {
    return user.role;
  }

  if (hasCitizenSession()) {
    return "citizen";
  }

  return null;
};

export const isAuthenticated = () => {
  return Boolean(getCurrentUserRole());
};

export const getRole = () => {
  return getCurrentUserRole();
};

export const logout = () => {
  const role = getCurrentUserRole();
  if (role === "citizen") {
    localStorage.removeItem("citizen_email");
  } else {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }
  window.location.href = "/";
};
