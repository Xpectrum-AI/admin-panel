import { NextResponse } from 'next/server';

export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
  error?: string;
  timestamp: string;
}

export function createSuccessResponse(data?: any, message?: string, statusCode: number = 200): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    status: 'success',
    message: message || 'Operation completed successfully',
    data,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(response, { status: statusCode });
}

export function createErrorResponse(error: string | Error, statusCode: number = 500): NextResponse<ApiResponse> {
  let errorMessage = typeof error === 'string' ? error : error.message || 'Internal server error';
  
  // Try to parse JSON error messages and extract the actual error
  try {
    const parsedError = JSON.parse(errorMessage);
    if (typeof parsedError === 'object') {
      // Handle different error formats
      if (parsedError.password && Array.isArray(parsedError.password)) {
        errorMessage = parsedError.password[0];
      } else if (parsedError.email && Array.isArray(parsedError.email)) {
        errorMessage = parsedError.email[0];
      } else if (parsedError.detail) {
        errorMessage = parsedError.detail;
      } else if (parsedError.message) {
        errorMessage = parsedError.message;
      } else if (parsedError.error) {
        errorMessage = parsedError.error;
      } else {
        // If it's an object with multiple fields, join them
        const messages = Object.values(parsedError).flat().filter(msg => typeof msg === 'string');
        errorMessage = messages.length > 0 ? messages[0] : 'Validation error';
      }
    }
  } catch (e) {
    // If parsing fails, use the original error message
    errorMessage = typeof error === 'string' ? error : error.message || 'Internal server error';
  }
  
  const response: ApiResponse = {
    status: 'error',
    error: errorMessage,
    timestamp: new Date().toISOString()
  };
  
  return NextResponse.json(response, { status: statusCode });
}

export function handleApiError(error: any, context: string = 'API'): NextResponse<ApiResponse> {
  console.error(`Error in ${context}:`, error);
  
  let errorMessage = error.message || 'Internal server error';
  
  // Try to parse JSON error messages
  try {
    const parsedError = JSON.parse(errorMessage);
    if (typeof parsedError === 'object') {
      // Handle different error formats
      if (parsedError.password && Array.isArray(parsedError.password)) {
        errorMessage = parsedError.password[0];
      } else if (parsedError.email && Array.isArray(parsedError.email)) {
        errorMessage = parsedError.email[0];
      } else if (parsedError.detail) {
        errorMessage = parsedError.detail;
      } else if (parsedError.message) {
        errorMessage = parsedError.message;
      } else if (parsedError.error) {
        errorMessage = parsedError.error;
      } else {
        // If it's an object with multiple fields, join them
        const messages = Object.values(parsedError).flat().filter(msg => typeof msg === 'string');
        errorMessage = messages.length > 0 ? messages[0] : 'Validation error';
      }
    }
  } catch (e) {
    // If parsing fails, use the original error message
    errorMessage = error.message || 'Internal server error';
  }
  
  // Handle specific error types
  if (errorMessage.includes('already exists')) {
    return createErrorResponse(errorMessage, 409);
  }
  
  if (errorMessage.includes('Missing required fields') || 
      errorMessage.includes('must be') ||
      errorMessage.includes('required') ||
      errorMessage.includes('too commonly used') ||
      errorMessage.includes('Password is too')) {
    return createErrorResponse(errorMessage, 400);
  }
  
  if (errorMessage.includes('not found') || 
      errorMessage.includes('does not exist')) {
    return createErrorResponse(errorMessage, 404);
  }
  
  if (errorMessage.includes('unauthorized') || 
      errorMessage.includes('Unauthorized')) {
    return createErrorResponse(errorMessage, 401);
  }
  
  if (errorMessage.includes('forbidden') || 
      errorMessage.includes('Forbidden')) {
    return createErrorResponse(errorMessage, 403);
  }
  
  // Default error response
  return createErrorResponse(errorMessage, 500);
}
