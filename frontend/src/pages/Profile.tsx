import React, { useState, useEffect, useRef } from 'react';
import { userAPI } from '../services/api';
import { User } from '../types';
import Layout from '../components/Layout';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userAPI.getProfile();
      setUser(data);
    } catch (error) {
      console.error('加载用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('文件大小不能超过5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      await userAPI.uploadAvatar(file);
      // 重新加载用户信息
      await loadProfile();
    } catch (error) {
      console.error('头像上传失败:', error);
      alert('头像上传失败');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <Layout fullWidth>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-gray-500 dark:text-gray-400">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout fullWidth>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-red-500 dark:text-red-400">加载用户信息失败</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullWidth>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-8">
              <div className="flex items-center space-x-4 mb-8">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={`http://localhost:8000/api/users/avatar/${user.avatar.split('/').pop()}`}
                        alt="用户头像"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    )}
                  </div>
                  <button
                    onClick={triggerFileUpload}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
                    title="更换头像"
                  >
                    {uploadingAvatar ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    个人资料
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    查看和管理您的账户信息
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    用户名
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span className="text-gray-900 dark:text-white font-medium">{user.username}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    姓名
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span className="text-gray-900 dark:text-white font-medium">{user.full_name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    邮箱
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span className="text-gray-900 dark:text-white font-medium">{user.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    账户状态
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      user.is_active
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      {user.is_active ? '活跃' : '非活跃'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    注册时间
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <span className="text-gray-900 dark:text-white font-medium">
                      {new Date(user.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept="image/*"
        onChange={handleAvatarUpload}
        disabled={uploadingAvatar}
      />
    </Layout>
  );
};

export default Profile;
