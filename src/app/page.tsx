"use client";
import { getSocket, initSocket } from "@/utils/socket_client";
import { useEffect, useState } from "react";

interface Message {
  senderId: string;
  messageText: string;
  timestamp: Date;
}

interface User {
  id: string;
  username: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [recipientId, setRecipientId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const socket = initSocket("user1"); // Replace with the actual user ID

    socket.on("receiveMessage", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const socket = getSocket();
      socket.emit("newMessage", {
        senderId: "user1", // Replace with the actual sender ID
        recipientId: "user2", // Replace with the actual recipient ID
        messageText: newMessage,
      });
      setNewMessage("");
    }
  };

  return (
    <div>
      <h1>Chat with {recipientId}</h1>
      <div>
        {messages?.map((msg, idx) => (
          <p key={idx}>
            <strong>{msg.senderId}: </strong> {msg.messageText}
          </p>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}
