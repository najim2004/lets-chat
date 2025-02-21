export interface User{
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  friends?: string[];
  createdAt?: string;
  updatedAt?: string;
} 

export interface UserRequest {
  username?: string;
  email: string;
  password: string;
}

export interface ContactDetails {
  id: string;
  name: string;
  email: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  chatId?: string;
  online?: boolean;
}