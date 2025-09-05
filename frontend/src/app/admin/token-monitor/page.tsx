"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Key, RefreshCw, Trash2, Eye, EyeOff, Copy, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Token {
  id: string;
  name: string;
  token: string;
  type: 'api' | 'access' | 'refresh' | 'session';
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt: string;
  lastUsed: string;
  usageCount: number;
  permissions: string[];
  createdBy: string;
}

const mockTokens: Token[] = [
  {
    id: '1',
    name: 'Mobile App API',
    token: 'hc_sk_live_123456789abcdef...',
    type: 'api',
    status: 'active',
    createdAt: '2024-12-01 09:30:00',
    expiresAt: '2025-06-01 09:30:00',
    lastUsed: '2024-12-19 14:25:30',
    usageCount: 1245,
    permissions: ['read:patients', 'write:records', 'read:appointments'],
    createdBy: 'Dr. John Smith'
  },
  {
    id: '2',
    name: 'Analytics Dashboard',
    token: 'hc_sk_live_987654321fedcba...',
    type: 'api',
    status: 'active',
    createdAt: '2024-11-15 14:20:00',
    expiresAt: '2025-05-15 14:20:00',
    lastUsed: '2024-12-19 13:45:12',
    usageCount: 567,
    permissions: ['read:analytics', 'read:reports'],
    createdBy: 'Admin User'
  },
  {
    id: '3',
    name: 'Legacy Integration',
    token: 'hc_sk_live_old123456789abc...',
    type: 'api',
    status: 'expired',
    createdAt: '2024-06-01 10:00:00',
    expiresAt: '2024-12-01 10:00:00',
    lastUsed: '2024-11-30 23:59:59',
    usageCount: 2891,
    permissions: ['read:all', 'write:all'],
    createdBy: 'System Admin'
  },
  {
    id: '4',
    name: 'Test Environment',
    token: 'hc_sk_test_testtokenhere...',
    type: 'api',
    status: 'revoked',
    createdAt: '2024-12-10 16:45:00',
    expiresAt: '2025-01-10 16:45:00',
    lastUsed: '2024-12-15 11:20:30',
    usageCount: 89,
    permissions: ['read:test', 'write:test'],
    createdBy: 'Developer'
  },
  {
    id: '5',
    name: 'Admin Session',
    token: 'sess_123456789abcdef...',
    type: 'session',
    status: 'active',
    createdAt: '2024-12-19 08:00:00',
    expiresAt: '2024-12-20 08:00:00',
    lastUsed: '2024-12-19 14:30:00',
    usageCount: 45,
    permissions: ['admin:all'],
    createdBy: 'Admin'
  }
];

