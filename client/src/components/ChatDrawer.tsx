import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import type { Message, Conversation, User } from '../types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: User | null;
  bookingId?: string | null;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  targetUser,
  bookingId,
}) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        setConversations(res.data.data.conversations);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !targetUser?._id) return;

    const initiateTargetConversation = async () => {
      try {
        setIsLoadingMessages(true);
        const res = await api.post('/chat/conversations', {
          recipientId: targetUser._id,
          bookingId: bookingId || undefined,
        });
        if (res.data.success) {
          const conv = res.data.data.conversation;
          setActiveConversation(conv);
          loadMessages(conv._id);
        }
      } catch (err) {
        console.error('Failed to start conversation', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    initiateTargetConversation();
  }, [isOpen, targetUser?._id, bookingId]);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    } else {
      setActiveConversation(null);
      setMessages([]);
    }
  }, [isOpen]);

  const loadMessages = async (convId: string) => {
    try {
      setIsLoadingMessages(true);
      const res = await api.get(`/chat/conversations/${convId}/messages`);
      if (res.data.success) {
        setMessages(res.data.data.messages);
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!socket || !activeConversation?._id) return;

    socket.emit('join_conversation', { conversationId: activeConversation._id });

    const handleNewMessage = (newMsg: Message) => {
      if (newMsg.conversationId === activeConversation._id) {
        setMessages((prev) => [...prev, newMsg]);
      }
      loadConversations();
    };

    const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId === activeConversation._id && data.userId !== user?._id) {
        setIsOtherTyping(data.isTyping);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);

    return () => {
      socket.emit('leave_conversation', { conversationId: activeConversation._id });
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
    };
  }, [socket, activeConversation?._id, user?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping]);

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (socket && activeConversation) {
      socket.emit('typing', {
        conversationId: activeConversation._id,
        isTyping: true,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          conversationId: activeConversation._id,
          isTyping: false,
        });
      }, 1500);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation || !socket) return;

    const recipient = activeConversation.participants.find((p) => p._id !== user?._id);
    if (!recipient) return;

    socket.emit('send_message', {
      conversationId: activeConversation._id,
      recipientId: recipient._id,
      text: inputText.trim(),
    });

    setInputText('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', {
      conversationId: activeConversation._id,
      isTyping: false,
    });
  };

  if (!isOpen) return null;

  const currentRecipient = activeConversation?.participants.find((p) => p._id !== user?._id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                  isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                title={isConnected ? 'Connected' : 'Disconnected'}
              />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">
                {activeConversation && currentRecipient
                  ? currentRecipient.name
                  : 'Messages'}
              </h3>
              <p className="text-xs text-slate-400 capitalize">
                {activeConversation && currentRecipient
                  ? `${currentRecipient.role} • ${isConnected ? 'Online' : 'Offline'}`
                  : 'Recent Conversations'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        {activeConversation ? (
          /* Active Chat View */
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
            {/* Conversation Switcher Header */}
            <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setActiveConversation(null)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                &larr; All Conversations
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {isLoadingMessages ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender._id === user?._id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <img
                          src={msg.sender.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                          alt={msg.sender.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      )}
                      <div
                        className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm shadow-sm ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        <p className="break-words">{msg.text}</p>
                        <span
                          className={`block text-[10px] mt-1 text-right ${
                            isMe ? 'text-indigo-200' : 'text-slate-400'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {isOtherTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span>{currentRecipient?.name} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={handleTypingChange}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* Conversation List View */
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoadingConversations ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No conversations found. Explore professionals to start chatting!
              </div>
            ) : (
              conversations.map((conv) => {
                const partner = conv.participants.find((p) => p._id !== user?._id);
                return (
                  <button
                    key={conv._id}
                    onClick={() => {
                      setActiveConversation(conv);
                      loadMessages(conv._id);
                    }}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition flex items-center gap-3 bg-white shadow-xs"
                  >
                    <img
                      src={partner?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'}
                      alt={partner?.name}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-medium text-sm text-slate-900 truncate">
                          {partner?.name || 'User'}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(conv.updatedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.lastMessage?.text || 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};