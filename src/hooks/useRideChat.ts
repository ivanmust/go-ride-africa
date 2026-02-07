import { useState, useEffect, useCallback } from "react";
import { usePassengerAuth } from "@/apps/passenger/auth/PassengerAuthContext";
import { api } from "@/shared";

interface Message {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_type: "passenger" | "driver";
  message: string;
  is_read: boolean;
  created_at: string;
}

interface UseRideChatOptions {
  rideId: string | null;
  enabled?: boolean;
}

const POLL_INTERVAL_MS = 3000;

export const useRideChat = ({ rideId, enabled = true }: UseRideChatOptions) => {
  const { user } = usePassengerAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMessages = useCallback(async () => {
    if (!rideId || !enabled) return;
    setIsLoading(true);
    try {
      const { data, error } = await api.get<Message[]>(`/ride-messages?ride_id=${encodeURIComponent(rideId)}`);
      if (error) throw new Error(error.message);
      const typedMessages = (data || []).map((msg) => ({
        ...msg,
        sender_type: msg.sender_type as "passenger" | "driver",
      }));
      setMessages(typedMessages);
      const unread = typedMessages.filter((m) => !m.is_read && m.sender_id !== user?.id).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [rideId, enabled, user?.id]);

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!rideId || !user?.id || !messageText.trim()) return false;
      setIsSending(true);
      try {
        const { error } = await api.post("/ride-messages", {
          ride_id: rideId,
          message: messageText.trim(),
          sender_type: "passenger",
        });
        if (error) throw new Error(error.message);
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [rideId, user?.id]
  );

  const markAsRead = useCallback(async () => {
    if (!rideId || !user?.id) return;
    const unreadMessageIds = messages
      .filter((m) => !m.is_read && m.sender_id !== user.id)
      .map((m) => m.id);
    if (unreadMessageIds.length === 0) return;
    try {
      await api.patch("/ride-messages/mark-read", { ride_id: rideId });
      setMessages((prev) =>
        prev.map((m) => (unreadMessageIds.includes(m.id) ? { ...m, is_read: true } : m))
      );
      setUnreadCount(0);
    } catch (e) {
      console.error("Error marking messages as read:", e);
    }
  }, [rideId, user?.id, messages]);

  useEffect(() => {
    if (!rideId || !enabled) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [rideId, enabled, fetchMessages]);

  return {
    messages,
    isLoading,
    isSending,
    unreadCount,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
};
