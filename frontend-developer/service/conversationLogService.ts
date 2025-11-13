// conversationLogService.ts
import fs from 'fs';
import path from 'path';

// Types for conversation logs
export interface ConversationMessage {
  id: string;
  conversation_id: string;
  query: string;
  answer: string;
  created_at: string;
  message_tokens: number;
  answer_tokens: number;
  provider_response_latency: number;
  from_source: string;
  from_end_user_id?: string;
  from_account_id?: string;
}

export interface Conversation {
  id: string;
  app_id: string;
  name: string;
  status: string;
  from_source: string;
  created_at: string;
  updated_at: string;
  dialogue_count: number;
  messages: ConversationMessage[];
}

export interface ConversationLogFilter {
  app_id?: string;
  from_source?: string;
  start_date?: string;
  end_date?: string;
  user_id?: string;
}

export class ConversationLogService {
  private static readonly LOG_BASE_PATH = path.join(
    process.cwd(),
    'logs',
    'conversations'
  );

  /**
   * Initialize the logs directory structure
   */
  static initializeLogDirectory(): void {
    if (!fs.existsSync(this.LOG_BASE_PATH)) {
      fs.mkdirSync(this.LOG_BASE_PATH, { recursive: true });
    }
  }

  /**
   * Fetch conversations from the Dify API
   */
  static async fetchConversations(
    difyApiUrl: string,
    appId: string,
    apiKey: string,
    filters?: ConversationLogFilter
  ): Promise<Conversation[]> {
    try {
      const url = new URL(`${difyApiUrl}/apps/${appId}/chat-conversations`);
      
      // Add query parameters if filters exist
      if (filters) {
        if (filters.start_date) url.searchParams.append('start', filters.start_date);
        if (filters.end_date) url.searchParams.append('end', filters.end_date);
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch messages for a specific conversation
   */
  static async fetchConversationMessages(
    difyApiUrl: string,
    appId: string,
    conversationId: string,
    apiKey: string
  ): Promise<ConversationMessage[]> {
    try {
      const url = `${difyApiUrl}/apps/${appId}/chat-messages?conversation_id=${conversationId}&limit=100`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save a single conversation log to file
   */
  static async saveConversationLog(
    conversation: Conversation,
    organizationId?: string
  ): Promise<string> {
    this.initializeLogDirectory();

    const date = new Date(conversation.created_at);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Create directory structure: logs/conversations/{org}/{year}/{month}/{day}
    let dirPath = this.LOG_BASE_PATH;
    
    if (organizationId) {
      dirPath = path.join(dirPath, organizationId);
    }
    
    dirPath = path.join(dirPath, String(year), month, day);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Create filename with timestamp and conversation ID
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    const filename = `conversation_${conversation.id}_${timestamp}.json`;
    const filePath = path.join(dirPath, filename);

    // Write the conversation data
    const logData = {
      conversation_id: conversation.id,
      app_id: conversation.app_id,
      name: conversation.name,
      status: conversation.status,
      from_source: conversation.from_source,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      dialogue_count: conversation.dialogue_count,
      messages: conversation.messages,
      logged_at: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(logData, null, 2), 'utf-8');

    return filePath;
  }

  /**
   * Save multiple conversations to logs
   */
  static async saveConversationLogs(
    conversations: Conversation[],
    organizationId?: string
  ): Promise<{
    success: boolean;
    saved_count: number;
    failed_count: number;
    file_paths: string[];
  }> {
    const filePaths: string[] = [];
    let savedCount = 0;
    let failedCount = 0;

    for (const conversation of conversations) {
      try {
        const filePath = await this.saveConversationLog(conversation, organizationId);
        filePaths.push(filePath);
        savedCount++;
      } catch (error) {
        failedCount++;
      }
    }

    return {
      success: failedCount === 0,
      saved_count: savedCount,
      failed_count: failedCount,
      file_paths: filePaths,
    };
  }

  /**
   * Save conversations with full message history
   */
  static async saveConversationsWithMessages(
    difyApiUrl: string,
    appId: string,
    apiKey: string,
    filters?: ConversationLogFilter,
    organizationId?: string
  ): Promise<{
    success: boolean;
    total_conversations: number;
    saved_count: number;
    failed_count: number;
    file_paths: string[];
  }> {
    try {
      // Fetch all conversations
      const conversations = await this.fetchConversations(difyApiUrl, appId, apiKey, filters);

      // Fetch messages for each conversation
      const conversationsWithMessages: Conversation[] = [];

      for (const conversation of conversations) {
        try {
          const messages = await this.fetchConversationMessages(
            difyApiUrl,
            appId,
            conversation.id,
            apiKey
          );

          conversationsWithMessages.push({
            ...conversation,
            messages,
          });
        } catch (error) {
          // Continue with empty messages array
          conversationsWithMessages.push({
            ...conversation,
            messages: [],
          });
        }
      }

      // Save all conversations to log files
      const result = await this.saveConversationLogs(conversationsWithMessages, organizationId);

      return {
        success: result.success,
        total_conversations: conversations.length,
        saved_count: result.saved_count,
        failed_count: result.failed_count,
        file_paths: result.file_paths,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get logs summary
   */
  static getLogsSummary(organizationId?: string): {
    total_files: number;
    total_size_bytes: number;
    directories: string[];
  } {
    this.initializeLogDirectory();

    let basePath = this.LOG_BASE_PATH;
    if (organizationId) {
      basePath = path.join(basePath, organizationId);
    }

    if (!fs.existsSync(basePath)) {
      return {
        total_files: 0,
        total_size_bytes: 0,
        directories: [],
      };
    }

    const directories: string[] = [];
    let totalFiles = 0;
    let totalSize = 0;

    const scanDirectory = (dirPath: string) => {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          directories.push(itemPath);
          scanDirectory(itemPath);
        } else if (stats.isFile() && item.endsWith('.json')) {
          totalFiles++;
          totalSize += stats.size;
        }
      }
    };

    scanDirectory(basePath);

    return {
      total_files: totalFiles,
      total_size_bytes: totalSize,
      directories,
    };
  }

  /**
   * Export logs for a date range
   */
  static async exportLogsForDateRange(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<Conversation[]> {
    this.initializeLogDirectory();

    let basePath = this.LOG_BASE_PATH;
    if (organizationId) {
      basePath = path.join(basePath, organizationId);
    }

    if (!fs.existsSync(basePath)) {
      return [];
    }

    const conversations: Conversation[] = [];

    const scanDirectory = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          scanDirectory(itemPath);
        } else if (stats.isFile() && item.endsWith('.json')) {
          try {
            const content = fs.readFileSync(itemPath, 'utf-8');
            const conversation = JSON.parse(content);

            const conversationDate = new Date(conversation.created_at);
            if (conversationDate >= startDate && conversationDate <= endDate) {
              conversations.push(conversation);
            }
          } catch (error) {
          }
        }
      }
    };

    scanDirectory(basePath);

    return conversations;
  }

  /**
   * Clean old logs (older than specified days)
   */
  static cleanOldLogs(daysToKeep: number, organizationId?: string): {
    deleted_files: number;
    deleted_size_bytes: number;
  } {
    this.initializeLogDirectory();

    let basePath = this.LOG_BASE_PATH;
    if (organizationId) {
      basePath = path.join(basePath, organizationId);
    }

    if (!fs.existsSync(basePath)) {
      return {
        deleted_files: 0,
        deleted_size_bytes: 0,
      };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedFiles = 0;
    let deletedSize = 0;

    const scanAndDelete = (dirPath: string) => {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          scanAndDelete(itemPath);
          // Remove empty directories
          if (fs.readdirSync(itemPath).length === 0) {
            fs.rmdirSync(itemPath);
          }
        } else if (stats.isFile() && item.endsWith('.json')) {
          try {
            const content = fs.readFileSync(itemPath, 'utf-8');
            const conversation = JSON.parse(content);
            const conversationDate = new Date(conversation.created_at);

            if (conversationDate < cutoffDate) {
              deletedSize += stats.size;
              fs.unlinkSync(itemPath);
              deletedFiles++;
            }
          } catch (error) {
          }
        }
      }
    };

    scanAndDelete(basePath);

    return {
      deleted_files: deletedFiles,
      deleted_size_bytes: deletedSize,
    };
  }
}

export default ConversationLogService;

