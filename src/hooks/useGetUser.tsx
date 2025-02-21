import { User } from "@/app/api/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserResponse {
  success: boolean;
  user: User;
}

interface ErrorResponse {
  success: boolean;
  message: string;
  redirect?: string;
}

export const useGetUser = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserResponse | undefined>();
  const [error, setError] = useState<Error | undefined>();
  const router = useRouter();

  const fetchUser = async (): Promise<UserResponse | null | void> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        router.push("/login");
        return;
      }

      const response = await fetch("/api/user", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data: UserResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        router.push(errorData?.redirect || "/login");
        throw new Error(errorData.message || "Failed to fetch user data");
      }

      setLoading(false);
      setUserData(data as UserResponse);
      setLoading(false);
      return data as UserResponse;
    } catch (error) {
      setError(
        error instanceof Error ? error : new Error("Unknown error occurred")
      );
      setLoading(false);
      return null;
    }
  };

  return { fetchUser, data: userData, loading, error };
};
