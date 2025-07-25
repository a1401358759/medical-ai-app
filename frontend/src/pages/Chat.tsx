import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PaperAirplaneIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { chatAPI, reportAPI, userAPI } from '../services/api';
import { ChatSession, ChatMessage, User } from '../types';
import Layout from '../components/Layout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [user, setUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = useCallback(async () => {
    try {
      const data = await chatAPI.getSessions();
      setSessions(data);
      if (data.length > 0 && !currentSession) {
        setCurrentSession(data[0]);
      }
    } catch (error) {
      console.error('加载会话失败:', error);
    }
  }, [currentSession]);

  useEffect(() => {
    loadSessions();
    loadUserProfile();
  }, [loadSessions]);

  const loadUserProfile = async () => {
    try {
      const userData = await userAPI.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  };

  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id);
    }
  }, [currentSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (sessionId: number) => {
    try {
      const data = await chatAPI.getMessages(sessionId);
      setMessages(data);
    } catch (error) {
      console.error('加载消息失败:', error);
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

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
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
        role: 'assistant',
        content: '抱歉，发送消息时出现错误。',
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
    try {
      const newReport = await reportAPI.uploadReport(file);

      // 将报告信息作为消息发送到聊天中
      const reportMessage: ChatMessage = {
        id: Date.now(),
        role: 'user',
        content: `上传了医疗报告：${newReport.filename}`,
        created_at: new Date().toISOString(),
      };

      const analysisMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `报告分析完成！\n\n**报告内容摘要：**\n${newReport.content.substring(0, 200)}...\n\n**AI 分析结果：**\n${newReport.analysis}`,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, reportMessage, analysisMessage]);

    } catch (error) {
      console.error('上传报告失败:', error);
      const errorMessage: ChatMessage = {
        id: Date.now(),
        role: 'assistant',
        content: '抱歉，报告上传失败，请重试。',
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

    return (
    <Layout fullWidth>
      <div className="absolute inset-0 flex justify-center overflow-hidden" style={{ top: '64px' }}>
        <div className="flex w-full h-full overflow-hidden">
        {/* 会话列表侧边栏 */}
        <div className="hidden lg:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={createNewSession}
              disabled={creatingSession}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-200 font-medium"
            >
              {creatingSession ? '创建中...' : '新对话'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setCurrentSession(session)}
                                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 group ${
                      currentSession?.id === session.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                    }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{session.title}</h3>
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
              </div>
            ))}
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
                    setShowSessionList(false);
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                    currentSession?.id === session.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{session.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
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
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
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
                                  const match = /language-(\w+)/.exec(className || '');
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
