import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import useAppStore, { Contact } from "@/store/store";

interface ContactListProps {
  contacts: Contact[];
}

const ContactList: React.FC<ContactListProps> = ({ contacts }) => {
  const { onlineFriends } = useAppStore();
  return (
    <ScrollArea className="flex-1">
      <div className="space-y-2 p-2">
        {contacts?.map((conversation) => (
          <Button
            key={conversation.id}
            variant="ghost"
            className="w-full justify-start px-2"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar>
                  <AvatarImage
                    src={
                      conversation?.avatar ||
                      `https://api.dicebear.com/6.x/micah/svg?seed=${conversation.name}`
                    }
                  />
                  <AvatarFallback>
                    {conversation.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {onlineFriends?.includes(conversation?.id) && (
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium truncate">
                    @{conversation.name}
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
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ContactList;
