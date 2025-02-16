export interface UserRequest {
  username?: string;
  email: string;
  password: string;
}

export interface ApiResponse {
  message: string;
  token?: string;
  success: boolean;
}
