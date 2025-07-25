import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import { userAPI } from '../services/api';
import { UserSettings } from '../types';

interface AIModel {
  id: string;
  name: string;
  description: string;
  base_url: string | null;
}

// 弹框组件
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  message: string;
}> = ({ isOpen, onClose, type, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              type === 'success'
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {type === 'success' ? (
                <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                type === 'success'
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-red-900 dark:text-red-100'
              }`}>
                {type === 'success' ? '保存成功' : '保存失败'}
              </h3>
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{message}</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    message: ''
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [settingsData, modelsData] = await Promise.all([
        userAPI.getSettings(),
        userAPI.getAvailableModels()
      ]);
      console.log('Settings data:', settingsData);
      console.log('Available models:', modelsData.models);
      setSettings(settingsData);
      setAvailableModels(modelsData.models);
    } catch (error) {
      console.error('加载设置失败:', error);
      setModal({
        isOpen: true,
        type: 'error',
        message: '加载设置失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);

    try {
      // 发送完整的settings对象
      await userAPI.updateSettings(settings);
      setModal({
        isOpen: true,
        type: 'success',
        message: '设置保存成功！您的AI模型配置已更新。'
      });
    } catch (error) {
      console.error('保存设置失败:', error);
      setModal({
        isOpen: true,
        type: 'error',
        message: '保存设置失败，请检查网络连接后重试。'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    if (!settings) return;

    if (key === 'preferred_model') {
      setSettings({ ...settings, preferred_model: value });
    } else if (key.startsWith('api_keys.')) {
      const apiKey = key.split('.')[1];
      setSettings({
        ...settings,
        api_keys: { ...settings.api_keys, [apiKey]: value }
      });
    } else if (key.startsWith('base_urls.')) {
      const baseUrl = key.split('.')[1];
      setSettings({
        ...settings,
        base_urls: { ...settings.base_urls, [baseUrl]: value }
      });
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
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

  if (!settings) {
    return (
      <Layout fullWidth>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-red-500 dark:text-red-400">加载设置失败</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout fullWidth>
      <div className="py-2">
        <div className="w-full max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-8">
              {/* 标题 */}
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Cog6ToothIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    AI 模型设置
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    配置您偏好的AI模型和API密钥
                  </p>
                </div>
              </div>

              {/* 消息提示 */}
              {/* The inline message display is removed as per the edit hint. */}

              <div className="space-y-8">
                {/* 配置状态概览 */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                    配置状态概览
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {availableModels.map((model) => {
                      const hasApiKey = settings.api_keys[model.id as keyof typeof settings.api_keys];
                      const isSelected = settings.preferred_model === model.id;

                      return (
                        <div key={model.id} className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            hasApiKey ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <span className={`text-xs ${
                            isSelected ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {model.name}: {hasApiKey ? '已配置' : '未配置'}
                            {isSelected && ' (当前)'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 首选模型选择 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    首选AI模型
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableModels.map((model) => {
                      const isSelected = settings.preferred_model === model.id;
                      const hasApiKey = settings.api_keys[model.id as keyof typeof settings.api_keys];

                      return (
                        <div
                          key={model.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors duration-200 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                          onClick={() => updateSetting('preferred_model', model.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                  {model.name}
                                </h5>
                                {isSelected && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                                    当前选择
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                {model.description}
                              </p>
                              <div className="flex items-center space-x-2">
                                {hasApiKey ? (
                                  <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400">
                                    <CheckIcon className="w-3 h-3 mr-1" />
                                    已配置API密钥
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center text-xs text-orange-600 dark:text-orange-400">
                                    ⚠️ 需要配置API密钥
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckIcon className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* API密钥配置 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    API密钥配置 ({availableModels.length} 个模型)
                  </h4>
                  <div className="space-y-4">
                    {availableModels.map((model) => {
                      const hasApiKey = settings.api_keys[model.id as keyof typeof settings.api_keys];
                      const hasCustomBaseUrl = model.base_url && model.base_url !== null;
                      const baseUrlValue = settings.base_urls[model.id as keyof typeof settings.base_urls] || model.base_url || '';

                      return (
                        <div key={model.id} className={`p-4 rounded-lg border-2 ${
                          hasApiKey
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">
                              {model.name} ({model.id})
                            </h5>
                            <div className="flex items-center space-x-2">
                              {hasApiKey && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                  <CheckIcon className="w-3 h-3 mr-1" />
                                  已配置
                                </span>
                              )}
                              {!hasApiKey && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                  未配置
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            {/* API密钥输入框 */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                API密钥
                              </label>
                              <input
                                type="password"
                                value={hasApiKey || ''}
                                onChange={(e) => updateSetting(`api_keys.${model.id}`, e.target.value)}
                                placeholder={`输入${model.name}的API密钥`}
                                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  hasApiKey
                                    ? 'border-green-300 dark:border-green-700'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}
                              />
                              {hasApiKey && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  已配置密钥: {maskApiKey(hasApiKey)}
                                </p>
                              )}
                            </div>

                            {/* 基础URL输入框 */}
                            {hasCustomBaseUrl && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  API基础URL
                                </label>
                                <input
                                  type="url"
                                  value={baseUrlValue}
                                  onChange={(e) => updateSetting(`base_urls.${model.id}`, e.target.value)}
                                  placeholder="API基础URL"
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {baseUrlValue && baseUrlValue !== model.base_url && (
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    使用自定义URL: {baseUrlValue}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 保存按钮 */}
                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>保存中...</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        <span>保存设置</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        message={modal.message}
      />
    </Layout>
  );
};

export default Settings;
