// Environment Configuration for Developer Dashboard
// This file provides fallback values and environment variable management

export const ENVIRONMENT_CONFIG = {
  // Main API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_LIVE_API_URL || 'https://d22yt2oewbcglh.cloudfront.net',
  API_KEY: process.env.NEXT_PUBLIC_LIVE_API_KEY || 'xpectrum-ai@123',
  
  // Chatbot API Configuration
  CHATBOT_API_URL: process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://d22yt2oewbcglh.cloudfront.net',
  CHATBOT_API_KEY: process.env.NEXT_PUBLIC_CHATBOT_API_KEY || 'dev-chatbot-key',
  
  // Model Configuration API
  MODEL_API_BASE_URL: process.env.NEXT_PUBLIC_MODEL_API_BASE_URL || 'https://d22yt2oewbcglh.cloudfront.net/v1',
  MODEL_API_KEY: process.env.NEXT_PUBLIC_MODEL_API_KEY || 'app-CV6dxVdo4K226Yvm3vBj3iUO',
  
  // TTS Configuration
  ELEVEN_LABS_API_KEY: process.env.NEXT_PUBLIC_ELEVEN_LABS_API_KEY || '',
  ELEVEN_LABS_VOICE_ID: process.env.NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
  OPEN_AI_API_KEY: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY || '',
  CARTESIA_API_KEY: process.env.NEXT_PUBLIC_CARTESIA_API_KEY || '',
  CARTESIA_VOICE_ID: process.env.NEXT_PUBLIC_CARTESIA_VOICE_ID || '',
  
  // STT Configuration
  WHISPER_API_KEY: process.env.NEXT_PUBLIC_WHISPER_API_KEY || '',
  DEEPGRAM_API_KEY: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '',
  
  // Development Settings
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEFAULT_ORGANIZATION_ID: 'developer'
};

// Helper function to get environment variables with fallbacks
export const getEnvironmentVariables = () => {
  console.log('🔍 Getting environment variables with fallbacks...');
  
  const env = {
    API_BASE_URL: ENVIRONMENT_CONFIG.API_BASE_URL,
    API_KEY: ENVIRONMENT_CONFIG.API_KEY,
    CHATBOT_API_URL: ENVIRONMENT_CONFIG.CHATBOT_API_URL,
    CHATBOT_API_KEY: ENVIRONMENT_CONFIG.CHATBOT_API_KEY,
    MODEL_API_BASE_URL: ENVIRONMENT_CONFIG.MODEL_API_BASE_URL,
    MODEL_API_KEY: ENVIRONMENT_CONFIG.MODEL_API_KEY,
    ELEVEN_LABS_API_KEY: ENVIRONMENT_CONFIG.ELEVEN_LABS_API_KEY,
    ELEVEN_LABS_VOICE_ID: ENVIRONMENT_CONFIG.ELEVEN_LABS_VOICE_ID,
    OPEN_AI_API_KEY: ENVIRONMENT_CONFIG.OPEN_AI_API_KEY,
    CARTESIA_API_KEY: ENVIRONMENT_CONFIG.CARTESIA_API_KEY,
    CARTESIA_VOICE_ID: ENVIRONMENT_CONFIG.CARTESIA_VOICE_ID,
    WHISPER_API_KEY: ENVIRONMENT_CONFIG.WHISPER_API_KEY,
    DEEPGRAM_API_KEY: ENVIRONMENT_CONFIG.DEEPGRAM_API_KEY
  };
  
  console.log('🔍 Environment variables result:', {
    API_BASE_URL: env.API_BASE_URL ? 'SET' : 'NOT SET',
    API_KEY: env.API_KEY ? 'SET' : 'NOT SET',
    CHATBOT_API_URL: env.CHATBOT_API_URL ? 'SET' : 'NOT SET',
    CHATBOT_API_KEY: env.CHATBOT_API_KEY ? 'SET' : 'NOT SET',
    MODEL_API_BASE_URL: env.MODEL_API_BASE_URL ? 'SET' : 'NOT SET',
    MODEL_API_KEY: env.MODEL_API_KEY ? 'SET' : 'NOT SET'
  });
  
  return env;
};

// Helper function to mask API keys for display
export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 8) return '••••••••';
  return apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4);
};

// Get masked API keys for display
export const getMaskedApiKeys = () => {
  const env = getEnvironmentVariables();
  return {
    ELEVEN_LABS_API_KEY: maskApiKey(env.ELEVEN_LABS_API_KEY),
    OPEN_AI_API_KEY: maskApiKey(env.OPEN_AI_API_KEY),
    WHISPER_API_KEY: maskApiKey(env.WHISPER_API_KEY),
    DEEPGRAM_API_KEY: maskApiKey(env.DEEPGRAM_API_KEY),
    CARTESIA_API_KEY: maskApiKey(env.CARTESIA_API_KEY)
  };
};

// Get full API keys for actual API calls
export const getFullApiKeys = () => {
  const env = getEnvironmentVariables();
  return {
    elevenlabs: env.ELEVEN_LABS_API_KEY,
    openai: env.OPEN_AI_API_KEY,
    whisper: env.WHISPER_API_KEY,
    deepgram: env.DEEPGRAM_API_KEY,
    cartesia: env.CARTESIA_API_KEY
  };
};

// Get default voice IDs
export const getDefaultVoiceIds = () => {
  const env = getEnvironmentVariables();
  return {
    elevenlabs: env.ELEVEN_LABS_VOICE_ID || '••••••••',
    cartesia: env.CARTESIA_VOICE_ID || '••••••••'
  };
};
