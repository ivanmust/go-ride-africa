import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

export const useRideChat = ({ rideId, enabled = true }: UseRideChatOptions) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch existing messages
  const fetchMessages = useCallback(async () => {
    if (!rideId || !enabled) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ride_messages")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as "passenger" | "driver"
      }));
      
      setMessages(typedMessages);
      
      // Count unread messages not from the current user
      const unread = typedMessages.filter(
        (m) => !m.is_read && m.sender_id !== user?.id
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [rideId, enabled, user?.id]);

  // Send a new message
  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!rideId || !user?.id || !messageText.trim()) return false;

      setIsSending(true);
      try {
        const { error } = await supabase.from("ride_messages").insert({
          ride_id: rideId,
          sender_id: user.id,
          sender_type: "passenger",
          message: messageText.trim(),
        });

        if (error) throw error;
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

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!rideId || !user?.id) return;

    const unreadMessageIds = messages
      .filter((m) => !m.is_read && m.sender_id !== user.id)
      .map((m) => m.id);

    if (unreadMessageIds.length === 0) return;

    try {
      await supabase
        .from("ride_messages")
        .update({ is_read: true })
        .in("id", unreadMessageIds);

      setMessages((prev) =>
        prev.map((m) =>
          unreadMessageIds.includes(m.id) ? { ...m, is_read: true } : m
        )
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [rideId, user?.id, messages]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!rideId || !enabled) return;

    fetchMessages();

    const channel = supabase
      .channel(`ride-chat-${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ride_messages",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const newMessage = {
            ...payload.new,
            sender_type: payload.new.sender_type as "passenger" | "driver"
          } as Message;
          
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });

          // Update unread count if message is from someone else
          if (newMessage.sender_id !== user?.id) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId, enabled, fetchMessages, user?.id]);

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
