import { NextRequest, NextResponse } from 'next/server';
import { createOrg } from '@/lib/controllers/orgController';
import { handleApiError } from '@/lib/utils/apiResponse';

export async function POST(request: NextRequest) {
  try {
    return await createOrg(request);
  } catch (error) {
    return handleApiError(error, 'Organization Create API');
  }
} 