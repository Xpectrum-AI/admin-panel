import { NextRequest, NextResponse } from 'next/server';

const DIFY_BASE_URL = process.env.NEXT_PUBLIC_DIFY_BASE_URL || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📚 Configuring knowledge base:', body);
    
    // Extract knowledge base IDs from the request
    const { selectedKnowledgeBases, chatbot_api_key } = body;
    
    if (!selectedKnowledgeBases || !Array.isArray(selectedKnowledgeBases)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'selectedKnowledgeBases array is required' 
        },
        { status: 400 }
      );
    }
    
    // Use the Dify API key from the request body, fallback to environment variable
    const difyApiKey = chatbot_api_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY;
    console.log('🔍 Dify API key:', difyApiKey ? 'Present' : 'Missing');
    
    // Validate required configuration
    if (!DIFY_BASE_URL) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'DIFY_BASE_URL not configured' 
        },
        { status: 400 }
      );
    }
    
    if (!difyApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dify API key not provided' 
        },
        { status: 400 }
      );
    }
    
    try {
      // For knowledge base configuration, we need to send a complete model config
      // Dify requires provider and model to be included
      const configPayload = {
        provider: 'langgenius/openai/openai', // Default provider
        model: 'gpt-4o', // Default model
        dataset_configs: {
          datasets: {
            datasets: selectedKnowledgeBases.map(datasetId => ({ 
              dataset_id: datasetId,
              retrieval_config: {
                top_k: 6,
                score_threshold: 0.5,
                score_threshold_enabled: false
              }
            }))
          }
        }
      };
      
      console.log('📤 Sending knowledge base config to Dify:', {
        url: `${DIFY_BASE_URL}/apps/current/model-config`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${difyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: configPayload
      });

      const response = await fetch(`${DIFY_BASE_URL}/apps/current/model-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${difyApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configPayload),
      });

      console.log('🔍 Dify knowledge base API response status:', response.status);
      console.log('🔍 Dify knowledge base API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to configure knowledge base:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: errorData.error || `HTTP ${response.status}: ${response.statusText}` 
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('✅ Knowledge base configured successfully:', data);
      
      return NextResponse.json({
        success: true,
        data,
        message: 'Knowledge base configuration updated successfully'
      });
      
    } catch (difyError) {
      console.error('❌ Dify knowledge base API call failed:', difyError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dify API call failed',
          details: difyError instanceof Error ? difyError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Knowledge base config error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to configure knowledge base',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