export default function TokenMonitorPage() {
  const [tokens, setTokens] = useState<Token[]>(mockTokens);
  const [filteredTokens, setFilteredTokens] = useState<Token[]>(mockTokens);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    let filtered = tokens;

    if (searchTerm) {
      filtered = filtered.filter(token =>
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType) {
      filtered = filtered.filter(token => token.type === filterType);
    }

    if (filterStatus) {
      filtered = filtered.filter(token => token.status === filterStatus);
    }

    setFilteredTokens(filtered);
  }, [searchTerm, filterType, filterStatus, tokens]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'expired': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'revoked': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={14} />;
      case 'expired': return <AlertTriangle size={14} />;
      case 'revoked': return <XCircle size={14} />;
      default: return <CheckCircle size={14} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'api': return 'text-blue-600 bg-blue-50';
      case 'access': return 'text-purple-600 bg-purple-50';
      case 'refresh': return 'text-orange-600 bg-orange-50';
      case 'session': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const toggleTokenVisibility = (tokenId: string) => {
    const newVisible = new Set(visibleTokens);
    if (newVisible.has(tokenId)) {
      newVisible.delete(tokenId);
    } else {
      newVisible.add(tokenId);
    }
    setVisibleTokens(newVisible);
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        console.log('Token copied to clipboard');
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        console.log('Token copied to clipboard (fallback method)');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Show user-friendly message
      alert('ไม่สามารถคัดลอกได้ กรุณาคัดลอกด้วยตนเอง');
    }
  };

  const revokeToken = (tokenId: string) => {
    setTokens(prev => prev.map(token =>
      token.id === tokenId ? { ...token, status: 'revoked' as const } : token
    ));
  };

  const deleteToken = (tokenId: string) => {
    setTokens(prev => prev.filter(token => token.id !== tokenId));
  };

  const maskToken = (token: string) => {
    return `${token.substring(0, 12)}...${token.substring(token.length - 4)}`;
  };

  const activeTokensCount = tokens.filter(t => t.status === 'active').length;
  const expiredTokensCount = tokens.filter(t => t.status === 'expired').length;
  const revokedTokensCount = tokens.filter(t => t.status === 'revoked').length;
  const totalUsage = tokens.reduce((sum, t) => sum + t.usageCount, 0);

  return (
    <div className="w-full h-full bg-gray-50 p-2 lg:p-4 overflow-auto">
      {/* Header */}
      <div className="mb-4 lg:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="text-blue-600" />
              Token Monitor
            </h1>
            <p className="text-gray-600 mt-2">Manage API keys, access tokens and sessions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus size={16} />
            Create Token
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6 min-w-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tokens</p>
              <p className="text-2xl font-bold text-green-600">{activeTokensCount}</p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-yellow-600">{expiredTokensCount}</p>
            </div>
            <AlertTriangle className="text-yellow-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revoked</p>
              <p className="text-2xl font-bold text-red-600">{revokedTokensCount}</p>
            </div>
            <XCircle className="text-red-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usage</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsage.toLocaleString()}</p>
            </div>
            <Key className="text-blue-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 lg:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 min-w-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="api">API Token</option>
            <option value="access">Access Token</option>
            <option value="refresh">Refresh Token</option>
            <option value="session">Session Token</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('');
              setFilterStatus('');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Tokens Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 lg:mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token Value
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTokens.map((token) => (
                <tr key={token.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{token.name}</div>
                      <div className="text-sm text-gray-500">by {token.createdBy}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(token.type)}`}>
                      {token.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                        {visibleTokens.has(token.id) ? token.token : maskToken(token.token)}
                      </code>
                      <button
                        onClick={() => toggleTokenVisibility(token.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {visibleTokens.has(token.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(token.token)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(token.status)}`}>
                      {getStatusIcon(token.status)}
                      {token.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{token.usageCount.toLocaleString()} calls</div>
                    <div className="text-xs text-gray-500">Last: {token.lastUsed}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{token.expiresAt}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {token.status === 'active' && (
                        <button
                          onClick={() => revokeToken(token.id)}
                          className="text-yellow-600 hover:text-yellow-900 transition-colors"
                          title="Revoke Token"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteToken(token.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete Token"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTokens.length === 0 && (
          <div className="text-center py-12">
            <Key className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tokens found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Security Recommendations & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Security Recommendations */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-2">Security Recommendations</h3>
              <ul className="text-yellow-800 space-y-1 text-sm">
                <li>• Regularly rotate API keys and access tokens</li>
                <li>• Remove unused or expired tokens immediately</li>
                <li>• Monitor token usage for suspicious activity</li>
                <li>• Use least privilege principle when assigning permissions</li>
                <li>• Enable two-factor authentication for token creation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Recent Token Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Token Activity</h3>
          <div className="space-y-3">
            {tokens.slice(0, 5).map(token => (
              <div key={token.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="text-gray-400" size={16} />
                  <div>
                    <div className="font-medium text-gray-900">{token.name}</div>
                    <div className="text-sm text-gray-500">Last used: {token.lastUsed}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">{token.usageCount} calls</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
