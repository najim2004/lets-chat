import { create } from "zustand";

export interface CommonResponse {
  success: boolean;
  message?: string;
}

export interface User {
  _id: string;
  email?: string;
  username?: string;
  avatar?: string;
  friends?: string[];
  lastSeen?: Date;
}

export interface LoginResponse extends CommonResponse {
  token?: string;
}
interface UserResponse extends CommonResponse {
  data?: User;
  redirect?: string;
}
export interface Contact {
  id: string;
  name: string;
  email: string;
  avatar: string;
  chatId: string;
}

export interface ContactsResponse extends CommonResponse {
  data?: Contact[];
}

export interface SearchUserResponse extends CommonResponse {
  users?: User[];
}

export interface SetFriendResponse extends CommonResponse {
  data?: Contact;
}

interface AuthState {
  user: User | null;
  token: string | null;
  contacts: Contact[];
  error: string | null;
  isUserGetting: boolean;
  isLoggingIn: boolean;
  isSigningUp: boolean;
  isSearching: boolean;
  isSettingFriend: boolean;
}

interface AppState extends AuthState {
  login: (values: {
    email: string;
    password: string;
  }) => Promise<LoginResponse>;
  signup: (values: {
    username: string;
    email: string;
    password: string;
  }) => Promise<CommonResponse>;
  logout: () => void;
  getUser: () => Promise<void>;
  getContacts: () => Promise<void>;
  getSearchUser: (values: { query: string }) => Promise<SearchUserResponse>;
  setFriend: (friendId: string) => Promise<SetFriendResponse>;
}

const useAppStore = create<AppState>((set, get) => ({
  // ✅ Auth State
  user: null,
  token: null,
  contacts: [],
  error: null,
  isUserGetting: false,
  isLoggingIn: false,
  isSigningUp: false,
  isSearching: false,
  isSettingFriend: false,

  // ✅ Login function
  login: async (values) => {
    try {
      set({ isLoggingIn: true, error: null });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Invalid credentials");

      const data: LoginResponse = await response.json();
      // Set token in localStorage
      if (data.token && data.success) {
        localStorage.setItem("token", data.token);
        set({ token: data.token });
        await get().getUser();
        window.location.href = "/";
      }
      return data; // Return the response data
    } catch (error: any) {
      return { success: false, message: error?.message || "Login failed" };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // ✅ Signup function
  signup: async (values) => {
    try {
      set({ isSigningUp: true, error: null });

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Signup failed");

      const data = await response.json();
      return data;
    } catch (error: any) {
      return { success: false, message: error?.message || "Signup failed" };
    } finally {
      set({ isSigningUp: false });
    }
  },

  // ✅ Logout function
  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem("token");
    window.location.href = "/login";
  },
  // ✅ Get User function
  getUser: async () => {
    try {
      set({ isUserGetting: true });
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data: UserResponse = await response.json();

      if (!response.ok) {
        window.location.href = data?.redirect || "/login";
        throw new Error(data.message || "Failed to fetch user data");
      }
      set({ user: data.data });
      await get().getContacts();
    } catch (error) {
      console.error(error);
    } finally {
      set({ isUserGetting: false });
    }
  },
  // ✅ Get Contacts function
  getContacts: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/user/contacts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data: ContactsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch contacts");
      }
      if (data.success) {
        set({ contacts: data.data || [] });
      }
    } catch (error) {
      console.error(error);
    }
  },
  // ✅ Get Search User function
  getSearchUser: async (values) => {
    try {
      set({ isSearching: true });
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return { success: false, message: "Unauthorized access" };
      }

      const response = await fetch(`/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data: SearchUserResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }
      return data;
    } catch (error) {
      console.error(error);
      return { success: false, message: "Failed to fetch users" };
    } finally {
      set({ isSearching: false });
    }
  },
  // ✅ Set Friend function
  setFriend: async (friendId: string) => {
    try {
      set({ isSettingFriend: true });
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";

        return { success: false, message: "Unauthorized access" };
      }

      const response = await fetch(`/api/user/contacts`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId }),
      });
      const data: SetFriendResponse = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to set friend");
      }
      return data;
      await get().getContacts();
    } catch (error: any) {
      console.error(error);
      return {
        success: false,
        message: error?.message || "Failed to set friend",
      };
    } finally {
      set({ isSettingFriend: false });
    }
  },
}));

export default useAppStore;
