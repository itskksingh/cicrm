"use client";

import DesktopChatPage from "@/components/chats/DesktopChatPage";
import MobileChatPage from "@/components/chats/MobileChatPage";
import { ChatProvider } from "@/components/chats/ChatContext";

export default function ChatsPage() {
  return (
    <ChatProvider>
      <div className="hidden lg:block">
        <DesktopChatPage />
      </div>

      <div className="block lg:hidden">
        <MobileChatPage />
      </div>
    </ChatProvider>
  );
}
