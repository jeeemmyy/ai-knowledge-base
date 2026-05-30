'use client';
import { use } from 'react';
import { ConversationSidebar } from '@/components/chat/conversation-sidebar';
import { ChatThread } from '@/components/chat/chat-thread';

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="flex h-full">
      <ConversationSidebar activeId={id} />
      <div className="flex-1 overflow-hidden">
        <ChatThread conversationId={id} />
      </div>
    </div>
  );
}
