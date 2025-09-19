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
    console.log('🔍 DEBUG: Testing dashboard stats for organization:', organizationInfo);
    
    // Test agents API
    console.log('🔍 Testing agents API...');
    try {
      const agentsResult = await this.getAgentsCount(organizationInfo);
      console.log('🔍 Agents count result:', agentsResult);
    } catch (error) {
      console.error('🔍 Agents API error:', error);
    }
    
    // Test phone numbers API
    console.log('🔍 Testing phone numbers API...');
    try {
      const phoneResult = await this.getPhoneNumbersCount(organizationInfo.orgId);
      console.log('🔍 Phone numbers count result:', phoneResult);
    } catch (error) {
      console.error('🔍 Phone numbers API error:', error);
    }
    
    // Test WhatsApp API
    console.log('🔍 Testing WhatsApp API...');
    try {
      const whatsappResult = await this.getWhatsAppNumbersCount();
      console.log('🔍 WhatsApp count result:', whatsappResult);
    } catch (error) {
      console.error('🔍 WhatsApp API error:', error);
    }
    
    // Test Gmail API
    console.log('🔍 Testing Gmail API...');
    try {
      const gmailResult = await this.getEmailsCount();
      console.log('🔍 Gmail count result:', gmailResult);
    } catch (error) {
      console.error('🔍 Gmail API error:', error);
    }
  }

  /**
   * Get all dashboard statistics for the organization
   */
  static async getDashboardStats(organizationInfo: OrganizationInfo): Promise<DashboardStatsResponse> {
    try {
      console.log('🚀 Fetching dashboard statistics for organization:', organizationInfo);

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

      console.log('✅ Dashboard statistics fetched successfully:', stats);

      return {
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Error fetching dashboard statistics:', error);
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
      console.log('🔍 Fetching agents count for organization:', organizationInfo);
      
      // Try with organization name first (as that's what the AgentsTab uses)
      const orgName = organizationInfo.orgName || organizationInfo.orgId;
      let result = await agentConfigService.getAllAgents(orgName);
      console.log('🔍 Agents result with name:', result);
      
      // If that fails, try with organization ID
      if (!result.success || !result.data || result.data.length === 0) {
        console.log('🔍 Trying with organization ID instead...');
        result = await agentConfigService.getAllAgents(organizationInfo.orgId);
        console.log('🔍 Agents result with ID fallback:', result);
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
            console.log('❌ Agents data is not in expected array format:', agentsData);
            return 0;
          }
        }
        
        console.log('✅ Found agents:', agentsData.length);
        return agentsData.length;
      }
      console.log('❌ No agents found or API failed:', result.message);
      return 0;
    } catch (error) {
      console.error('❌ Error fetching agents count:', error);
      return 0;
    }
  }

  /**
   * Get phone numbers count for the organization
   */
  private static async getPhoneNumbersCount(organizationId: string): Promise<number> {
    try {
      console.log('🔍 Fetching phone numbers count for organization:', organizationId);
      
      // Use the SMS service which we know works with the correct endpoint
      const { SMSService } = await import('./smsService');
      const result = await SMSService.getAllPhoneNumbers();
      
      console.log('🔍 Phone numbers API response:', result);
      
      if (result.success && result.data) {
        // Handle different response formats
        if (Array.isArray(result.data)) {
          console.log('✅ Found phone numbers (array format):', result.data.length);
          return result.data.length;
        } else if (result.data.phone_numbers && Array.isArray(result.data.phone_numbers)) {
          console.log('✅ Found phone numbers (nested format):', result.data.phone_numbers.length);
          return result.data.phone_numbers.length;
        } else if (result.data.count !== undefined) {
          console.log('✅ Found phone numbers (count format):', result.data.count);
          return result.data.count;
        }
      }
      
      console.log('❌ No phone numbers found in API response');
      return 0;
    } catch (error) {
      console.error('❌ Error fetching phone numbers count:', error);
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
      console.error('Error fetching WhatsApp numbers count:', error);
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
      console.error('Error fetching emails count:', error);
      return 0;
    }
  }
}

export default DashboardService;
