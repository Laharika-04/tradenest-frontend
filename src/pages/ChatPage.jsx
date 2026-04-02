import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Send, ArrowLeft, Package, RefreshCw } from 'lucide-react'
import { messagesAPI } from '../api'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const POLL_MS = 5000

export default function ChatPage() {
  const { user } = useAuth()
  const [convs,    setConvs]    = useState([])
  const [selected, setSelected] = useState(null)
  const [msgs,     setMsgs]     = useState([])
  const [input,    setInput]    = useState('')
  const [loadC,    setLoadC]    = useState(true)
  const [loadM,    setLoadM]    = useState(false)
  const [sending,  setSending]  = useState(false)
  const bottomRef = useRef(null)
  const pollRef   = useRef(null)
  const inputRef  = useRef(null)

  const loadConvs = useCallback(() => {
    messagesAPI.getConversations()
      .then(r => setConvs(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadC(false))
  }, [])

  useEffect(() => { loadConvs() }, [loadConvs])

  const loadMsgs = useCallback((id, silent = false) => {
    if (!id) return
    if (!silent) setLoadM(true)
    messagesAPI.getMessages(id)
      .then(r => {
        setMsgs(r.data.data || [])
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
      })
      .catch(() => {})
      .finally(() => { if (!silent) setLoadM(false) })
  }, [])

  useEffect(() => {
    clearInterval(pollRef.current)
    if (!selected) return
    loadMsgs(selected.id)
    pollRef.current = setInterval(() => loadMsgs(selected.id, true), POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [selected, loadMsgs])

  const selectConv = conv => {
    setSelected(conv)
    setMsgs([])
    messagesAPI.markRead(conv.id).catch(() => {})
  }

  const handleSend = async e => {
    e.preventDefault()
    const content = input.trim()
    if (!content || !selected || sending) return
    setInput('')
    setSending(true)
    try {
      const res = await messagesAPI.sendMessage(selected.id, { content })
      setMsgs(prev => [...prev, res.data.data])
      setConvs(prev => prev.map(c =>
        c.id === selected.id ? { ...c, lastMessage: content } : c
      ))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {
      toast.error('Message failed')
      setInput(content)
    } finally { setSending(false); inputRef.current?.focus() }
  }

  // ✅ FIX: use real names from ConversationDto instead of generic "Seller"/"Buyer"
  const getOtherName = (conv) => {
    if (!conv || !user) return 'User'
    return conv.buyerId === user.id ? conv.sellerName : conv.buyerName
  }

  const av = name =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=f97316&color=fff&size=40&bold=true`

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <MessageCircle size={20} className="text-blue-600" />
        </div>
        <h1 className="font-black text-2xl text-slate-900">Messages</h1>
        <button onClick={loadConvs} className="ml-auto btn-ghost p-2" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="card overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: 520 }}>
        <div className="flex h-full">

          {/* Conversation list */}
          <div className={`w-full md:w-72 border-r border-slate-100 flex flex-col shrink-0 ${selected ? 'hidden md:flex' : 'flex'}`}>
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadC ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-3 w-24 rounded" />
                        <div className="skeleton h-3 w-full rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : convs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <MessageCircle size={36} className="text-slate-200 mb-3" />
                  <p className="text-sm font-bold text-slate-500">No conversations</p>
                  <p className="text-xs text-slate-400 mt-1">Start a chat from any product page</p>
                </div>
              ) : (
                convs.map(conv => {
                  const otherName = getOtherName(conv)
                  return (
                    <button key={conv.id} onClick={() => selectConv(conv)}
                      className={`w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                        selected?.id === conv.id ? 'bg-orange-50 border-l-2 border-l-orange-500' : ''
                      }`}>
                      <img src={av(otherName)} alt="" className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0">
                        {/* ✅ FIX: real name shown here */}
                        <p className="text-sm font-bold text-slate-800">{otherName}</p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                          <Package size={9} />
                          {/* ✅ FIX: show product title instead of just ID */}
                          {conv.productTitle || `Listing #${conv.productId}`}
                        </p>
                        {conv.lastMessage && (
                          <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Message pane */}
          <div className={`flex-1 flex flex-col min-w-0 ${!selected ? 'hidden md:flex' : 'flex'}`}>
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <MessageCircle size={28} className="text-slate-400" />
                </div>
                <p className="font-bold text-slate-600">Select a conversation</p>
                <p className="text-sm text-slate-400 mt-1">Choose from the left panel</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
                  <button onClick={() => setSelected(null)} className="md:hidden btn-ghost p-1.5">
                    <ArrowLeft size={18} />
                  </button>
                  <img src={av(getOtherName(selected))} alt="" className="w-9 h-9 rounded-full" />
                  <div>
                    {/* ✅ FIX: real name in header */}
                    <p className="font-bold text-slate-800 text-sm">{getOtherName(selected)}</p>
                    <Link to={`/product/${selected.productId}`}
                      className="text-xs text-orange-500 hover:underline flex items-center gap-1">
                      <Package size={10} />
                      {/* ✅ FIX: product title in header link */}
                      {selected.productTitle || `Listing #${selected.productId}`}
                    </Link>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {loadM ? (
                    <div className="flex justify-center py-8">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : msgs.length === 0 ? (
                    <div className="text-center py-10 text-sm text-slate-400">
                      No messages yet — say hi! 👋
                    </div>
                  ) : (
                    msgs.map(msg => {
                      const isMe = msg.senderId === user?.id
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-orange-500 text-white rounded-br-md'
                              : 'bg-white text-slate-800 rounded-bl-md border border-slate-100'
                          }`}>
                            <p>{msg.content}</p>
                            {msg.sentAt && (
                              <p className={`text-[10px] mt-1 ${isMe ? 'text-orange-200' : 'text-slate-400'}`}>
                                {formatDistanceToNow(new Date(msg.sentAt), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 input py-2.5"
                    disabled={sending}
                    autoFocus
                  />
                  <button type="submit" disabled={!input.trim() || sending}
                    className="btn-primary px-4 py-2.5 disabled:opacity-50">
                    {sending
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Send size={15} />}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}