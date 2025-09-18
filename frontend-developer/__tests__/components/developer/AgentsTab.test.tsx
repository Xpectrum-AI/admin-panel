import React from 'react';
import { render, waitFor } from '../../utils/test-utils';
import AgentsTab from '@/app/components/AgentsTab';

// Mock the services to prevent API calls
jest.mock('@/service/agentConfigService', () => ({
  agentConfigService: {
    getAllAgents: jest.fn().mockResolvedValue({ success: true, data: { agents: {} } }),
    getAgentById: jest.fn().mockResolvedValue({ success: true, data: {} }),
    createAgent: jest.fn().mockResolvedValue({ success: true, data: {} }),
    updateAgent: jest.fn().mockResolvedValue({ success: true, data: {} }),
    deleteAgent: jest.fn().mockResolvedValue({ success: true, data: {} }),
  },
}));

jest.mock('@/service/difyAgentService', () => ({
  difyAgentService: {
    createAgent: jest.fn().mockResolvedValue({ success: true, data: {} }),
    deleteAgent: jest.fn().mockResolvedValue({ success: true, data: {} }),
  },
}));

// Mock the auth context
jest.mock('@propelauth/react', () => ({
  useAuthInfo: () => ({
    user: { orgIdToOrgMemberInfo: {} },
    userClass: { getOrgs: () => [] },
  }),
}));

// Mock the theme context
jest.mock('@/app/contexts/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

describe('AgentsTab', () => {
  it('should render without crashing', async () => {
    // Render the component with a timeout
    const { container } = render(<AgentsTab />);

    // Wait for the component to render with a reasonable timeout
    await waitFor(() => {
      expect(container).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});