"use client";

import React from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import ChatList from '@/components/chats/ChatList';
import ChatWindow from '@/components/chats/ChatWindow';
import LeadDetails from '@/components/chats/LeadDetails';

export default function DesktopChatPage() {
  return (
    <div className="flex bg-[#F8FAFC] h-screen overflow-hidden w-full">
      {/* Sidebar - fixed on left */}
      <div className="w-64 shrink-0 h-full">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header />
        
        {/* Main 3-column layout */}
        <main className="flex-1 overflow-hidden flex bg-white relative">
          <div className="w-full h-full flex mt-0">
            {/* Left Panel */}
            <div className={`h-full block w-auto`}>
              <ChatList />
            </div>

            {/* Center Panel */}
            <div className={`h-full flex-1 min-w-0 flex`}>
              <ChatWindow />
            </div>

            {/* Right Panel */}
            <div className={`h-full block w-auto`}>
              <LeadDetails />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
