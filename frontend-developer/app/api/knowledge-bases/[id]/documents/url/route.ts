import { NextRequest, NextResponse } from 'next/server';

const CONSOLE_ORIGIN = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
if (!CONSOLE_ORIGIN) {
  throw new Error('NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN is not configured');
}
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD;
const WS_ID = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !WS_ID) {
  throw new Error('NEXT_PUBLIC_DIFY_ADMIN_EMAIL, NEXT_PUBLIC_DIFY_ADMIN_PASSWORD, or NEXT_PUBLIC_DIFY_WORKSPACE_ID is not configured');
}

async function getAuthToken() {
  const loginResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  if (!loginResponse.ok) throw new Error('Failed to authenticate');
  const loginData = await loginResponse.json();
  return loginData.data?.access_token || loginData.access_token || loginData.data?.token;
}

async function waitForCrawlJobCompletion(token: string, jobId: string, maxWaitTime = 30000) {
  const startTime = Date.now();
  const pollInterval = 2000; // Poll every 2 seconds
  
  console.log(`⏳ Waiting for crawl job ${jobId} to complete...`);
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const statusResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/website/crawl/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Workspace-Id': WS_ID,
        }
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`🔍 Crawl job status:`, statusData.status || statusData.data?.status);
        
        // Check if job is completed
        if (statusData.status === 'completed' || statusData.data?.status === 'completed') {
          console.log('✅ Crawl job completed successfully');
          return true;
        }
        
        // Check if job failed
        if (statusData.status === 'failed' || statusData.data?.status === 'failed') {
          console.error('❌ Crawl job failed');
          return false;
        }
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Error checking crawl status:', error);
      // Continue polling even if status check fails
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  console.log('⚠️ Crawl job polling timeout, proceeding anyway...');
  return true; // Proceed even if we timeout
}

async function createDocumentWithRetry(token: string, datasetId: string, payload: any, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📝 Attempt ${attempt}/${maxRetries} to create document`);
      
      const createDocResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/datasets/${datasetId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Workspace-Id': WS_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!createDocResponse.ok) {
        const errorText = await createDocResponse.text();
        throw new Error(`HTTP ${createDocResponse.status}: ${errorText}`);
      }

      const data = await createDocResponse.json();
      console.log(`✅ Document created successfully on attempt ${attempt}`);
      return data;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
      
      if (attempt < maxRetries) {
        const delay = attempt * 3000; // 3s, 6s, 9s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { url, name, indexingTechnique, chunkSettings } = body;
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    
    console.log('🌐 Crawling URL with Firecrawl:', url);
    const token = await getAuthToken();
    
    const crawlResponse = await fetch(`${CONSOLE_ORIGIN}/console/api/website/crawl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': WS_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'firecrawl',
        url: url,
        options: {
          crawl_sub_pages: false,
          only_main_content: true,
          includes: '',
          excludes: '',
          limit: 1,
          max_depth: 1
        }
      })
    });

    if (!crawlResponse.ok) {
      const errorText = await crawlResponse.text();
      console.error('Crawl error:', errorText);
      
      // Check if Firecrawl is not configured
      if (errorText.includes('NoneType') || errorText.includes('crawl_failed')) {
        return NextResponse.json({ 
          error: 'Firecrawl is not configured on the backend.\n\nTo enable URL crawling:\n1. Contact your administrator to configure Firecrawl\n2. Or use File or Text upload instead',
          details: errorText,
          configurationRequired: true
        }, { status: 503 });
      }
      
      return NextResponse.json({ 
        error: `Failed to crawl URL: ${crawlResponse.statusText}`,
        details: errorText 
      }, { status: crawlResponse.status });
    }

    const crawlData = await crawlResponse.json();
    
    // Check if job_id exists
    if (!crawlData || !crawlData.job_id) {
      console.error('No job_id in crawl response:', crawlData);
      return NextResponse.json({ 
        error: 'Firecrawl service error: No job ID returned. Please ensure Firecrawl is properly configured on the backend.',
        details: crawlData 
      }, { status: 500 });
    }
    
    const jobId = crawlData.job_id;
    console.log('✅ Crawl job started:', jobId);

    // Wait for crawl job to complete
    await waitForCrawlJobCompletion(token, jobId, 30000);

    // Build process_rule from chunk settings
    let processRule = {
      mode: 'automatic',
      rules: {
        pre_processing_rules: [
          { id: 'remove_extra_spaces', enabled: true },
          { id: 'remove_urls_emails', enabled: true }
        ],
        segmentation: {
          separator: '\n',
          max_tokens: 500
        }
      }
    };

    if (chunkSettings && chunkSettings.mode === 'structure') {
      processRule = {
        mode: 'hierarchical',
        rules: {
          pre_processing_rules: [
            { id: 'remove_extra_spaces', enabled: chunkSettings.replaceExtraSpaces !== false },
            { id: 'remove_urls_emails', enabled: chunkSettings.removeUrlsEmails === true }
          ],
          segmentation: {
            separator: '\\n\\n',
            max_tokens: chunkSettings.chunkSize || 1024,
            hierarchical: {
              enabled: true,
              max_parent_tokens: chunkSettings.maxSectionSize || 4000,
              overlap_tokens: Math.floor((chunkSettings.chunkSize || 1024) * (chunkSettings.chunkOverlap || 50) / 100)
            }
          }
        }
      } as any;
    }

    // Create document with retry logic
    const payload = {
      indexing_technique: indexingTechnique || 'high_quality',
      data_source: {
        type: 'website_crawl',
        info_list: {
          data_source_type: 'website_crawl',
          website_info_list: {
            provider: 'firecrawl',
            job_id: jobId,
            urls: [url],
            only_main_content: true
          }
        }
      },
      process_rule: processRule,
      doc_form: 'text_model',
      doc_language: 'English'
    };

    const data = await createDocumentWithRetry(token, id, payload, 3);
    
    const documents = data.documents || data.data?.documents || [];
    const firstDoc = documents[0] || data.document;
    
    const document = {
      id: firstDoc?.id,
      name: firstDoc?.name || name || new URL(url).hostname,
      status: firstDoc?.indexing_status === 'completed' ? 'completed' : 
              firstDoc?.indexing_status === 'error' ? 'error' : 'indexing',
      wordCount: firstDoc?.word_count || 0,
      createdAt: new Date(firstDoc?.created_at * 1000 || Date.now()).toISOString(),
      batch: data.batch || '',
      sourceUrl: url
    };

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('❌ Error uploading document from URL after all retries:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to upload document from URL after 3 attempts' 
    }, { status: 500 });
  }
}
