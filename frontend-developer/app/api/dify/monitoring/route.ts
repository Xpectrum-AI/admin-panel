import { NextRequest, NextResponse } from 'next/server';

const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || '';
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || '';
const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || '';

async function getAuthToken() {
  const loginResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });

  if (!loginResponse.ok) {
    throw new Error('Failed to authenticate');
  }

  const loginData = await loginResponse.json();
  return loginData.data?.access_token || loginData.access_token;
}

async function findAppIdByApiKey(token: string, apiKey: string): Promise<string | null> {
  const response = await fetch(`${CONSOLE_ORIGIN}/console/api/apps?page=1&limit=100`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': WS_ID,
    }
  });

  if (!response.ok) throw new Error('Failed to fetch apps');

  const data = await response.json();
  const apps = data.data || [];

  for (const app of apps) {
    try {
      const keysResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/apps/${app.id}/api-keys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Workspace-Id': WS_ID,
        }
      });

      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        const keys = keysData.data || [];
        const matchingKey = keys.find((k: any) => (k.api_key || k.key || k.token) === apiKey);
        if (matchingKey) return app.id;
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, period = 7 } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const token = await getAuthToken();
    const appId = await findAppIdByApiKey(token, apiKey);

    if (!appId) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // Use current date/time
    const now = new Date();
    
    // TEMPORARY FIX: If system date is in 2025 but conversations are in 2024, use 2024 dates
    let endDate = new Date(now);
    let startDate = new Date(now);
    
    // First, let's check when conversations were actually created
    console.log('🔍 Checking actual conversation dates...');
    try {
      const convsResponse = await fetch(
        `${CONSOLE_ORIGIN}/console/api/apps/${appId}/chat-conversations?page=1&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Workspace-Id': WS_ID,
          }
        }
      );
      
      if (convsResponse.ok) {
        const convsData = await convsResponse.json();
        const conversations = convsData.data || [];
        if (conversations.length > 0) {
          const dates = conversations.map((c: any) => new Date(c.created_at * 1000));
          const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));
          const newestDate = new Date(Math.max(...dates.map(d => d.getTime())));
          
          console.log('📅 Conversation date range:');
          console.log('  - Oldest:', oldestDate.toISOString());
          console.log('  - Newest:', newestDate.toISOString());
          
          // Use actual conversation dates (extend by 1 day on each side for safety)
          startDate = new Date(oldestDate);
          startDate.setDate(startDate.getDate() - 1);
          endDate = new Date(newestDate);
          endDate.setDate(endDate.getDate() + 1);
          
          console.log('✅ Using actual conversation date range for monitoring');
        } else {
          console.log('⚠️ No conversations found, using default date range');
          startDate.setDate(startDate.getDate() - period);
        }
      }
    } catch (error) {
      console.error('⚠️ Could not fetch conversation dates, using default range:', error);
      startDate.setDate(startDate.getDate() - period);
    }
    
    console.log('📅 Date calculation:');
    console.log('  - Current date:', now.toISOString());
    console.log('  - Current year:', now.getFullYear());
    console.log('  - Start date (raw):', startDate.toISOString());
    console.log('  - End date (raw):', endDate.toISOString());
    
    // WARNING: Check if system date is correct!
    if (now.getFullYear() > 2024) {
      console.warn('⚠️ WARNING: System date appears to be in the future!');
      console.warn('⚠️ If conversations were created in 2024, no data will be found!');
    }
    
    // Format dates as Dify expects: YYYY-MM-DD HH:MM (use 23:59 for end date)
    const formatDate = (date: Date, isEnd = false) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const time = isEnd ? '23:59' : '00:00';
      return `${year}-${month}-${day} ${time}`;
    };
    
    const start = formatDate(startDate, false);
    const end = formatDate(endDate, true);

    console.log(`📊 Fetching monitoring data for app ${appId}`);
    console.log(`  - Date range: ${start} to ${end}`);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Workspace-Id': WS_ID,
    };

    // URL encode the dates
    const startEncoded = encodeURIComponent(start);
    const endEncoded = encodeURIComponent(end);

    // Call platform API endpoints
    const [
      dailyConversations,
      dailyTerminals,
      dailyActiveUsers,
      tokenCosts,
      avgSessionInteractions,
      avgUserInteractions,
      tokenOutputSpeed,
      userSatisfactionRate,
      avgResponseTime,
      dailyMessages,
    ] = await Promise.all([
      // 1. Daily conversations
      fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}/statistics/daily-conversations?start=${startEncoded}&end=${endEncoded}`, { headers })
        .then(async r => {
          console.log('📡 Daily conversations status:', r.status);
          if (!r.ok) {
            const errorText = await r.text();
            console.log('❌ Daily conversations error:', errorText);
            return { data: [] };
          }
          const json = await r.json();
          console.log('✅ Daily conversations response:', json);
          return json;
        })
        .catch(e => { console.error('❌ Daily conversations fetch error:', e); return { data: [] }; }),
      
      // 2. Daily terminals
      fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}/statistics/daily-end-users?start=${startEncoded}&end=${endEncoded}`, { headers })
        .then(r => r.ok ? r.json() : { data: [] })
        .catch(() => ({ data: [] })),
      
      // 3. Daily active users (alternative endpoint)
      fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}/statistics/daily-end-users?start=${startEncoded}&end=${endEncoded}`, { headers })
        .then(r => r.ok ? r.json() : { data: [] })
        .catch(() => ({ data: [] })),
      
      // 4. Token costs
      fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}/statistics/token-costs?start=${startEncoded}&end=${endEncoded}`, { headers })
        .then(r => r.ok ? r.json() : { data: [] })
        .catch(() => ({ data: [] })),
      
      // 5. Average session interactions
      fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}/statistics/average-session-interactions?start=${startEncoded}&end=${endEncoded}`, { headers })
        .then(r => r.ok ? r.json() : { data: [] })
        .catch(() => ({ data: [] })),
      
      // 6. Average user interactions
      fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}/statistics/average-session-interactions?start=${startEncoded}&end=${endEncoded}`, { headers })
        .then(r => r.ok ? r.json() : { data: [] })
        .catch(() => ({ data: [] })),
      
      // 7. Token output speed
      fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}/statistics/token-output-speed?start=${startEncoded}&end=${endEncoded}`, { headers })
        .then(r => r.ok ? r.json() : { data: [] })
        .catch(() => ({ data: [] })),
      
      // 8. User satisfaction rate
      fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}/statistics/user-satisfaction-rate?start=${startEncoded}&end=${endEncoded}`, { headers })
        .then(r => r.ok ? r.json() : { data: [] })
        .catch(() => ({ data: [] })),
      
      // 9. Average response time
      fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}/statistics/average-response-time?start=${startEncoded}&end=${endEncoded}`, { headers })
        .then(r => r.ok ? r.json() : { data: [] })
        .catch(() => ({ data: [] })),
      
      // 10. Daily messages
      fetch(`${CONSOLE_ORIGIN}/console/api/apps/${appId}/statistics/daily-messages?start=${startEncoded}&end=${endEncoded}`, { headers })
        .then(r => r.ok ? r.json() : { data: [] })
        .catch(() => ({ data: [] })),
    ]);

    console.log('✅ All Dify endpoints fetched');
    console.log('📊 RAW API RESPONSES:');
    console.log('1. Daily Conversations:', JSON.stringify(dailyConversations, null, 2));
    console.log('2. Daily Terminals:', JSON.stringify(dailyTerminals, null, 2));
    console.log('3. Daily Messages:', JSON.stringify(dailyMessages, null, 2));
    console.log('4. Token Costs:', JSON.stringify(tokenCosts, null, 2));
    console.log('5. Avg Interactions:', JSON.stringify(avgSessionInteractions, null, 2));
    console.log('6. Token Speed:', JSON.stringify(tokenOutputSpeed, null, 2));
    console.log('7. Satisfaction:', JSON.stringify(userSatisfactionRate, null, 2));

    // Extract data EXACTLY as Dify does (no custom calculations)
    const conversationsData = dailyConversations.data || [];
    const terminalsData = dailyTerminals.data || [];
    const messagesData = dailyMessages.data || [];
    const tokenCostsData = tokenCosts.data || [];
    const avgInteractionsData = avgSessionInteractions.data || [];
    const tokenSpeedData = tokenOutputSpeed.data || [];
    const satisfactionData = userSatisfactionRate.data || [];

    console.log('📊 EXTRACTED DATA ARRAYS:');
    console.log('Conversations array length:', conversationsData.length);
    console.log('Terminals array length:', terminalsData.length);
    console.log('Messages array length:', messagesData.length);

    // Calculate totals EXACTLY as Dify does
    const totalConversations = conversationsData.reduce((sum: number, item: any) => 
      sum + (item.conversation_count || 0), 0);
    
    const totalTerminals = Math.max(...terminalsData.map((item: any) => 
      item.terminal_count || 0), 0);
    
    const totalMessages = messagesData.reduce((sum: number, item: any) => 
      sum + (item.message_count || 0), 0);
    
    const totalTokens = tokenCostsData.reduce((sum: number, item: any) => 
      sum + (item.total_tokens || 0), 0);
    
    const totalCost = tokenCostsData.reduce((sum: number, item: any) => 
      sum + (item.cost || 0), 0);
    
    // Average calculations
    const avgSessionInt = avgInteractionsData.length > 0
      ? avgInteractionsData[avgInteractionsData.length - 1]?.interactions || 0
      : 0;
    
    const avgTokenSpeed = tokenSpeedData.length > 0
      ? tokenSpeedData[tokenSpeedData.length - 1]?.token_output_speed || 0
      : 0;
    
    const avgSatisfaction = satisfactionData.length > 0
      ? satisfactionData[satisfactionData.length - 1]?.rate || 0
      : 0;

    // Return in EXACT Dify format
    const result = {
      success: true,
      appId,
      period,
      startDate: start,
      endDate: end,
      
      // Statistics object (totals)
      statistics: {
        total_conversations: totalConversations,
        total_end_users: totalTerminals,
        total_messages: totalMessages,
        total_tokens: totalTokens,
        total_token_cost: totalCost,
        avg_session_interactions: avgSessionInt,
        token_output_speed: avgTokenSpeed,
        user_satisfaction_rate: avgSatisfaction,
      },
      
      // Chart data (time series)
      chartData: {
        conversations: conversationsData.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: item.conversation_count || 0
        })),
        
        activeUsers: terminalsData.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: item.terminal_count || 0
        })),
        
        totalMessages: messagesData.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: item.message_count || 0
        })),
        
        tokenUsage: tokenCostsData.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: item.total_tokens || 0
        })),
        
        avgInteractions: avgInteractionsData.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: item.interactions || 0
        })),
        
        tokenSpeed: tokenSpeedData.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: item.token_output_speed || 0
        })),
        
        userSatisfaction: satisfactionData.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: item.rate || 0
        })),
      }
    };

    console.log('📊 Final statistics:', result.statistics);
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
