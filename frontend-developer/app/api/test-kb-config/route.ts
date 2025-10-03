import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🧪 Testing knowledge base configuration:', body);
    
    // Test payload
    const testPayload = {
      provider: 'langgenius/openai/openai',
      model: 'gpt-4o',
      api_key: 'sk-test-key',
      dataset_configs: {
        datasets: {
          datasets: [
            {
              dataset_id: '62197cb0-7427-4abd-9057-985febebf3e5',
              retrieval_config: {
                top_k: 6,
                score_threshold: 0.5,
                score_threshold_enabled: false
              }
            }
          ]
        }
      }
    };
    
    console.log('📤 Sending test config to Dify:', testPayload);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/model-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...testPayload,
        chatbot_api_key: body.chatbot_api_key || 'REDACTED'
      }),
    });

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test completed',
      payload: testPayload,
      dify_response: result
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
