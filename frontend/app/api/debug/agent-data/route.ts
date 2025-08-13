import { NextRequest, NextResponse } from 'next/server';
import { agentApiService } from '@/service/agentService';

export async function GET(request: NextRequest) {
  try {

    
    // Fetch both agents and trunks
    const agentsResponse = await agentApiService.getAllAgents();
    const trunksResponse = await agentApiService.getAgentTrunks();
    
    
    
    return NextResponse.json({
      success: true,
      message: 'Agent data structure debug',
      data: {
        agents: agentsResponse,
        trunks: trunksResponse,
        sampleAgent: agentsResponse.agents?.[0] || null,
        sampleTrunk: trunksResponse.data?.trunks?.[0] || null,
        agentsCount: agentsResponse.agents?.length || 0,
        trunksCount: trunksResponse.data?.trunks?.length || 0
      }
    });
  } catch (error) {
    console.error('Agent data debug error:', error);
    return NextResponse.json({
      error: 'Failed to fetch agent data for debugging',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
