'use client';
import { ConversationSidebar } from '@/components/chat/conversation-sidebar';
import { ChatThread } from '@/components/chat/chat-thread';

/** New chat — no conversation selected yet. */
export default function ChatPage() {
  return (
    <div className="flex h-full">
      <ConversationSidebar activeId={null} />
      <div className="flex-1 overflow-hidden">
        <ChatThread conversationId={null} />
      </div>
    </div>
  );
}
