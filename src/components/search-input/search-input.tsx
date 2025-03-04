"use client";

import { Search } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import useAppStore, { CommonResponse } from "@/store/store";
import Loader from "../loader";
import { useToast } from "@/hooks/use-toast";

interface User {
  _id: string;
  username?: string;
  avatar?: string;
}

const DEBOUNCE_DELAY = 500;

const SearchInput = () => {
  const [searchValue, setSearchValue] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [hideResults, setHideResults] = useState<boolean>(false);
  const [result, setResult] = useState<User[] | null>(null);
  const { searchUsers, loading, addFriend, contacts } = useAppStore();

  const { toast } = useToast();

  const fetchResults = useCallback(
    async (query: string) => {
      const response = await searchUsers(query);
      if (response.success) {
        setResult(response?.users || []);
      }
    },
    [searchUsers]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue.length === 0) {
        setResult(null);
        return;
      }
      fetchResults(searchValue);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchValue, fetchResults]);

  const handleSearch = useCallback(() => {
    fetchResults(searchValue);
  }, [searchValue, fetchResults]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (searchValue.length <= 0) {
          setResult(null);
          return;
        }
        handleSearch();
      }
    },
    [handleSearch, searchValue]
  );

  const handleAddUser = useCallback(
    async (userId: string) => {
      setIsAdding(true);
      console.log(`Adding user with ID: ${userId}`);
      const response: CommonResponse = await addFriend(userId);
      if (response.success) {
        toast({
          variant: "default",
          title: "Success",
          description: "User added successfully",
        });
        console.log("User added successfully");
        setResult(null);
        setSearchValue("");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response?.message || "Failed to add user",
        });
      }
      setIsAdding(false);
    },
    [addFriend, toast]
  );

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="px-4 relative w-full">
        <Search className="absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          className="pl-10 h-10 w-full shadow-none"
          placeholder="Search users..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setHideResults(false)}
          onBlur={() => setTimeout(() => setHideResults(true), 200)}
          onKeyDown={handleKeyDown}
        />
        {loading.search && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <Loader size={20} />
          </div>
        )}
      </div>

      {/* Search Results */}
      {result && !hideResults && (
        <div className="absolute top-full mt-2 left-0 w-full bg-white shadow-md overflow-hidden z-40">
          {result?.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              No users found.
            </div>
          ) : (
            <div className="py-2">
              {result?.map((user) => (
                <div
                  key={user._id}
                  className="px-4 py-2 hover:bg-gray-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user?.username} />
                      <AvatarFallback>
                        {user?.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      @{user.username}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    className={`${
                      contacts.some((contact) => contact.id === user._id)
                        ? "bg-transparent text-gray-800 shadow-none border hover:bg-transparent"
                        : "bg-primary text-white"
                    } `}
                    disabled={isAdding}
                    onClick={() => handleAddUser(user?._id)}
                  >
                    {contacts.some((contact) => contact.id === user._id) ? (
                      "Added"
                    ) : isAdding ? (
                      <Loader size={20} color="white" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
