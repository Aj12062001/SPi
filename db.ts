
interface User {
  username: string;
  password: string;
  email: string;
  phoneNumber?: string;
  role: string;
  lastLogin: string;
}

const DEFAULT_USERS: User[] = [
  {
    username: "admin",
    password: "password123",
    email: "admin@company.com",
    role: "Security Administrator",
    lastLogin: new Date().toISOString()
  },
  {
    username: "analyst",
    password: "spy-detector-2025",
    email: "analyst@company.com",
    role: "Threat Analyst",
    lastLogin: new Date().toISOString()
  }
];

const STORAGE_KEY = 'spi_users';

const getUsers = (): User[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with defaults
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const validateUser = (user: string, pass: string) => {
  const users = getUsers();
  return users.find(u => u.username === user && u.password === pass);
};

export const createUser = (username: string, password: string, email: string, phoneNumber: string) => {
  const users = getUsers();
  if (users.find(u => u.username === username || u.email === email)) {
    return false; // User or email already exists
  }
  const newUser: User = {
    username,
    password,
    email,
    phoneNumber,
    role: "User",
    lastLogin: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  return true;
};

export const resetPassword = (email: string) => {
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (user) {
    user.password = "reset123"; // Temporary password
    saveUsers(users);
    return true;
  }
  return false;
};

export const updateLastLogin = (username: string) => {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.lastLogin = new Date().toISOString();
    saveUsers(users);
  }
};
