import { create } from "zustand";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const token = localStorage.getItem("token");

// Common types for API responses
export type CommonResponse = {
  success: boolean;
  message?: string;
};

export type LoginResponse = CommonResponse & {
  token?: string;
};

// User related types
export type User = {
  _id: string;
  email: string;
  username: string;
  avatar?: string;
  friends: string[];
  lastSeen?: Date;
};

// Contact and messaging types
export type Contact = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  online: boolean;
  chatId?: string;
  lastMessage?: string;
  unread: number;
};

export type Message = {
  _id: string;
  chatId: string;
  sender: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
};

type State = {
  socket: Socket | null;
  user: User | null;
  token: string | null;
  contacts: Contact[];
  onlineFriends: string[];
  messages: Message[];
  loading: {
    user: boolean;
    auth: boolean;
    search: boolean;
    friend: boolean;
    oldMessages: boolean;
    message: boolean;
  };
};

type Actions = {
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<LoginResponse>;
  signup: (data: {
    username: string;
    email: string;
    password: string;
  }) => Promise<CommonResponse>;
  logout: () => void;
  getUser: () => Promise<void>;
  getContacts: () => Promise<void>;
  searchUsers: (query: string) => Promise<{ users?: User[] } & CommonResponse>;
  addFriend: (friendId: string) => Promise<CommonResponse>;
  getOldMessages: (chatId: string) => Promise<{ messages: Message[] }>;
  sendMessage: (message: string, chatId: string) => Promise<CommonResponse>;
  joinChat: (chatId: string) => void;
  connectSocket: () => void;
  disconnectSocket: () => void;
};

const useAppStore = create<State & Actions>((set, get) => ({
  // Initial state
  socket: null,
  user: null,
  token: null,
  contacts: [],
  onlineFriends: [],
  messages: [],
  loading: {
    user: false,
    auth: false,
    search: false,
    friend: false,
    oldMessages: false,
    message: false,
  },

  // Auth actions
  login: async (credentials) => {
    set((state) => ({ loading: { ...state.loading, auth: true } }));
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem("token", data.token);
        set({ token: data.token });
        get().getUser();
        window.location.href = "/";
      }
      return data;
    } catch (error: unknown) {
      console.log(error);
      return { success: false, message: "Login failed" };
    } finally {
      set((state) => ({ loading: { ...state.loading, auth: false } }));
    }
  },

  signup: async (data) => {
    set((state) => ({ loading: { ...state.loading, auth: true } }));
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { success: false, message: "Signup failed" };
    } finally {
      set((state) => ({ loading: { ...state.loading, auth: false } }));
    }
  },

  logout: () => {
    get().disconnectSocket();
    localStorage.removeItem("token");
    set({ user: null, token: null });
    window.location.href = "/login";
  },

  getUser: async () => {
    set((state) => ({ loading: { ...state.loading, user: true } }));
    try {
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();

      if (data.success) {
        set({ user: data.data });
        get().getContacts();
        get().connectSocket();
      }
    } finally {
      set((state) => ({ loading: { ...state.loading, user: false } }));
    }
  },

  getContacts: async () => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch("/api/user/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        if (get().onlineFriends.length > 0) {
          const contacts = data.data.map((contact: Contact) => ({
            ...contact,
            online: get().onlineFriends.includes(contact.id),
          }));
          set({ contacts });
        } else {
          set({ contacts: data.data || [] });
        }
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    }
  },

  searchUsers: async (query) => {
    set((state) => ({ loading: { ...state.loading, search: true } }));
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch("/api/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      return await res.json();
    } catch {
      return { success: false, message: "Search failed" };
    } finally {
      set((state) => ({ loading: { ...state.loading, search: false } }));
    }
  },

  addFriend: async (friendId) => {
    return new Promise((resolve) => {
      get().socket?.emit("add_friend", friendId, (response: CommonResponse) => {
        resolve(response);
      });
      setTimeout(
        () => resolve({ success: false, message: "Request timeout" }),
        5000
      );
    });
  },
  getOldMessages: async (chatId) => {
    try {
      set((state) => ({ loading: { ...state.loading, oldMessages: true } }));
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const res = await fetch(`/api/messages/${chatId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        set((state) => ({ messages: data.data }));
      }
      return data;
    } catch {
      return { success: false, message: "Failed to fetch messages" };
    } finally {
      set((state) => ({ loading: { ...state.loading, oldMessages: false } }));
    }
  },

  connectSocket: () => {
    const userId = get().user?._id;
    if (!userId || get().socket?.connected) return;

    const socket = io(API_URL!, {
      query: { user_id: userId },
      autoConnect: false,
      transports: ["websocket"],
    });

    socket.connect();
    set({ socket });

    socket.on("onlineFriends", (onlineFriends: string[]) => {
      set((state) => ({
        onlineFriends,
        contacts: state.contacts.map((contact) => ({
          ...contact,
          online: onlineFriends.includes(contact.id),
        })),
      }));
    });

    socket.on("last_message", (data: { chatId: string; message: string }) => {
      set((state) => ({
        contacts: state.contacts.map((contact) => {
          if (contact.chatId === data.chatId) {
            return { ...contact, lastMessage: data.message };
          }
          return contact;
        }),
      }));
    });
    socket.on("unread_count", (data: { chatId: string; count: number }) => {
      set((state) => ({
        contacts: state.contacts.map((contact) => {
          if (contact.chatId === data.chatId) {
            return { ...contact, unread: data.count };
          }
          return contact;
        }),
      }));
    });
    socket.on("message", (data: Message) => {
      set((state) => ({
        contacts: state.contacts.map((contact) => {
          if (contact.chatId === data.chatId) {
            return { ...contact, lastMessage: data.content };
          }
          return contact;
        }),
        messages: [...state.messages, data],
      }));
    });

    socket.on("friend_added", (contact: Contact) => {
      set((state) => ({ contacts: [...state.contacts, contact] }));
    });
  },

  sendMessage: async (message, chatId) => {
    set((state) => ({ loading: { ...state.loading, message: true } }));
    try {
      return new Promise((resolve) => {
        get().socket?.emit(
          "message",
          { chatId, message, sender: get().user?._id },
          (response: CommonResponse) => {
            resolve(response);
          }
        );
        setTimeout(
          () => resolve({ success: false, message: "Request timeout" }),
          5000
        );
      });
    } finally {
      set((state) => ({ loading: { ...state.loading, message: false } }));
    }
  },
  joinChat: (chatId) => {
    get().socket?.emit("join_chat", chatId);
  },

  disconnectSocket: () => {
    get().socket?.disconnect();
    set({ socket: null });
  },
}));

export default useAppStore;
