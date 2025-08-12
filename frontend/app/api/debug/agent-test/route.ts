import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const LIVE_API_BASE_URL = process.env.LIVE_API_URL || '';
const LIVE_API_KEY = process.env.LIVE_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug Agent API Test');
    console.log('LIVE_API_BASE_URL:', LIVE_API_BASE_URL);
    console.log('LIVE_API_KEY:', LIVE_API_KEY ? 'SET' : 'NOT SET');

    // Test the trunks endpoint
    const trunksResponse = await axios.get(`${LIVE_API_BASE_URL}/agents/trunks`, {
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    // Test the all agents endpoint
    const agentsResponse = await axios.get(`${LIVE_API_BASE_URL}/agents/all`, {
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Agent API connection test successful',
      data: {
        trunks: trunksResponse.data,
        agents: agentsResponse.data,
        config: {
          liveApiUrl: LIVE_API_BASE_URL,
          apiKeySet: !!LIVE_API_KEY
        }
      }
    });
  } catch (error) {
    console.error('Agent API test error:', error);
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: 'Agent API connection failed',
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        }
      }, { status: 500 });
    }
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
