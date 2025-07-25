import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PaperAirplaneIcon, DocumentArrowUpIcon, ClipboardDocumentIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { chatAPI, reportAPI } from '../services/api';
import { ChatSession, ChatMessage } from '../types';
import Layout from '../components/Layout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser } from '../contexts/UserContext';
import { useDebounce } from '../hooks';

const Chat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);
  const [showSessionList, setShowSessionList] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [updatingSession, setUpdatingSession] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<number | null>(null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();

  // 从localStorage加载侧边栏状态
  useEffect(() => {
    const savedState = localStorage.getItem('chatSidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // 保存侧边栏状态到localStorage
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('chatSidebarCollapsed', JSON.stringify(newState));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = useCallback(async () => {
    if (isLoadingSessions) return; // 防止重复请求

    setIsLoadingSessions(true);
    try {
      const data = await chatAPI.getSessions();
      setSessions(data);
      if (data.length > 0 && !currentSession) {
        setCurrentSession(data[0]);
      }
    } catch (error) {
      console.error('加载会话失败:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [currentSession, isLoadingSessions]); // 添加 isLoadingSessions 依赖

  useEffect(() => {
    loadSessions();
  }, []); // 只在组件挂载时执行一次

  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id);
    }
  }, [currentSession?.id]); // 只依赖 session ID，避免对象引用变化导致的重复请求

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (sessionId: number) => {
    if (isLoadingMessages) return; // 防止重复请求

    setIsLoadingMessages(true);
    try {
      const data = await chatAPI.getMessages(sessionId);
      setMessages(data);
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const createNewSession = async () => {
    setCreatingSession(true);
    try {
      const newSession = await chatAPI.createSession('新对话');
      setSessions([newSession, ...sessions]);
      setCurrentSession(newSession);
      setMessages([]);
    } catch (error) {
      console.error('创建会话失败:', error);
    } finally {
      setCreatingSession(false);
    }
  };

        const showDeleteConfirm = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发会话选择
    setSessionToDelete(session);
    setShowDeleteModal(true);
  };

  const deleteSession = async () => {
    if (!sessionToDelete) return;

    setDeletingSession(true);
    try {
      console.log('正在删除会话:', sessionToDelete.id);
      await chatAPI.deleteSession(sessionToDelete.id);
      console.log('删除会话成功');

      // 从会话列表中移除
      const updatedSessions = sessions.filter(s => s.id !== sessionToDelete.id);
      setSessions(updatedSessions);

      // 如果删除的是当前会话，清空当前会话
      if (currentSession?.id === sessionToDelete.id) {
        setCurrentSession(null);
        setMessages([]);
      }

      // 关闭弹框
      setShowDeleteModal(false);
      setSessionToDelete(null);
    } catch (error: any) {
      console.error('删除会话失败:', error);
      console.error('错误详情:', error.response?.data);
      alert(`删除会话失败: ${error.response?.data?.detail || error.message || '未知错误'}`);
    } finally {
      setDeletingSession(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSessionToDelete(null);
  };

  const startEditingSession = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发会话选择
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const cancelEditingSession = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const saveSessionTitle = async () => {
    if (!editingSessionId || !editingTitle.trim()) return;

    setUpdatingSession(true);
    try {
      const updatedSession = await chatAPI.updateSession(editingSessionId, editingTitle.trim());

      // 更新会话列表
      setSessions(prev => prev.map(s =>
        s.id === editingSessionId ? updatedSession : s
      ));

      // 如果编辑的是当前会话，也要更新当前会话
      if (currentSession?.id === editingSessionId) {
        setCurrentSession(updatedSession);
      }

      // 退出编辑模式
      setEditingSessionId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('更新会话标题失败:', error);
      alert('更新会话标题失败，请重试');
    } finally {
      setUpdatingSession(false);
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveSessionTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingSession();
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      session_id: currentSession.id,
      role: 'user',
      content: inputMessage,
      message_type: 'text',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(inputMessage, currentSession.id);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        session_id: currentSession.id,
        role: 'assistant',
        content: '抱歉，发送消息时出现错误。',
        message_type: 'text',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('只支持 PDF 和 DOCX 文件');
      return;
    }

    setUploadingReport(true);
    let targetSessionId: number | undefined = currentSession?.id;
    let createdNewSession = false;

    try {
      // 如果没有当前会话，先创建一个新会话
      if (!targetSessionId) {
        const newSession = await chatAPI.createSession('报告分析');
        setSessions([newSession, ...sessions]);
        setCurrentSession(newSession);
        targetSessionId = newSession.id;
        createdNewSession = true;
      }

      // 上传报告到指定的会话
      const newReport = await reportAPI.uploadReport(file, targetSessionId);

      // 重新加载消息以获取完整的对话
      if (newReport.session_id) {
        await loadMessages(newReport.session_id);
        // 如果创建了新会话，重新加载会话列表
        if (createdNewSession) {
          await loadSessions();
        }
      }

    } catch (error) {
      console.error('上传报告失败:', error);
      const errorMessage: ChatMessage = {
        id: Date.now(),
        session_id: targetSessionId || currentSession?.id || 0,
        role: 'assistant',
        content: '抱歉，报告上传失败，请重试。',
        message_type: 'text',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setUploadingReport(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // 复制消息内容到剪贴板
  const copyMessageContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // 显示复制成功提示
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
      // 降级方案：使用传统的复制方法
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      // 显示复制成功提示
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    }
  };

  // 重新生成消息
  const regenerateMessage = async (messageId: number) => {
    setRegeneratingMessageId(messageId);
    try {
      const regeneratedMessage = await chatAPI.regenerateMessage(messageId);

      // 更新消息列表中的对应消息
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? regeneratedMessage : msg
      ));
    } catch (error) {
      console.error('重新生成消息失败:', error);
      alert('重新生成消息失败，请重试');
    } finally {
      setRegeneratingMessageId(null);
    }
  };

    return (
    <Layout fullWidth>
      <div className="absolute inset-0 flex justify-center overflow-hidden" style={{ top: '64px' }}>
        <div className="flex w-full h-full overflow-hidden">
        {/* 会话列表侧边栏 */}
        <div className={`hidden lg:flex bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {!sidebarCollapsed ? (
              // 展开状态：显示完整按钮
              <button
                onClick={createNewSession}
                disabled={creatingSession}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-200 font-medium"
              >
                {creatingSession ? '创建中...' : '新对话'}
              </button>
            ) : (
              // 收起状态：显示图标按钮
              <button
                onClick={createNewSession}
                disabled={creatingSession}
                className="w-full p-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-200 flex items-center justify-center"
                title="新建对话"
              >
                {creatingSession ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setCurrentSession(session)}
                className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group ${
                  currentSession?.id === session.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                } ${sidebarCollapsed ? 'p-2' : 'p-4'}`}
                title={sidebarCollapsed ? session.title : undefined}
              >
                {sidebarCollapsed ? (
                  // 收起状态：只显示图标
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                      </svg>
                    </div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                ) : (
                  // 展开状态：显示完整信息
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {editingSessionId === session.id ? (
                        // 编辑模式
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={handleEditKeyPress}
                            onBlur={saveSessionTitle}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                            disabled={updatingSession}
                          />
                          <button
                            onClick={saveSessionTitle}
                            disabled={updatingSession}
                            className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                            title="保存"
                          >
                            {updatingSession ? (
                              <div className="animate-spin w-3 h-3 border border-green-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={cancelEditingSession}
                            disabled={updatingSession}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            title="取消"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        // 显示模式
                        <div className="flex items-center space-x-2">
                          <h3
                            className="font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                            onClick={(e) => startEditingSession(session, e)}
                            title="点击编辑标题"
                          >
                            {session.title}
                          </h3>
                          <button
                            onClick={(e) => startEditingSession(session, e)}
                            className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
                            title="编辑标题"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => showDeleteConfirm(session, e)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="删除对话"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 侧边栏底部收起/展开按钮 */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-2">
            <button
              onClick={toggleSidebar}
              className={`w-full py-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 flex items-center justify-center ${
                sidebarCollapsed ? 'px-1' : 'px-3'
              }`}
              title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
            >
              {sidebarCollapsed ? (
                // 现代双箭头展开图标
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              ) : (
                <>
                  {/* 现代双箭头收起图标 */}
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-medium">收起</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 主聊天区域 */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 min-h-0">
          {/* 移动端会话列表切换按钮 */}
          <div className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              onClick={() => setShowSessionList(!showSessionList)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>会话列表</span>
            </button>
          </div>



                    {/* 移动端会话列表 */}
          {showSessionList && (
            <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={createNewSession}
                  disabled={creatingSession}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-200 font-medium"
                >
                  {creatingSession ? '创建中...' : '新对话'}
                </button>
              </div>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => {
                    setCurrentSession(session);
                    // 只在移动端关闭会话列表
                    if (window.innerWidth < 1024) {
                      setShowSessionList(false);
                    }
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                    currentSession?.id === session.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {editingSessionId === session.id ? (
                        // 编辑模式
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={handleEditKeyPress}
                            onBlur={saveSessionTitle}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                            disabled={updatingSession}
                          />
                          <button
                            onClick={saveSessionTitle}
                            disabled={updatingSession}
                            className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                            title="保存"
                          >
                            {updatingSession ? (
                              <div className="animate-spin w-3 h-3 border border-green-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={cancelEditingSession}
                            disabled={updatingSession}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                            title="取消"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        // 显示模式
                        <div className="flex items-center space-x-2">
                          <h3
                            className="font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                            onClick={(e) => startEditingSession(session, e)}
                            title="点击编辑标题"
                          >
                            {session.title}
                          </h3>
                          <button
                            onClick={(e) => startEditingSession(session, e)}
                            className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
                            title="编辑标题"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => showDeleteConfirm(session, e)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-600"
                      title="删除对话"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentSession ? (
            <>
              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="w-full space-y-4">
                                                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-start space-x-3`}
                  >
                    {/* AI头像 - 左侧 */}
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                    )}

                    {/* 消息内容 */}
                    <div className="relative group">
                      <div
                        className={`max-w-xs lg:max-w-2xl xl:max-w-4xl px-4 py-3 rounded-2xl shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                // 自定义代码块样式
                                code: ({ node, inline, className, children, ...props }: any) => {
                                  return !inline ? (
                                    <pre className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 overflow-x-auto">
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    </pre>
                                  ) : (
                                    <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                // 自定义链接样式
                                a: ({ node, children, href, ...props }: any) => (
                                  <a
                                    href={href}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    {...props}
                                  >
                                    {children}
                                  </a>
                                ),
                                // 自定义表格样式
                                table: ({ node, children, ...props }: any) => (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                                      {children}
                                    </table>
                                  </div>
                                ),
                                th: ({ node, children, ...props }: any) => (
                                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-700 font-semibold" {...props}>
                                    {children}
                                  </th>
                                ),
                                td: ({ node, children, ...props }: any) => (
                                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2" {...props}>
                                    {children}
                                  </td>
                                ),
                                // 自定义列表样式
                                ul: ({ node, children, ...props }: any) => (
                                  <ul className="list-disc list-inside space-y-1" {...props}>
                                    {children}
                                  </ul>
                                ),
                                ol: ({ node, children, ...props }: any) => (
                                  <ol className="list-decimal list-inside space-y-1" {...props}>
                                    {children}
                                  </ol>
                                ),
                                // 自定义引用样式
                                blockquote: ({ node, children, ...props }: any) => (
                                  <blockquote className="border-l-4 border-blue-500 pl-4 italic bg-blue-50 dark:bg-blue-900/20 py-2" {...props}>
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        )}
                      </div>

                      {/* AI消息的操作按钮 */}
                      {message.role === 'assistant' && (
                        <div className="mt-2 flex space-x-2">
                          <button
                            onClick={() => copyMessageContent(message.content)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
                            title="复制内容"
                          >
                            <ClipboardDocumentIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => regenerateMessage(message.id)}
                            disabled={regeneratingMessageId === message.id}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 disabled:opacity-50"
                            title="重新生成"
                          >
                            {regeneratingMessageId === message.id ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <ArrowPathIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 用户头像 - 右侧 */}
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                        {user?.avatar ? (
                          <img
                            src={`http://localhost:8000/api/users/avatar/${user.avatar.split('/').pop()}`}
                            alt="用户头像"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 输入框 */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                <div className="w-full">
                  <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入您的医疗问题..."
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={loading || uploadingReport}
                  />
                  <button
                    onClick={triggerFileUpload}
                    disabled={loading || uploadingReport}
                    className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
                    title="上传报告"
                  >
                    {uploadingReport ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <DocumentArrowUpIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={loading || uploadingReport || !inputMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-4H6v-2h4V7h2v4h4v2h-4v4z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">欢迎使用医疗AI助手</h3>
                  <p className="text-gray-600 dark:text-gray-300">开始一个新的对话来获取专业的医疗建议</p>
                </div>
              </div>

              {/* 输入框 */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                <div className="w-full">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="输入您的医疗问题..."
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      disabled={loading || uploadingReport}
                    />
                    <button
                      onClick={triggerFileUpload}
                      disabled={loading || uploadingReport}
                      className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
                      title="上传报告"
                    >
                      {uploadingReport ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <DocumentArrowUpIcon className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={loading || uploadingReport || !inputMessage.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept=".pdf,.docx"
        onChange={handleFileInput}
        disabled={uploadingReport}
      />

      {/* 复制成功提示 */}
      {showCopySuccess && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>已复制到剪贴板</span>
          </div>
        </div>
      )}

      {/* 删除确认弹框 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            {/* 弹框头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">删除对话</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">此操作无法撤销</p>
                </div>
              </div>
            </div>

            {/* 弹框内容 */}
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                确定要删除对话 <span className="font-semibold text-gray-900 dark:text-white">"{sessionToDelete?.title}"</span> 吗？
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                删除后，该对话及其所有消息将永久丢失，无法恢复。
              </p>
            </div>

            {/* 弹框底部按钮 */}
            <div className="flex space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={cancelDelete}
                disabled={deletingSession}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={deleteSession}
                disabled={deletingSession}
                className="flex-1 px-4 py-2 text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {deletingSession ? (
                  <>
                    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>删除中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>删除</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Chat;
