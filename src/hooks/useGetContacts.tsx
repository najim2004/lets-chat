import { ContactDetails } from "@/app/api/types";
import { useState } from "react";

interface ContactsResponse {
  success: boolean;
  data: ContactDetails[];
  message?: string;
}


const useGetContacts = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const fetchContacts = async (): Promise<
    ContactsResponse  | null
  > => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      setLoading(true);
      const response = await fetch("/api/contacts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: ContactsResponse  = await response.json();
      if (!response.ok) {
        if (data.success === false) return data;
      }

      return data as ContactsResponse;
    } catch (err) {
      console.log(err);

      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchContacts, loading };
};

export default useGetContacts;
