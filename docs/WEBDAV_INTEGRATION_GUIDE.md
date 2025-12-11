# WebDAV 集成实现指南

本文档总结了在前端应用中集成 WebDAV 同步功能的完整实现方案，特别关注跨域请求(CORS)问题的解决。

## 目录
- [概述](#概述)
- [技术栈](#技术栈)
- [CORS 问题与解决方案](#cors-问题与解决方案)
- [实现步骤](#实现步骤)
- [代码示例](#代码示例)
- [常见问题](#常见问题)

## 概述

WebDAV (Web Distributed Authoring and Versioning) 是一个允许客户端对 Web 服务器上的内容进行读写操作的协议。在前端应用中，我们使用 WebDAV 实现数据的跨设备同步。

### 核心挑战
1. **CORS 跨域限制**：浏览器安全策略阻止直接向 WebDAV 服务器发起跨域请求
2. **认证处理**：WebDAV 需要 Basic Auth，浏览器可能会拦截认证头
3. **双向同步**：需要处理本地与云端数据的冲突

## 技术栈

- **WebDAV 客户端库**: `webdav` (npm package)
- **开发代理**: Vite proxy
- **生产代理**: Vercel rewrites
- **状态管理**: React Context API

## CORS 问题与解决方案

### 问题描述
直接从浏览器向 WebDAV 服务器（如坚果云 `dav.jianguoyun.com`）发起请求时，会遇到：
```
Access to fetch at 'https://dav.jianguoyun.com/...' from origin 'https://your-app.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

### 解决方案：分环境代理

#### 1. 开发环境代理 (Vite)

**文件**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api/webdav': {
        target: 'https://dav.jianguoyun.com/dav',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/webdav/, ''),
        secure: false,
        // 保留认证头
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Vite 会自动转发 Authorization header
          });
        }
      }
    }
  }
});
```

**工作原理**:
- 本地请求 `http://localhost:5173/api/webdav/path/to/file.json`
- Vite 代理将请求转发到 `https://dav.jianguoyun.com/dav/path/to/file.json`
- 浏览器认为这是同源请求，不会触发 CORS 检查

#### 2. 生产环境代理 (Vercel)

**文件**: `vercel.json` (项目根目录)

```json
{
  "rewrites": [
    {
      "source": "/api/webdav/:path*",
      "destination": "https://dav.jianguoyun.com/dav/:path*"
    }
  ]
}
```

**工作原理**:
- 生产请求 `https://your-app.vercel.app/api/webdav/path/to/file.json`
- Vercel Edge Network 将请求重写到 `https://dav.jianguoyun.com/dav/path/to/file.json`
- 请求从服务器端发起，绕过浏览器 CORS 限制

**注意事项**:
- `vercel.json` 必须放在项目根目录
- 部署后立即生效，无需额外配置
- 支持动态路径参数 (`:path*`)

## 实现步骤

### 步骤 1: 安装依赖

```bash
npm install webdav
```

### 步骤 2: 创建 WebDAV Service

**文件**: `services/WebDAVService.ts`

```typescript
import { createClient, WebDAVClient } from 'webdav';

export interface SyncData {
  entries: any[];
  tags: any[];
}

class WebDAVService {
  private client: WebDAVClient | null = null;
  private config = { url: '', username: '', password: '' };

  updateConfig(url: string, username: string, password: string) {
    this.config = { url, username, password };
    this.client = createClient(this.getProxyUrl(url), {
      username,
      password,
    });
  }

  /**
   * 关键方法：URL 代理转换
   * 将 WebDAV 服务器 URL 转换为代理 URL
   */
  private getProxyUrl(url: string): string {
    // 对于坚果云等服务，统一使用代理路径
    if (url.includes('jianguoyun.com')) {
      return url.replace(/^https?:\/\/dav\.jianguoyun\.com\/dav/, '/api/webdav');
    }
    return url;
  }

  async checkConnection(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.getDirectoryContents('/');
      return true;
    } catch {
      return false;
    }
  }

  async uploadData(entries: any[], tags: any[]): Promise<void> {
    if (!this.client || !this.config.url) throw new Error('Not configured');
    
    const data: SyncData = { entries, tags };
    const filePath = `${this.config.url}/zenbullet_backup.json`;
    const proxyPath = this.getProxyUrl(filePath);

    await this.client.putFileContents(
      proxyPath,
      JSON.stringify(data, null, 2),
      { overwrite: true }
    );
  }

  async downloadData(): Promise<SyncData | null> {
    if (!this.client || !this.config.url) throw new Error('Not configured');
    
    const filePath = `${this.config.url}/zenbullet_backup.json`;
    const proxyPath = this.getProxyUrl(filePath);

    try {
      const exists = await this.client.exists(proxyPath);
      if (!exists) return null;

      const content = await this.client.getFileContents(proxyPath, {
        format: 'text',
      });
      return JSON.parse(content as string) as SyncData;
    } catch (err) {
      console.error('Download error:', err);
      return null;
    }
  }
}

export const webdavService = new WebDAVService();
```

**关键点**:
1. `getProxyUrl` 方法统一处理 URL 转换
2. 在开发和生产环境都使用 `/api/webdav` 前缀
3. 保留原始 URL 用于配置存储

### 步骤 3: 创建 Sync Context

**文件**: `contexts/SyncContext.tsx`

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { webdavService, SyncData } from '../services/WebDAVService';

interface SyncContextType {
  isSyncing: boolean;
  sync: () => Promise<void>;
  upload: () => Promise<void>;
  download: () => Promise<void>;
  updateConfig: (url: string, username: string, password?: string) => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [config, setConfig] = useState({ url: '', username: '' });

  const updateConfig = useCallback((url: string, username: string, password?: string) => {
    localStorage.setItem('webdav_config', JSON.stringify({ url, username, password }));
    setConfig({ url, username });
    if (password) {
      webdavService.updateConfig(url, username, password);
    }
  }, []);

  const upload = useCallback(async () => {
    if (!config.url) {
      alert('WebDAV not configured');
      return;
    }
    setIsSyncing(true);
    try {
      // 获取本地数据
      const entries = JSON.parse(localStorage.getItem('entries') || '[]');
      const tags = JSON.parse(localStorage.getItem('tags') || '[]');
      
      await webdavService.uploadData(entries, tags);
      console.log('Upload success: Local data uploaded to cloud');
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [config.url]);

  const download = useCallback(async () => {
    if (!config.url) {
      alert('WebDAV not configured');
      return;
    }
    setIsSyncing(true);
    try {
      const remoteData = await webdavService.downloadData();
      if (remoteData) {
        // 合并数据（简单示例，实际需要冲突解决）
        localStorage.setItem('entries', JSON.stringify(remoteData.entries));
        localStorage.setItem('tags', JSON.stringify(remoteData.tags));
        console.log('Download success: Cloud data merged into local');
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [config.url]);

  const sync = useCallback(async () => {
    if (!config.url) return; // 静默返回，避免自动同步时的错误提示
    
    setIsSyncing(true);
    try {
      // 1. 下载云端数据
      const remoteData = await webdavService.downloadData();
      
      // 2. 合并数据
      const localEntries = JSON.parse(localStorage.getItem('entries') || '[]');
      const mergedEntries = remoteData 
        ? mergeByTimestamp(localEntries, remoteData.entries)
        : localEntries;
      
      // 3. 上传合并后的数据
      await webdavService.uploadData(mergedEntries, []);
      
      console.log('Sync completed');
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [config.url]);

  return (
    <SyncContext.Provider value={{ isSyncing, sync, upload, download, updateConfig }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSyncContext must be used within SyncProvider');
  return context;
};

// 辅助函数：基于时间戳合并数据
function mergeByTimestamp(local: any[], remote: any[]): any[] {
  const map = new Map();
  local.forEach(item => map.set(item.id, item));
  remote.forEach(item => {
    const existing = map.get(item.id);
    if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}
```

### 步骤 4: UI 集成

```tsx
import { useSyncContext } from './contexts/SyncContext';
import { RefreshCw } from 'lucide-react';

export function SyncButton() {
  const { sync, isSyncing } = useSyncContext();

  return (
    <button
      onClick={sync}
      disabled={isSyncing}
      className={`p-2 rounded-full transition-colors ${
        isSyncing ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
      }`}
      title="Quick Sync"
    >
      <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
    </button>
  );
}
```

## 常见问题

### 1. 403 Forbidden 错误

**问题**: PROPFIND 请求返回 403

**可能原因**:
- WebDAV 服务器未正确配置访问权限
- 目录不存在
- 认证信息错误

**解决方案**:
```typescript
// 在上传前确保目录存在
async ensureDirectory(path: string) {
  try {
    await this.client.createDirectory(path);
  } catch (err) {
    // 目录可能已存在，忽略错误
  }
}
```

### 2. 认证头丢失

**问题**: 请求到达 WebDAV 服务器时没有 Authorization header

**解决方案**:
确保代理配置正确转发认证头。Vite 和 Vercel 默认会保留这些头，但某些中间件可能会过滤。

```typescript
// 如果使用自定义代理，确保转发认证头
headers: {
  'Authorization': 'Basic ' + btoa(`${username}:${password}`)
}
```

### 3. OPTIONS 预检请求失败

**问题**: CORS 预检请求 (OPTIONS) 失败

**解决方案**:
使用代理方案会完全避免这个问题，因为请求从同源发起。

### 4. 开发环境正常，生产环境失败

**检查清单**:
- [ ] `vercel.json` 在项目根目录
- [ ] `vercel.json` 已提交到 Git
- [ ] 重新部署后问题仍然存在
- [ ] 检查浏览器 Network 面板，确认请求路径是 `/api/webdav/...`

### 5. 坚果云特定问题

坚果云 WebDAV 配置：
- URL: `https://dav.jianguoyun.com/dav/` (注意结尾斜杠)
- 用户名: 注册邮箱
- 密码: 在坚果云网页端生成的应用密码（**不是登录密码**）

## 最佳实践

### 1. 错误处理
```typescript
try {
  await sync();
} catch (err) {
  if (err.response?.status === 401) {
    console.error('Authentication failed');
  } else if (err.response?.status === 403) {
    console.error('Access denied');
  } else {
    console.error('Sync failed:', err);
  }
}
```
 
### 2. 冲突解决策略
- **Last-Write-Wins**: 使用时间戳，最新的数据覆盖旧数据
- **Manual Merge**: 提供 UI 让用户选择保留哪个版本
- **Three-Way Merge**: 记录上次同步状态，智能合并双方修改

### 3. 用户体验
- 自动同步：应用启动时静默同步，失败不提示
- 手动同步：明确告知用户操作结果（上传/下载/已是最新）
- 加载状态：使用旋转动画指示同步进行中

### 4. 安全性
- 密码加密存储（如使用 Web Crypto API）
- 使用 HTTPS
- 不在代码中硬编码凭证
- 提供"清除配置"功能

## 调试技巧

### 1. 查看代理是否生效

**开发环境**:
```bash
# 打开浏览器开发者工具 -> Network
# 筛选 "webdav"
# 检查请求 URL 是否为 http://localhost:5173/api/webdav/...
```

**生产环境**:
```bash
# 检查请求 URL 是否为 https://your-app.vercel.app/api/webdav/...
# 如果直接请求 https://dav.jianguoyun.com，说明代理未生效
```

### 2. 测试 WebDAV 连接

使用 curl 测试：
```bash
curl -X PROPFIND \
  -u "your-email:your-app-password" \
  https://dav.jianguoyun.com/dav/
```

### 3. 验证代理配置

**Vercel 部署时检查**:
```bash
# 确认 vercel.json 包含在部署中
vercel inspect your-deployment-url
```

## 总结

WebDAV 同步的核心挑战是 CORS，通过在开发和生产环境分别配置代理，可以完美解决这个问题。关键要点：

1. **统一代理路径**: 开发和生产都使用 `/api/webdav`
2. **URL 转换**: 在 Service 层统一处理 URL 到代理路径的映射
3. **配置文件**: `vite.config.ts` 和 `vercel.json` 缺一不可
4. **错误处理**: 区分自动同步（静默）和手动同步（明确提示）
5. **用户反馈**: 清晰告知每次同步的具体动作（上传/下载）

参考资料：
- [WebDAV npm package](https://www.npmjs.com/package/webdav)
- [Vite Proxy Configuration](https://vitejs.dev/config/server-options.html#server-proxy)
- [Vercel Rewrites](https://vercel.com/docs/projects/project-configuration#rewrites)
