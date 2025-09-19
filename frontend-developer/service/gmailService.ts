// Gmail Service

// Shared API utility functions
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_LIVE_API_URL || 'https://d25b4i9wbz6f8t.cloudfront.net';
};

// Generic API request function
const makeApiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  // Get API key from environment
  const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

export interface GmailAccount {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  assignedAgent?: string;
  lastSync?: string;
  messageCount: number;
  unreadCount: number;
}

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  isRead: boolean;
  isImportant: boolean;
  labels: string[];
  threadId: string;
}



export interface GmailAssignment {
  id: string;
  emailId: string;
  agentId: string;
  agentName: string;
  assignedAt: string;
  status: 'assigned' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface AgentMapping {
  email_address: string;
  agent_url: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface AgentMappingsResponse {
  status: string;
  mappings: AgentMapping[];
  count: number;
  timestamp: string;
}

export interface ConversationMapping {
  // Add properties based on the API response structure
  // Since the response shows empty mappings, we'll define a basic structure
  id?: string;
  email_address?: string;
  conversation_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConversationMappingsResponse {
  status: string;
  mappings: ConversationMapping[];
  count: number;
  timestamp: string;
}

export interface WebhookTestRequest {
  from: string;
  to: string;
  subject: string;
  email: string;
}

export interface WebhookTestResponse {
  status: string;
  message: string;
  timestamp: string;
  email_info: {
    from: string;
    to: string;
    subject: string;
    sender_ip: string | null;
    spf: string | null;
    dkim: string | null;
    has_parsed_content: boolean;
    attachment_count: number;
    inline_attachment_count: number;
    ai_response_generated: boolean;
    automated_response_sent: boolean;
  };
}

// Mock data for development
export const mockGmailAccounts: GmailAccount[] = [
  {
    id: '1',
    email: 'support@company.com',
    name: 'Support Team',
    status: 'active',
    assignedAgent: 'agent-1',
    lastSync: '2024-01-15T10:30:00Z',
    messageCount: 45,
    unreadCount: 3
  },
  {
    id: '2',
    email: 'sales@company.com',
    name: 'Sales Team',
    status: 'active',
    assignedAgent: 'agent-2',
    lastSync: '2024-01-15T09:15:00Z',
    messageCount: 23,
    unreadCount: 1
  },
  {
    id: '3',
    email: 'info@company.com',
    name: 'Info Team',
    status: 'pending',
    lastSync: '2024-01-14T16:45:00Z',
    messageCount: 12,
    unreadCount: 0
  }
];

export const mockGmailMessages: GmailMessage[] = [
  {
    id: 'msg-1',
    subject: 'Customer Support Request',
    from: 'customer@example.com',
    to: 'support@company.com',
    date: '2024-01-15T10:30:00Z',
    snippet: 'I need help with my account setup...',
    isRead: false,
    isImportant: true,
    labels: ['inbox', 'support'],
    threadId: 'thread-1'
  },
  {
    id: 'msg-2',
    subject: 'New Sales Inquiry',
    from: 'prospect@company.com',
    to: 'sales@company.com',
    date: '2024-01-15T09:15:00Z',
    snippet: 'Interested in your premium package...',
    isRead: true,
    isImportant: false,
    labels: ['inbox', 'sales'],
    threadId: 'thread-2'
  },
  {
    id: 'msg-3',
    subject: 'General Information Request',
    from: 'info@example.com',
    to: 'info@company.com',
    date: '2024-01-14T16:45:00Z',
    snippet: 'Can you provide more details about...',
    isRead: true,
    isImportant: false,
    labels: ['inbox'],
    threadId: 'thread-3'
  }
];

export const mockAssignments: GmailAssignment[] = [
  {
    id: 'assign-1',
    emailId: 'msg-1',
    agentId: 'agent-1',
    agentName: 'AI Support Agent',
    assignedAt: '2024-01-15T10:35:00Z',
    status: 'in_progress',
    priority: 'high'
  },
  {
    id: 'assign-2',
    emailId: 'msg-2',
    agentId: 'agent-2',
    agentName: 'AI Sales Agent',
    assignedAt: '2024-01-15T09:20:00Z',
    status: 'completed',
    priority: 'medium'
  }
];

// Gmail Service Functions
export class GmailService {
  // Get all Gmail accounts (using agent mappings)
  static async getGmailAccounts(): Promise<AgentMappingsResponse> {
    const mappingsData = await makeApiRequest('/mail/agent-mappings');
    return mappingsData;
  }





  // Get available agents for assignment
  static async getAvailableAgents(): Promise<Array<{id: string, name: string, status: string}>> {
    try {
      // Get agents from existing agent mappings
      const mappingsData = await makeApiRequest('/mail/agent-mappings');
      return mappingsData.mappings.map((mapping: AgentMapping, index: number) => ({
        id: mapping.email_address,
        name: mapping.description.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        status: 'active'
      }));
    } catch (error) {
      console.error('Failed to fetch available agents:', error);
      // Fallback to mock agents for development
      return [
        { id: 'agent-1', name: 'AI Support Agent', status: 'active' },
        { id: 'agent-2', name: 'AI Sales Agent', status: 'active' },
        { id: 'agent-3', name: 'AI General Agent', status: 'active' }
      ];
    }
  }

  // Get agent mappings
  static async getAgentMappings(): Promise<AgentMappingsResponse> {
    const data = await makeApiRequest('/mail/agent-mappings');
    return data;
  }

  // Create agent mapping (original function)
  static async createAgentMapping(
    emailAddress: string,
    agentUrl: string,
    apiKey: string,
    description: string
  ): Promise<{status: string, message: string, timestamp: string}> {
    const params = new URLSearchParams({
      email_address: emailAddress,
      agent_url: agentUrl,
      api_key: apiKey,
      description: description
    });
    
    const data = await makeApiRequest(`/mail/agent-mapping?${params.toString()}`, {
      method: 'POST'
    });
    return data;
  }

  // Create agent mapping using curl-style request (query parameters)
  static async createAgentMappingCurl(
    emailAddress: string,
    apiKey: string,
    description: string
  ): Promise<{status: string, message: string, timestamp: string}> {
    const baseUrl = getApiBaseUrl();
    const liveApiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';
    const chatbotApiKey = apiKey;
    const agentUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL;
    
    // Create query parameters
    const params = new URLSearchParams({
      email_address: emailAddress,
      agent_url: agentUrl || '',
      api_key: chatbotApiKey,
      description: description
    });
    
    const url = `${baseUrl}/mail/agent-mapping?${params.toString()}`;
    
    console.log('🚀 Creating Gmail agent mapping (curl-style):', {
      emailAddress,
      agentUrl,
      description,
      usingChatbotApiKey: chatbotApiKey.substring(0, 10) + '...',
      fullUrl: url
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': liveApiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 Gmail agent mapping error response:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Gmail agent mapping created successfully:', {
        status: data.status,
        message: data.message,
        timestamp: data.timestamp,
        fullResponse: data
      });
      return data;
    } catch (error) {
      console.error('❌ Failed to create Gmail agent mapping:', error);
      throw error;
    }
  }

  // Get conversation mappings
  static async getConversationMappings(): Promise<ConversationMappingsResponse> {
    const data = await makeApiRequest('/mail/conversation-mappings');
    return data;
  }

  // Get conversations via webhook
  static async getConversationsViaWebhook(): Promise<WebhookTestResponse> {
    const data = await makeApiRequest('/mail/webhook/conversations', {
      method: 'GET'
    });
    return data;
  }

  // Send message via webhook
  static async sendMessageViaWebhook(message: WebhookTestRequest): Promise<WebhookTestResponse> {
    const data = await makeApiRequest('/mail/webhook/send', {
      method: 'POST',
      body: JSON.stringify(message)
    });
    return data;
  }

  // Unassign email agent
  static async unassignEmailAgent(emailAddress: string): Promise<{ success: boolean; message: string }> {
    console.log('🚀 Unassigning Gmail email agent:', { emailAddress });

    try {
      const result = await makeApiRequest(`/mail/unassign-email-agent/${encodeURIComponent(emailAddress)}`, {
        method: 'DELETE'
      });
      
      console.log('✅ Gmail email agent unassigned successfully:', result);
      return {
        success: true,
        message: result.message || 'Gmail email agent unassigned successfully!'
      };
    } catch (error) {
      console.error('❌ Failed to unassign Gmail email agent:', error);
      throw error;
    }
  }
}

