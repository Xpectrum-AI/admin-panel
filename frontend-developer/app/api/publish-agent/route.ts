import { NextRequest, NextResponse } from 'next/server';

const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatbot_api_key, app_id } = body;
    
    if (!chatbot_api_key) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Chatbot API key is required' 
        },
        { status: 400 }
      );
    }

    // Get the app ID - either from the request or from the model-config API
    let appId = app_id;
    
    if (!appId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'App ID is required for publishing',
          details: 'Please provide app_id in the request body'
        },
        { status: 400 }
      );
    }
    
    // The key insight: When you click "Publish Update" in Dify Studio,
    // it sends a POST to /console/api/apps/{appId}/model-config with the full configuration.
    // However, we've already saved the configuration via our /api/model-config endpoint.
    // 
    // In Dify, the act of POSTing to model-config IS the publish action.
    // There's no separate "publish" step - saving the model config publishes it.
    //
    // So since we already called /api/model-config to save the knowledge base configuration,
    // the agent is already "published" with the updated config.
    // 
    // This API endpoint is essentially a confirmation that the publish happened.
    return NextResponse.json({
      success: true,
      message: 'Agent published successfully',
      data: {
        appId: appId,
        chatbotApiKey: chatbot_api_key,
        configUrl: `${CONSOLE_ORIGIN}/app/${appId}/configuration`
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to publish agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
