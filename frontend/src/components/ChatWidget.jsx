import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axiosInstance from '../utils/axiosInstance'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot } from 'lucide-react'

/**
 * Render chat message text with clickable links.
 * Handles:
 *   - Markdown links:  [label](url)  — url can be absolute or /api/... relative
 *   - Bare https:// URLs
 *   - Relative /api/ paths (converted to absolute using window.location.origin)
 */
function MessageContent({ text }) {
  // Normalise a URL: if it starts with /api/ make it absolute
  const normalise = (url) =>
    url.startsWith('/') ? `${window.location.origin}${url}` : url

  const parts = []
  let cursor = 0

  // Match markdown links [label](url) OR bare https:// URLs OR /api/ paths
  const COMBINED = /\[([^\]]+)\]\(((?:https?:\/\/|\/api\/)[^)]+)\)|(https?:\/\/[^\s,;'"<>()[\]]+)|(\/api\/[^\s,;'"<>()[\]]+)/g
  let match

  while ((match = COMBINED.exec(text)) !== null) {
    // Text before this match
    if (cursor < match.index) {
      parts.push(<span key={`t${cursor}`}>{text.slice(cursor, match.index)}</span>)
    }

    if (match[1] !== undefined) {
      // Markdown link: [label](url)
      const href = normalise(match[2])
      parts.push(
        <a key={match.index} href={href} target="_blank" rel="noopener noreferrer"
           className="underline underline-offset-2 break-all hover:opacity-80 transition-opacity">
          {match[1]}
        </a>
      )
    } else if (match[3] !== undefined) {
      // Bare https:// URL
      parts.push(
        <a key={match.index} href={match[3]} target="_blank" rel="noopener noreferrer"
           className="underline underline-offset-2 break-all hover:opacity-80 transition-opacity">
          {match[3]}
        </a>
      )
    } else if (match[4] !== undefined) {
      // Relative /api/ path
      const href = normalise(match[4])
      parts.push(
        <a key={match.index} href={href} target="_blank" rel="noopener noreferrer"
           className="underline underline-offset-2 break-all hover:opacity-80 transition-opacity">
          {match[4]}
        </a>
      )
    }

    cursor = match.index + match[0].length
  }

  // Remaining text after last match
  if (cursor < text.length) {
    parts.push(<span key={`t${cursor}`}>{text.slice(cursor)}</span>)
  }

  return <>{parts}</>
}

export default function ChatWidget() {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: "Hi! I'm here to answer questions about Sanket's skills, projects, and experience. What would you like to know?",
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-scroll the message list to the bottom whenever messages change or typing status updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [isOpen])

  /**
   * Handles user submission, clears input, sets typing state, and posts to /api/chatbot.
   */
  const sendMessage = async () => {
    const trimmedMessage = inputValue.trim()
    if (!trimmedMessage || isTyping) return

    // 1. Append user's message to messages list
    const updatedMessages = [
      ...messages,
      { role: 'user', content: trimmedMessage },
    ]
    setMessages(updatedMessages)

    // 2. Clear input & set typing indicator
    setInputValue('')
    setIsTyping(true)

    try {
      // Map conversation history excluding the initial greeting message
      const conversationHistory = messages.slice(1).map((msg) => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        content: msg.content,
      }))

      // POST to /api/chatbot via axios
      const response = await axiosInstance.post('/chatbot', {
        message: trimmedMessage,
        conversationHistory,
      })

      // On success: append bot reply
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: response.data.reply },
      ])
    } catch (error) {
      // On error: append bot message using server's error if present, else fallback
      const errorMessage =
        error.response?.data?.error ||
        'Something went wrong — please try again in a moment.'

      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: errorMessage },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage()
  }

  if (!mounted) return null

  return createPortal(
    <>
      {/* 1) Trigger Button - Fixed viewport anchor across all sections and pages */}
      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto">
        <div className={`relative ${!isOpen ? 'chat-btn-floating' : ''}`}>
          {/* Nebula Glow Aura */}
          {!isOpen && <div className="nebula-glow-aura" />}

          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className={`relative z-10 w-14 h-14 rounded-full bg-[#0d0d12] hover:bg-[#161622] text-white shadow-2xl flex items-center justify-center cursor-pointer group border border-purple-400/40 overflow-hidden transition-all duration-200 ${
              !isOpen
                ? 'nebula-btn-glow chat-btn-shine hover:scale-105 active:scale-95'
                : 'hover:scale-105 active:scale-95'
            }`}
            aria-label={isOpen ? 'Close chat' : 'Open AI chat'}
            title={isOpen ? 'Close chat' : 'Chat with AI Assistant'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.div
                  key="close-icon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="chat-icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <MessageCircle className="w-6 h-6 text-purple-100 group-hover:text-white transition-colors" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* 2) Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-4 sm:right-6 z-[9999] w-[calc(100vw-2rem)] sm:w-[360px] h-[500px] max-h-[70vh] bg-white rounded-3xl border border-gray-200/80 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">
                    Ask about Sanket
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    AI assistant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message List Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user'
                return (
                  <div
                    key={index}
                    className={
                      isUser
                        ? 'self-end ml-auto bg-black text-white rounded-2xl rounded-br-sm max-w-[80%] text-sm p-3 leading-relaxed shadow-sm'
                        : 'self-start bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm max-w-[80%] text-sm p-3 leading-relaxed'
                    }
                  >
                    <MessageContent text={msg.content} />
                  </div>
                )
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="self-start bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 w-fit">
                  <motion.span
                    className="w-2 h-2 rounded-full bg-gray-400"
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6,
                      ease: 'easeInOut',
                      delay: 0,
                    }}
                  />
                  <motion.span
                    className="w-2 h-2 rounded-full bg-gray-400"
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6,
                      ease: 'easeInOut',
                      delay: 0.15,
                    }}
                  />
                  <motion.span
                    className="w-2 h-2 rounded-full bg-gray-400"
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6,
                      ease: 'easeInOut',
                      delay: 0.3,
                    }}
                  />
                </div>
              )}

              {/* Ref anchor for auto-scroll */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSubmit}
              className="p-3 border-t border-gray-100 flex items-center gap-2 bg-white"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all placeholder:text-gray-400 text-gray-900"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer shadow-sm"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  )
}

