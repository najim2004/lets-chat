"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Send, Phone, Video, Paperclip } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

import ContactList from "@/components/contactlist/contactlist";
import useAppStore, { Contact } from "@/store/store";
import SearchInput from "@/components/search-input/search-input";
import Drawer from "@/components/drawer/drawer";

export default function ChatApp() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedContactDetails, setSelectedContactDetails] = useState<
    Contact | undefined | null
  >(null);
  const { setTheme, theme } = useTheme();
  const { getUser, user, contacts } = useAppStore();

  const messages = [
    {
      id: 1,
      sender: "Alice Johnson",
      content: "Hey there! How's it going?",
      time: "10:00 AM",
    },
    {
      id: 2,
      sender: "You",
      content: "Hi Alice! I'm doing well, thanks. How about you?",
      time: "10:05 AM",
    },
    {
      id: 3,
      sender: "Alice Johnson",
      content: "I'm great! Just finished a big project at work.",
      time: "10:10 AM",
    },
    {
      id: 4,
      sender: "You",
      content:
        "That's awesome! Congratulations on completing the project. What was it about?",
      time: "10:15 AM",
    },
    {
      id: 5,
      sender: "Alice Johnson",
      content:
        "It was a new feature for our app. We added AI-powered recommendations.",
      time: "10:20 AM",
    },
    {
      id: 6,
      sender: "You",
      content:
        "Wow, that sounds really interesting! How long did it take to implement?",
      time: "10:25 AM",
    },
  ];

  const onSubmit = (e) => {
    e.preventDefault();
  };
  useEffect(() => {
    const fetchUser = async () => {
      await getUser();
    };
    if (!user?._id) {
      fetchUser();
    }
  }, [getUser, user?._id]);

  useEffect(() => {
    if (selectedContact) {
      const contact = contacts.find((c) => c.id === selectedContact);
      setSelectedContactDetails(contact);
    } else {
      setSelectedContactDetails(null);
    }
  }, [selectedContact, contacts]);
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar for larger screens */}
      <aside className="hidden md:flex md:w-80 lg:w-96 flex-col border-r">
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Chats</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
        <SearchInput />
        <ContactList
          contacts={contacts}
          selectedContact={selectedContactDetails?.id || null}
          onContactClick={(contacts) => setSelectedContact(contacts)}
        />
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col">
        <Drawer
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          contacts={contacts}
        >
          <SearchInput />
          <ContactList
            contacts={contacts}
            selectedContact={selectedContactDetails?.id || null}
            onContactClick={(contacts) => setSelectedContact(contacts)}
          />
        </Drawer>
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center space-x-4 lg-hidden">
            <Avatar>
              <AvatarImage
                src={
                  selectedContactDetails?.avatar ||
                  `https://api.dicebear.com/6.x/micah/svg?seed=${selectedContactDetails?.name}`
                }
              />
              <AvatarFallback>
                {selectedContactDetails?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">
                {selectedContactDetails?.name || "Select a contact"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedContactDetails?.online ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
            >
              <Video className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "You" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] ${
                    msg.sender === "You"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  } rounded-lg p-3`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs text-right mt-1 opacity-70">
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <footer className="p-4">
          <form onSubmit={onSubmit} className="flex items-center space-x-2">
            <Button type="button" variant="ghost" size="icon">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              name="message"
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </footer>
      </main>
    </div>
  );
}
