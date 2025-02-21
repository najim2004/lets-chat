import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { ContactDetails } from "@/app/api/types";

interface ContactListProps {
  contacts: ContactDetails[];
}

const ContactList: React.FC<ContactListProps> = ({ contacts }) => {
  return (
    <ScrollArea className="flex-1">
      <div className="space-y-2 p-2">
        {contacts.map((conversation) => (
          <Button
            key={conversation.id}
            variant="ghost"
            className="w-full justify-start px-2"
          >
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage
                  src={`https://api.dicebear.com/6.x/micah/svg?seed=${conversation.name}`}
                />
                <AvatarFallback>
                  {conversation.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium truncate">
                    {conversation.name}
                  </p>
                  {conversation.unread > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-primary rounded-full">
                      {conversation.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conversation.lastMessage}
                </p>
              </div>
            </div>
            {conversation.online && (
              <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
            )}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ContactList;
