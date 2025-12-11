
import { createClient, WebDAVClient } from 'webdav';
import { Entry, Tag } from '../types';
import { Capacitor } from '@capacitor/core';

export interface SyncData {
    version: number;
    timestamp: string;
    entries: Entry[];
    tags: Tag[];
}

export class WebDAVService {
    private client: WebDAVClient | null = null;
    private filename = 'zenbullet_backup.json';

    constructor(url?: string, username?: string, password?: string) {
        if (url && username && password) {
            this.client = createClient(this.getProxyUrl(url), {
                username,
                password
            });
        }
    }

    updateConfig(url: string, username: string, password?: string) {
        this.client = createClient(this.getProxyUrl(url), {
            username,
            password
        });
    }

    private getProxyUrl(url: string): string {
        // 在原生平台（Android/iOS）上，CapacitorHttp 会自动处理 CORS，直接使用原始 URL
        if (Capacitor.isNativePlatform()) {
            return url;
        }

        // 在 Web 平台上，使用代理来绑定坚果云请求避免 CORS 问题
        if (url.includes('jianguoyun.com')) {
            return url.replace(/^https?:\/\/dav\.jianguoyun\.com\/dav/, '/api/webdav');
        }
        return url;
    }

    async checkConnection(): Promise<boolean> {
        if (!this.client) return false;
        try {
            await this.client.stat('/');
            return true;
        } catch (error) {
            console.error('WebDAV connection failed:', error);
            return false;
        }
    }

    async uploadData(entries: Entry[], tags: Tag[]): Promise<boolean> {
        if (!this.client) throw new Error('WebDAV client not initialized');

        const data: SyncData = {
            version: 1,
            timestamp: new Date().toISOString(),
            entries,
            tags
        };

        try {
            await this.client.putFileContents(`/${this.filename}`, JSON.stringify(data, null, 2), { overwrite: true });
            return true;
        } catch (error) {
            console.error('WebDAV upload failed:', error);
            throw error;
        }
    }

    async downloadData(): Promise<SyncData | null> {
        if (!this.client) throw new Error('WebDAV client not initialized');

        try {
            // 直接尝试下载，不使用 exists() 因为它使用 PROPFIND 方法在原生平台可能不支持
            const content = await this.client.getFileContents(`/${this.filename}`, { format: 'text' });
            return JSON.parse(content as string);
        } catch (error: any) {
            // 如果是 404 错误（文件不存在），返回 null
            if (error?.response?.status === 404 || error?.status === 404) {
                console.log('WebDAV file not found, returning null');
                return null;
            }
            console.error('WebDAV download failed:', error);
            throw error;
        }
    }
}

export const webdavService = new WebDAVService();
