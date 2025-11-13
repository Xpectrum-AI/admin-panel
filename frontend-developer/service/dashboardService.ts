// Dashboard Service for fetching organization statistics

import { agentConfigService } from './agentConfigService';
import { WhatsAppService } from './whatsappService';
import { GmailService } from './gmailService';

export interface DashboardStats {
  totalAgents: number;
  totalPhoneNumbers: number;
  totalWhatsAppNumbers: number;
  totalEmails: number;
}

export interface DashboardStatsResponse {
  success: boolean;
  data?: DashboardStats;
  message: string;
}

export interface OrganizationInfo {
  orgId: string;
  orgName?: string;
}

export class DashboardService {
  /**
   * Debug function to test individual API calls
   */
  static async debugDashboardStats(organizationInfo: OrganizationInfo): Promise<void> {
    // Test agents API
    try {
      const agentsResult = await this.getAgentsCount(organizationInfo);
    } catch (error) {
    }
    
    // Test phone numbers API
    try {
      const phoneResult = await this.getPhoneNumbersCount(organizationInfo.orgId);
    } catch (error) {
    }
    
    // Test WhatsApp API
    try {
      const whatsappResult = await this.getWhatsAppNumbersCount();
    } catch (error) {
    }
    
    // Test Gmail API
    try {
      const gmailResult = await this.getEmailsCount();
    } catch (error) {
    }
  }

  /**
   * Get all dashboard statistics for the organization
   */
  static async getDashboardStats(organizationInfo: OrganizationInfo): Promise<DashboardStatsResponse> {
    try {
      // Fetch all statistics in parallel
      const [agentsResult, phoneNumbersResult, whatsappResult, gmailResult] = await Promise.allSettled([
        this.getAgentsCount(organizationInfo),
        this.getPhoneNumbersCount(organizationInfo.orgId),
        this.getWhatsAppNumbersCount(),
        this.getEmailsCount()
      ]);

      // Extract counts from results
      const totalAgents = agentsResult.status === 'fulfilled' ? agentsResult.value : 0;
      const totalPhoneNumbers = phoneNumbersResult.status === 'fulfilled' ? phoneNumbersResult.value : 0;
      const totalWhatsAppNumbers = whatsappResult.status === 'fulfilled' ? whatsappResult.value : 0;
      const totalEmails = gmailResult.status === 'fulfilled' ? gmailResult.value : 0;

      const stats: DashboardStats = {
        totalAgents,
        totalPhoneNumbers,
        totalWhatsAppNumbers,
        totalEmails
      };
      return {
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch dashboard statistics'
      };
    }
  }

  /**
   * Get agents count for the organization
   */
  private static async getAgentsCount(organizationInfo: OrganizationInfo): Promise<number> {
    try {
      // Try with organization name first (as that's what the AgentsTab uses)
      const orgName = organizationInfo.orgName || organizationInfo.orgId;
      let result = await agentConfigService.getAllAgents(orgName);
      // If that fails, try with organization ID
      if (!result.success || !result.data || result.data.length === 0) {
        result = await agentConfigService.getAllAgents(organizationInfo.orgId);
      }
      
      if (result.success && result.data) {
        // Handle different response formats
        let agentsData: any = result.data;
        
        if (!Array.isArray(agentsData)) {
          if (agentsData.agents && Array.isArray(agentsData.agents)) {
            agentsData = agentsData.agents;
          } else if (agentsData.data && Array.isArray(agentsData.data)) {
            agentsData = agentsData.data;
          } else {
            return 0;
          }
        }
        return agentsData.length;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get phone numbers count for the organization
   */
  private static async getPhoneNumbersCount(organizationId: string): Promise<number> {
    try {
      // Use the SMS service which we know works with the correct endpoint
      const { SMSService } = await import('./smsService');
      const result = await SMSService.getAllPhoneNumbers();
      if (result.success && result.data) {
        // Handle different response formats
        if (Array.isArray(result.data)) {
return result.data.length;
        } else if (result.data.phone_numbers && Array.isArray(result.data.phone_numbers)) {
return result.data.phone_numbers.length;
        } else if (result.data.count !== undefined) {
return result.data.count;
        }
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get WhatsApp numbers count
   */
  private static async getWhatsAppNumbersCount(): Promise<number> {
    try {
      const result = await WhatsAppService.getWhatsAppEnabledPhoneNumbers();
      if (result.success && result.data) {
        return result.data.total_count || 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get emails count (Gmail accounts)
   */
  private static async getEmailsCount(): Promise<number> {
    try {
      const result = await GmailService.getGmailAccounts();
      if (result.mappings && Array.isArray(result.mappings)) {
        return result.mappings.length;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }
}

export default DashboardService;
