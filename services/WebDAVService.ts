
import { createClient, WebDAVClient } from 'webdav';
import { Entry, Tag } from '../types';

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
        // Use the proxy path for all Jianguoyun requests to avoid CORS issues
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
            // Check if file exists
            const exists = await this.client.exists(`/${this.filename}`);
            if (!exists) return null;

            const content = await this.client.getFileContents(`/${this.filename}`, { format: 'text' });
            return JSON.parse(content as string);
        } catch (error) {
            console.error('WebDAV download failed:', error);
            throw error;
        }
    }
}

export const webdavService = new WebDAVService();
