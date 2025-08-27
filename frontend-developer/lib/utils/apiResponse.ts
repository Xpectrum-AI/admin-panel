import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export function createSuccessResponse<T>(
  data: T,
  message: string = 'Success'
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(response, { status: 200 });
}

export function createErrorResponse(
  message: string = 'An error occurred',
  statusCode: number = 500,
  error?: string
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(response, { status: statusCode });
}

export function handleApiError(
  error: unknown,
  context: string = 'API'
): NextResponse<ApiResponse> {
  console.error(`${context} Error:`, error);

  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  const statusCode = error instanceof Error && 'status' in error ? (error as any).status : 500;

  return createErrorResponse(
    `${context} operation failed`,
    statusCode,
    errorMessage
  );
}
