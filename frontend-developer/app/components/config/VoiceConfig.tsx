'use client';

import React, { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Volume2, Settings, Loader2, RefreshCw, MessageSquare, Zap, X } from 'lucide-react';
import { agentConfigService, maskApiKey } from '../../../service/agentConfigService';
import { useTheme } from '../../contexts/ThemeContext';
import { useVoiceConfig, useTranscriberConfig } from '../../hooks/useAgentConfigSection';

interface VoiceConfigProps {
  agentName?: string;
  onConfigChange?: (config: any) => void;
  onTranscriberConfigChange?: (config: any) => void;
  existingConfig?: any;
  existingTranscriberConfig?: any;
  isEditing?: boolean;
  // Add these new props to receive centralized configuration
  voiceConfiguration?: any;
  transcriberConfiguration?: any;
  // Agent's MongoDB config to check for saved API keys
  agentTtsConfig?: any;
  agentSttConfig?: any;
}

const VoiceConfig = forwardRef<HTMLDivElement, VoiceConfigProps>(({
  agentName = 'default',
  onConfigChange,
  onTranscriberConfigChange,
  isEditing = false,
  voiceConfiguration,    // Add this
  transcriberConfiguration,  // Add this
  agentTtsConfig,  // MongoDB TTS config
  agentSttConfig   // MongoDB STT config
}, ref) => {
  const { isDarkMode } = useTheme();
  const { config: voiceConfig, updateConfig: updateVoiceConfig } = useVoiceConfig();
  const { config: transcriberConfig, updateConfig: updateTranscriberConfig } = useTranscriberConfig();
  // Local state for UI updates
  const [selectedVoiceProvider, setSelectedVoiceProvider] = useState('OpenAI');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [speedValue, setSpeedValue] = useState(0.0);
  const [apiKey, setApiKey] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [selectedModel, setSelectedModel] = useState('tts-1');
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.5);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [responseFormat, setResponseFormat] = useState('mp3');
  const [isUserChangingProvider, setIsUserChangingProvider] = useState(false);
  const [isUserChangingVoiceField, setIsUserChangingVoiceField] = useState(false);
  const [isUserChangingApiKey, setIsUserChangingApiKey] = useState(false);
  const [isUserChangingTranscriberApiKey, setIsUserChangingTranscriberApiKey] = useState(false);
  const [isApiKeyFocused, setIsApiKeyFocused] = useState(false);
  const [isTranscriberApiKeyFocused, setIsTranscriberApiKeyFocused] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>(''); // Gender filter for 11Labs
  
  // ElevenLabs voices state
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [voicesError, setVoicesError] = useState('');
  const providerChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voiceFieldChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastConfigRef = useRef<string>('');
  const lastVoiceIdRef = useRef<string>('');

  // Transcriber state
  const [selectedTranscriberProvider, setSelectedTranscriberProvider] = useState('Deepgram');
  const [selectedTranscriberLanguage, setSelectedTranscriberLanguage] = useState('en-US');
  const [selectedTranscriberModel, setSelectedTranscriberModel] = useState('nova-2');
  const [transcriberApiKey, setTranscriberApiKey] = useState('');
  const [punctuateEnabled, setPunctuateEnabled] = useState(true);
  const [smartFormatEnabled, setSmartFormatEnabled] = useState(true);
  const [interimResultEnabled, setInterimResultEnabled] = useState(false);
  const [isUserChangingTranscriberProvider, setIsUserChangingTranscriberProvider] = useState(false);
  const transcriberProviderChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [voiceProviders, setVoiceProviders] = useState({
    'OpenAI': ['tts-1', 'tts-1-hd', 'gpt-4o-mini-tts'],
    '11Labs': [
      // 'eleven_v3', // not working
      // 'eleven_ttv_v3', // not working
      // 'scribe_v1', // not working
      // 'scribe_v1_experimental', // not working
      'eleven_multilingual_v2', // working
      'eleven_flash_v2_5', // working
      'eleven_flash_v2', // working
      'eleven_turbo_v2_5', // working
      'eleven_turbo_v2', // working
      // 'eleven_multilingual_sts_v2', // not working
      // 'eleven_multilingual_ttv_v2', // not working
      // 'eleven_english_sts_v2' // not working
    ],
    'Cartesia': ['sonic-2', 'sonic-turbo', 'sonic']
  });

  const transcriberProviders = {
    'Deepgram': ['nova-2', 'nova-3'],
    'OpenAI': ['whisper-1', 'gpt-4o-mini-transcribe']
  };

  // OpenAI TTS Language Mapping (67 languages)
  const openaiLanguageMapping = {
    'af': 'Afrikaans',
    'ar': 'Arabic',
    'hy': 'Armenian',
    'az': 'Azerbaijani',
    'be': 'Belarusian',
    'bs': 'Bosnian',
    'bg': 'Bulgarian',
    'ca': 'Catalan',
    'zh': 'Chinese',
    'hr': 'Croatian',
    'cs': 'Czech',
    'da': 'Danish',
    'nl': 'Dutch',
    'en': 'English',
    'et': 'Estonian',
    'fi': 'Finnish',
    'fr': 'French',
    'gl': 'Galician',
    'de': 'German',
    'el': 'Greek',
    'he': 'Hebrew',
    'hi': 'Hindi',
    'hu': 'Hungarian',
    'is': 'Icelandic',
    'id': 'Indonesian',
    'it': 'Italian',
    'ja': 'Japanese',
    'kn': 'Kannada',
    'kk': 'Kazakh',
    'ko': 'Korean',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'mk': 'Macedonian',
    'ms': 'Malay',
    'mr': 'Marathi',
    'mi': 'Maori',
    'ne': 'Nepali',
    'no': 'Norwegian',
    'fa': 'Persian',
    'pl': 'Polish',
    'pt': 'Portuguese',
    'ro': 'Romanian',
    'ru': 'Russian',
    'sr': 'Serbian',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'es': 'Spanish',
    'sw': 'Swahili',
    'sv': 'Swedish',
    'tl': 'Tagalog',
    'ta': 'Tamil',
    'th': 'Thai',
    'tr': 'Turkish',
    'uk': 'Ukrainian',
    'ur': 'Urdu',
    'vi': 'Vietnamese',
    'cy': 'Welsh'
  };

  // Cartesia Language Mapping (15 languages)
  const cartesiaLanguageMapping = {
    'en': 'English',
    'fr': 'French',
    'de': 'German',
    'es': 'Spanish',
    'pt': 'Portuguese',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'hi': 'Hindi',
    'it': 'Italian',
    'ko': 'Korean',
    'nl': 'Dutch',
    'pl': 'Polish',
    'ru': 'Russian',
    'sv': 'Swedish',
    'tr': 'Turkish'
  };

  // Reverse mappings for both providers
  const openaiReverseLanguageMapping = {
    'Afrikaans': 'af',
    'Arabic': 'ar',
    'Armenian': 'hy',
    'Azerbaijani': 'az',
    'Belarusian': 'be',
    'Bosnian': 'bs',
    'Bulgarian': 'bg',
    'Catalan': 'ca',
    'Chinese': 'zh',
    'Croatian': 'hr',
    'Czech': 'cs',
    'Danish': 'da',
    'Dutch': 'nl',
    'English': 'en',
    'Estonian': 'et',
    'Finnish': 'fi',
    'French': 'fr',
    'Galician': 'gl',
    'German': 'de',
    'Greek': 'el',
    'Hebrew': 'he',
    'Hindi': 'hi',
    'Hungarian': 'hu',
    'Icelandic': 'is',
    'Indonesian': 'id',
    'Italian': 'it',
    'Japanese': 'ja',
    'Kannada': 'kn',
    'Kazakh': 'kk',
    'Korean': 'ko',
    'Latvian': 'lv',
    'Lithuanian': 'lt',
    'Macedonian': 'mk',
    'Malay': 'ms',
    'Marathi': 'mr',
    'Maori': 'mi',
    'Nepali': 'ne',
    'Norwegian': 'no',
    'Persian': 'fa',
    'Polish': 'pl',
    'Portuguese': 'pt',
    'Romanian': 'ro',
    'Russian': 'ru',
    'Serbian': 'sr',
    'Slovak': 'sk',
    'Slovenian': 'sl',
    'Spanish': 'es',
    'Swahili': 'sw',
    'Swedish': 'sv',
    'Tagalog': 'tl',
    'Tamil': 'ta',
    'Thai': 'th',
    'Turkish': 'tr',
    'Ukrainian': 'uk',
    'Urdu': 'ur',
    'Vietnamese': 'vi',
    'Welsh': 'cy'
  };

  const cartesiaReverseLanguageMapping = {
    'English': 'en',
    'French': 'fr',
    'German': 'de',
    'Spanish': 'es',
    'Portuguese': 'pt',
    'Chinese': 'zh',
    'Japanese': 'ja',
    'Hindi': 'hi',
    'Italian': 'it',
    'Korean': 'ko',
    'Dutch': 'nl',
    'Polish': 'pl',
    'Russian': 'ru',
    'Swedish': 'sv',
    'Turkish': 'tr'
  };

  // 11Labs Language Mapping (ISO 639-3 and ISO 639-1 codes)
  const elevenLabsLanguageMapping = {
    // ISO 639-3 codes
    'afr': 'Afrikaans',
    'amh': 'Amharic',
    'ara': 'Arabic',
    'hye': 'Armenian',
    'asm': 'Assamese',
    'ast': 'Asturian',
    'aze': 'Azerbaijani',
    'bel': 'Belarusian',
    'ben': 'Bengali',
    'bos': 'Bosnian',
    'bul': 'Bulgarian',
    'mya': 'Burmese',
    'yue': 'Cantonese',
    'cat': 'Catalan',
    'ceb': 'Cebuano',
    'nya': 'Chichewa',
    'hrv': 'Croatian',
    'ces': 'Czech',
    'dan': 'Danish',
    'nld': 'Dutch',
    'eng': 'English',
    'est': 'Estonian',
    'fil': 'Filipino',
    'fin': 'Finnish',
    'fra': 'French',
    'ful': 'Fulah',
    'glg': 'Galician',
    'lug': 'Ganda',
    'kat': 'Georgian',
    'deu': 'German',
    'ell': 'Greek',
    'guj': 'Gujarati',
    'hau': 'Hausa',
    'heb': 'Hebrew',
    'hin': 'Hindi',
    'hun': 'Hungarian',
    'isl': 'Icelandic',
    'ibo': 'Igbo',
    'ind': 'Indonesian',
    'gle': 'Irish',
    'ita': 'Italian',
    'jpn': 'Japanese',
    'jav': 'Javanese',
    'kea': 'Kabuverdianu',
    'kan': 'Kannada',
    'kaz': 'Kazakh',
    'khm': 'Khmer',
    'kor': 'Korean',
    'kur': 'Kurdish',
    'kir': 'Kyrgyz',
    'lao': 'Lao',
    'lav': 'Latvian',
    'lin': 'Lingala',
    'lit': 'Lithuanian',
    'luo': 'Luo',
    'ltz': 'Luxembourgish',
    'mkd': 'Macedonian',
    'msa': 'Malay',
    'mal': 'Malayalam',
    'mlt': 'Maltese',
    'zho': 'Mandarin Chinese',
    'cmn': 'Mandarin Chinese',
    'mri': 'Māori',
    'mar': 'Marathi',
    'mon': 'Mongolian',
    'nep': 'Nepali',
    'nso': 'Northern Sotho',
    'nor': 'Norwegian',
    'oci': 'Occitan',
    'ori': 'Odia',
    'pus': 'Pashto',
    'fas': 'Persian',
    'pol': 'Polish',
    'por': 'Portuguese',
    'pan': 'Punjabi',
    'ron': 'Romanian',
    'rus': 'Russian',
    'srp': 'Serbian',
    'sna': 'Shona',
    'snd': 'Sindhi',
    'slk': 'Slovak',
    'slv': 'Slovenian',
    'som': 'Somali',
    'spa': 'Spanish',
    'swa': 'Swahili',
    'swe': 'Swedish',
    'tam': 'Tamil',
    'tgk': 'Tajik',
    'tel': 'Telugu',
    'tha': 'Thai',
    'tur': 'Turkish',
    'ukr': 'Ukrainian',
    'umb': 'Umbundu',
    'urd': 'Urdu',
    'uzb': 'Uzbek',
    'vie': 'Vietnamese',
    'cym': 'Welsh',
    'wol': 'Wolof',
    'xho': 'Xhosa',
    'zul': 'Zulu',
    // ISO 639-1 codes (for newer models)
    'en': 'English',
    'ja': 'Japanese',
    'zh': 'Chinese',
    'de': 'German',
    'hi': 'Hindi',
    'fr': 'French',
    'ko': 'Korean',
    'pt': 'Portuguese',
    'it': 'Italian',
    'es': 'Spanish',
    'id': 'Indonesian',
    'nl': 'Dutch',
    'tr': 'Turkish',
    'pl': 'Polish',
    'sv': 'Swedish',
    'bg': 'Bulgarian',
    'ro': 'Romanian',
    'ar': 'Arabic',
    'cs': 'Czech',
    'el': 'Greek',
    'fi': 'Finnish',
    'hr': 'Croatian',
    'ms': 'Malay',
    'sk': 'Slovak',
    'da': 'Danish',
    'ta': 'Tamil',
    'uk': 'Ukrainian',
    'ru': 'Russian',
    'hu': 'Hungarian',
    'no': 'Norwegian',
    'vi': 'Vietnamese'
  };

  // 11Labs Model Language Support
  const elevenLabsModelLanguages = {
    // 'eleven_v3': ['afr', 'ara', 'hye', 'asm', 'aze', 'bel', 'ben', 'bos', 'bul', 'cat', 'ceb', 'nya', 'hrv', 'ces', 'dan', 'nld', 'eng', 'est', 'fil', 'fin', 'fra', 'glg', 'kat', 'deu', 'ell', 'guj', 'hau', 'heb', 'hin', 'hun', 'isl', 'ind', 'gle', 'ita', 'jpn', 'jav', 'kan', 'kaz', 'kir', 'kor', 'lav', 'lin', 'lit', 'ltz', 'mkd', 'msa', 'mal', 'cmn', 'mar', 'nep', 'nor', 'pus', 'fas', 'pol', 'por', 'pan', 'ron', 'rus', 'srp', 'snd', 'slk', 'slv', 'som', 'spa', 'swa', 'swe', 'tam', 'tel', 'tha', 'tur', 'ukr', 'urd', 'vie', 'cym'], // not working
    // 'eleven_ttv_v3': ['afr', 'ara', 'hye', 'asm', 'aze', 'bel', 'ben', 'bos', 'bul', 'cat', 'ceb', 'nya', 'hrv', 'ces', 'dan', 'nld', 'eng', 'est', 'fil', 'fin', 'fra', 'glg', 'kat', 'deu', 'ell', 'guj', 'hau', 'heb', 'hin', 'hun', 'isl', 'ind', 'gle', 'ita', 'jpn', 'jav', 'kan', 'kaz', 'kir', 'kor', 'lav', 'lin', 'lit', 'ltz', 'mkd', 'msa', 'mal', 'cmn', 'mar', 'nep', 'nor', 'pus', 'fas', 'pol', 'por', 'pan', 'ron', 'rus', 'srp', 'snd', 'slk', 'slv', 'som', 'spa', 'swa', 'swe', 'tam', 'tel', 'tha', 'tur', 'ukr', 'urd', 'vie', 'cym'], // not working
    // 'scribe_v1': ['afr', 'amh', 'ara', 'hye', 'asm', 'ast', 'aze', 'bel', 'ben', 'bos', 'bul', 'mya', 'yue', 'cat', 'ceb', 'nya', 'hrv', 'ces', 'dan', 'nld', 'eng', 'est', 'fil', 'fin', 'fra', 'ful', 'glg', 'lug', 'kat', 'deu', 'ell', 'guj', 'hau', 'heb', 'hin', 'hun', 'isl', 'ibo', 'ind', 'gle', 'ita', 'jpn', 'jav', 'kea', 'kan', 'kaz', 'khm', 'kor', 'kur', 'kir', 'lao', 'lav', 'lin', 'lit', 'luo', 'ltz', 'mkd', 'msa', 'mal', 'mlt', 'zho', 'mri', 'mar', 'mon', 'nep', 'nso', 'nor', 'oci', 'ori', 'pus', 'fas', 'pol', 'por', 'pan', 'ron', 'rus', 'srp', 'sna', 'snd', 'slk', 'slv', 'som', 'spa', 'swa', 'swe', 'tam', 'tgk', 'tel', 'tha', 'tur', 'ukr', 'umb', 'urd', 'uzb', 'vie', 'cym', 'wol', 'xho', 'zul'], // not working
    // 'scribe_v1_experimental': ['afr', 'amh', 'ara', 'hye', 'asm', 'ast', 'aze', 'bel', 'ben', 'bos', 'bul', 'mya', 'yue', 'cat', 'ceb', 'nya', 'hrv', 'ces', 'dan', 'nld', 'eng', 'est', 'fil', 'fin', 'fra', 'ful', 'glg', 'lug', 'kat', 'deu', 'ell', 'guj', 'hau', 'heb', 'hin', 'hun', 'isl', 'ibo', 'ind', 'gle', 'ita', 'jpn', 'jav', 'kea', 'kan', 'kaz', 'khm', 'kor', 'kur', 'kir', 'lao', 'lav', 'lin', 'lit', 'luo', 'ltz', 'mkd', 'msa', 'mal', 'mlt', 'zho', 'mri', 'mar', 'mon', 'nep', 'nso', 'nor', 'oci', 'ori', 'pus', 'fas', 'pol', 'por', 'pan', 'ron', 'rus', 'srp', 'sna', 'snd', 'slk', 'slv', 'som', 'spa', 'swa', 'swe', 'tam', 'tgk', 'tel', 'tha', 'tur', 'ukr', 'umb', 'urd', 'uzb', 'vie', 'cym', 'wol', 'xho', 'zul'], // not working
    'eleven_multilingual_v2': ['en', 'ja', 'zh', 'de', 'hi', 'fr', 'ko', 'pt', 'it', 'es', 'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru'], // working
    'eleven_flash_v2_5': ['en', 'ja', 'zh', 'de', 'hi', 'fr', 'ko', 'pt', 'it', 'es', 'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru', 'hu', 'no', 'vi'], // working
    'eleven_flash_v2': ['en'], // working
    'eleven_turbo_v2_5': ['en', 'ja', 'zh', 'de', 'hi', 'fr', 'ko', 'pt', 'it', 'es', 'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru', 'hu', 'no', 'vi'], // working
    'eleven_turbo_v2': ['en'], // working
    // 'eleven_multilingual_sts_v2': ['en', 'ja', 'zh', 'de', 'hi', 'fr', 'ko', 'pt', 'it', 'es', 'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru'], // not working
    // 'eleven_multilingual_ttv_v2': ['en', 'ja', 'zh', 'de', 'hi', 'fr', 'ko', 'pt', 'it', 'es', 'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru'], // not working
    // 'eleven_english_sts_v2': ['en'] // not working
  };

  // 11Labs Model Display Names
  const elevenLabsModelNames = {
    // 'eleven_v3': 'Eleven v3', // not working
    // 'eleven_ttv_v3': 'Eleven TTV v3', // not working
    // 'scribe_v1': 'Scribe v1', // not working
    // 'scribe_v1_experimental': 'Scribe v1 Experimental', // not working
    'eleven_multilingual_v2': 'Eleven Multilingual v2', // working
    'eleven_flash_v2_5': 'Eleven Flash v2.5', // working
    'eleven_flash_v2': 'Eleven Flash v2', // working
    'eleven_turbo_v2_5': 'Eleven Turbo v2.5', // working
    'eleven_turbo_v2': 'Eleven Turbo v2', // working
    // 'eleven_multilingual_sts_v2': 'Eleven Multilingual STS v2', // not working
    // 'eleven_multilingual_ttv_v2': 'Eleven Multilingual TTV v2', // not working
    // 'eleven_english_sts_v2': 'Eleven English STS v2' // not working
  };

  // Deepgram Language Mapping
  const deepgramLanguageMapping = {
    'bg': 'Bulgarian',
    'ca': 'Catalan',
    'zh': 'Chinese (Mandarin, Simplified)',
    'zh-CN': 'Chinese (Mandarin, Simplified)',
    'zh-Hans': 'Chinese (Mandarin, Simplified)',
    'zh-TW': 'Chinese (Mandarin, Traditional)',
    'zh-Hant': 'Chinese (Mandarin, Traditional)',
    'zh-HK': 'Chinese (Cantonese, Traditional)',
    'cs': 'Czech',
    'da': 'Danish',
    'da-DK': 'Danish',
    'nl': 'Dutch',
    'en': 'English',
    'en-US': 'English',
    'en-AU': 'English',
    'en-GB': 'English',
    'en-NZ': 'English',
    'en-IN': 'English',
    'et': 'Estonian',
    'fi': 'Finnish',
    'nl-BE': 'Flemish',
    'fr': 'French',
    'fr-CA': 'French',
    'de': 'German',
    'de-CH': 'German (Switzerland)',
    'el': 'Greek',
    'hi': 'Hindi',
    'hu': 'Hungarian',
    'id': 'Indonesian',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ko-KR': 'Korean',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'ms': 'Malay',
    'no': 'Norwegian',
    'pl': 'Polish',
    'pt': 'Portuguese',
    'pt-BR': 'Portuguese',
    'pt-PT': 'Portuguese',
    'ro': 'Romanian',
    'ru': 'Russian',
    'sk': 'Slovak',
    'es': 'Spanish',
    'es-419': 'Spanish',
    'sv': 'Swedish',
    'sv-SE': 'Swedish',
    'th': 'Thai',
    'th-TH': 'Thai',
    'tr': 'Turkish',
    'uk': 'Ukrainian',
    'vi': 'Vietnamese'
  };

  // Deepgram Model Language Support
  const deepgramModelLanguages = {
    'nova-2': ['bg', 'ca', 'zh', 'zh-CN', 'zh-Hans', 'zh-TW', 'zh-Hant', 'zh-HK', 'cs', 'da', 'da-DK', 'nl', 'en', 'en-US', 'en-AU', 'en-GB', 'en-NZ', 'en-IN', 'et', 'fi', 'nl-BE', 'fr', 'fr-CA', 'de', 'de-CH', 'el', 'hi', 'hu', 'id', 'it', 'ja', 'ko', 'ko-KR', 'lv', 'lt', 'ms', 'no', 'pl', 'pt', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'es', 'es-419', 'sv', 'sv-SE', 'th', 'th-TH', 'tr', 'uk', 'vi'],
    'nova-3': ['bg', 'ca', 'zh', 'zh-CN', 'zh-Hans', 'zh-TW', 'zh-Hant', 'zh-HK', 'cs', 'da', 'da-DK', 'nl', 'en', 'en-US', 'en-AU', 'en-GB', 'en-NZ', 'en-IN', 'et', 'fi', 'nl-BE', 'fr', 'fr-CA', 'de', 'de-CH', 'el', 'hi', 'hu', 'id', 'it', 'ja', 'ko', 'ko-KR', 'lv', 'lt', 'ms', 'no', 'pl', 'pt', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'es', 'es-419', 'sv', 'sv-SE', 'th', 'th-TH', 'tr', 'uk', 'vi']
  };

  const openaiModels = {
    'alloy': 'Alloy - Neutral',
    'ash': 'Ash',
    'coral': 'Coral',
    'echo': 'Echo - Male, clear',
    'fable': 'Fable - British accent',
    'nova': 'Nova - Female, warm',
    'onyx': 'Onyx - Male, deeper',
    'sage': 'Sage',
    'shimmer': 'Shimmer - Female, brighter'
  };

  const responseFormats = {
    'mp3': 'MP3',
    'opus': 'Opus',
    'aac': 'AAC',
    'flac': 'FLAC',
    'wav': 'WAV',
    'pcm': 'PCM'
  };

  // Reset language when model changes for 11Labs
  React.useEffect(() => {
    if (selectedVoiceProvider === '11Labs') {
      const languageMapping = getCurrentLanguageMapping();
      const availableLanguages = Object.values(languageMapping);

      // If current selected language is not available for the new model, reset to first available
      if (availableLanguages.length > 0 && !availableLanguages.includes(selectedLanguage)) {
        console.log('🔄 Resetting language for 11Labs model change');
        setSelectedLanguage(availableLanguages[0]);
      }
    }
  }, [selectedModel, selectedVoiceProvider]);

  // Function to get current language mapping based on provider
  const getCurrentLanguageMapping = () => {
    if (selectedVoiceProvider === 'Cartesia') {
      return cartesiaLanguageMapping;
    } else if (selectedVoiceProvider === '11Labs') {
      // Get supported languages for the selected model (not voice)
      const supportedLanguages = elevenLabsModelLanguages[selectedModel as keyof typeof elevenLabsModelLanguages] || [];
      console.log('🔍 11Labs - Selected Model:', selectedModel);
      console.log('🔍 11Labs - Supported Languages:', supportedLanguages);

      const filteredMapping: { [key: string]: string } = {};
      supportedLanguages.forEach(langCode => {
        if (elevenLabsLanguageMapping[langCode as keyof typeof elevenLabsLanguageMapping]) {
          filteredMapping[langCode] = elevenLabsLanguageMapping[langCode as keyof typeof elevenLabsLanguageMapping];
        }
      });

      console.log('🔍 11Labs - Filtered Language Mapping:', filteredMapping);
      return filteredMapping;
    }
    return openaiLanguageMapping;
  };

  const getCurrentReverseLanguageMapping = () => {
    if (selectedVoiceProvider === 'Cartesia') {
      return cartesiaReverseLanguageMapping;
    } else if (selectedVoiceProvider === '11Labs') {
      // Create reverse mapping for 11Labs based on supported languages
      const supportedLanguages = elevenLabsModelLanguages[selectedModel as keyof typeof elevenLabsModelLanguages] || [];
      const reverseMapping: { [key: string]: string } = {};

      supportedLanguages.forEach(langCode => {
        if (elevenLabsLanguageMapping[langCode as keyof typeof elevenLabsLanguageMapping]) {
          const languageName = elevenLabsLanguageMapping[langCode as keyof typeof elevenLabsLanguageMapping];
          reverseMapping[languageName] = langCode;
        }
      });

      console.log('🔍 11Labs - Reverse Language Mapping:', reverseMapping);
      return reverseMapping;
    }
    return openaiReverseLanguageMapping;
  };

  // Function to get current transcriber language mapping based on provider and model
  const getCurrentTranscriberLanguageMapping = () => {
    if (selectedTranscriberProvider === 'Deepgram') {
      // Get supported languages for the selected model
      const supportedLanguages = deepgramModelLanguages[selectedTranscriberModel as keyof typeof deepgramModelLanguages] || [];
      const filteredMapping: { [key: string]: string } = {};
      supportedLanguages.forEach(langCode => {
        if (deepgramLanguageMapping[langCode as keyof typeof deepgramLanguageMapping]) {
          filteredMapping[langCode] = deepgramLanguageMapping[langCode as keyof typeof deepgramLanguageMapping];
        }
      });
      return filteredMapping;
    } else if (selectedTranscriberProvider === 'OpenAI') {
      // For OpenAI STT, prioritize English first, then other languages
      const prioritizedMapping: { [key: string]: string } = {};

      // Add English first
      if (openaiLanguageMapping['en']) {
        prioritizedMapping['en'] = openaiLanguageMapping['en'];
      }

      // Add all other languages except English
      Object.entries(openaiLanguageMapping).forEach(([code, name]) => {
        if (code !== 'en') {
          prioritizedMapping[code] = name;
        }
      });

      return prioritizedMapping;
    }
    // Fallback
    return {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese'
    };
  };

  // Load state from centralized configuration when component mounts or when configuration changes
  useEffect(() => {
    console.log('🔄 VoiceConfig useEffect triggered:', {
      voiceConfiguration,
      transcriberConfiguration,
      isUserChangingProvider,
      isUserChangingTranscriberProvider,
      isUserChangingVoiceField
    });

    // Load from centralized configuration
    if (voiceConfiguration && !isUserChangingProvider && !isUserChangingVoiceField && !isUserChangingApiKey) {
      console.log('🔄 Loading voice state from centralized configuration:', voiceConfiguration);
      console.log('🔄 Current voiceId state:', voiceId, 'Configuration voiceId:', voiceConfiguration.voiceId);

      // Handle provider - check both UI format and backend format
      let provider = voiceConfiguration.selectedVoiceProvider;
      if (!provider && voiceConfiguration.provider) {
        // Map backend format to UI format
        if (voiceConfiguration.provider === 'openai') provider = 'OpenAI';
        else if (voiceConfiguration.provider === 'elevenlabs') provider = '11Labs';
        else if (voiceConfiguration.provider === 'cartesian') provider = 'Cartesia';
      }
      if (provider) {
        console.log('🔄 Setting voice provider:', provider);
        setSelectedVoiceProvider(provider);
      }
      if (voiceConfiguration.selectedLanguage) {
        console.log('🔄 Setting language:', voiceConfiguration.selectedLanguage);
        setSelectedLanguage(voiceConfiguration.selectedLanguage);
      }
      if (voiceConfiguration.speedValue !== undefined) {
        console.log('🔄 Setting speed:', voiceConfiguration.speedValue);
        setSpeedValue(voiceConfiguration.speedValue);
      }
      // Load API key from configuration if it exists (from MongoDB)
      // Check both UI format (apiKey) and backend format (nested objects)
      // Also check MongoDB config (agentTtsConfig) which has the saved API keys
      let apiKeyFromConfig = '';
      
      // First check MongoDB config (agentTtsConfig) - this has the saved API keys from MongoDB
      if (agentTtsConfig) {
        const currentProvider = provider || selectedVoiceProvider;
        if (currentProvider === 'OpenAI' && agentTtsConfig.openai?.api_key) {
          apiKeyFromConfig = agentTtsConfig.openai.api_key;
          console.log('🔑 Loading OpenAI API key from MongoDB config');
        } else if (currentProvider === '11Labs' && agentTtsConfig.elevenlabs?.api_key) {
          apiKeyFromConfig = agentTtsConfig.elevenlabs.api_key;
          console.log('🔑 Loading 11Labs API key from MongoDB config');
        } else if (currentProvider === 'Cartesia' && agentTtsConfig.cartesian?.tts_api_key) {
          apiKeyFromConfig = agentTtsConfig.cartesian.tts_api_key;
          console.log('🔑 Loading Cartesia API key from MongoDB config');
        }
      }
      
      // Fallback to UI format (flattened) if not found in MongoDB
      if (!apiKeyFromConfig && voiceConfiguration.apiKey) {
        apiKeyFromConfig = voiceConfiguration.apiKey;
      } else if (!apiKeyFromConfig) {
        // Check backend format (nested objects) - check all providers
        if (voiceConfiguration.openai?.api_key) {
          apiKeyFromConfig = voiceConfiguration.openai.api_key;
        } else if (voiceConfiguration.elevenlabs?.api_key) {
          apiKeyFromConfig = voiceConfiguration.elevenlabs.api_key;
        } else if (voiceConfiguration.cartesian?.tts_api_key) {
          apiKeyFromConfig = voiceConfiguration.cartesian.tts_api_key;
        }
      }
      
      // Set API key from config if it exists and current field is empty
      if (apiKeyFromConfig && !apiKey && !isUserChangingApiKey) {
        setApiKey(apiKeyFromConfig);
      } else if (!apiKeyFromConfig && !apiKey) {
        // If no API key in config and field is empty, keep it empty
        setApiKey('');
      }
      if (voiceConfiguration.voiceId !== undefined) {
        console.log('🔄 Setting voice ID:', voiceConfiguration.voiceId);
        setVoiceId(voiceConfiguration.voiceId);
        lastVoiceIdRef.current = voiceConfiguration.voiceId;
      }
      if (voiceConfiguration.selectedVoice) {
        console.log('🔄 Setting selected voice:', voiceConfiguration.selectedVoice);
        setSelectedVoice(voiceConfiguration.selectedVoice);
      }
      if (voiceConfiguration.stability !== undefined) {
        console.log('🔄 Setting stability:', voiceConfiguration.stability);
        setStability(voiceConfiguration.stability);
      }
      if (voiceConfiguration.similarityBoost !== undefined) {
        console.log('🔄 Setting similarity boost:', voiceConfiguration.similarityBoost);
        setSimilarityBoost(voiceConfiguration.similarityBoost);
      }
      if (voiceConfiguration.responseFormat) {
        console.log('🔄 Setting response format:', voiceConfiguration.responseFormat);
        setResponseFormat(voiceConfiguration.responseFormat);
      }
      if (voiceConfiguration.selectedModel) {
        console.log('🔄 Setting selected model:', voiceConfiguration.selectedModel);
        setSelectedModel(voiceConfiguration.selectedModel);
      }
    }

    // Load transcriber configuration
    if (transcriberConfiguration && !isUserChangingTranscriberProvider && !isUserChangingTranscriberApiKey) {
      console.log('🔄 Loading transcriber state from centralized configuration:', transcriberConfiguration);

      // Handle provider - check both UI format and backend format
      let provider = transcriberConfiguration.selectedTranscriberProvider;
      if (!provider && transcriberConfiguration.provider) {
        // Map backend format to UI format
        if (transcriberConfiguration.provider === 'deepgram') provider = 'Deepgram';
        else if (transcriberConfiguration.provider === 'openai') provider = 'OpenAI';
      }
      if (provider) {
        console.log('🔄 Setting transcriber provider:', provider);
        setSelectedTranscriberProvider(provider);
      }
      if (transcriberConfiguration.selectedTranscriberLanguage) {
        console.log('🔄 Setting transcriber language:', transcriberConfiguration.selectedTranscriberLanguage);
        setSelectedTranscriberLanguage(transcriberConfiguration.selectedTranscriberLanguage);
      }
      if (transcriberConfiguration.selectedTranscriberModel) {
        console.log('🔄 Setting transcriber model:', transcriberConfiguration.selectedTranscriberModel);
        setSelectedTranscriberModel(transcriberConfiguration.selectedTranscriberModel);
      }
      // Load API key from configuration if it exists (from MongoDB)
      // Check both UI format (transcriberApiKey) and backend format (nested objects)
      // Also check MongoDB config (agentSttConfig) which has the saved API keys
      let apiKeyFromConfig = '';
      
      // First check MongoDB config (agentSttConfig) - this has the saved API keys from MongoDB
      if (agentSttConfig) {
        const currentProvider = provider || selectedTranscriberProvider;
        if (currentProvider === 'Deepgram' && agentSttConfig.deepgram?.api_key) {
          apiKeyFromConfig = agentSttConfig.deepgram.api_key;
          console.log('🔑 Loading Deepgram API key from MongoDB config');
        } else if (currentProvider === 'OpenAI' && agentSttConfig.openai?.api_key) {
          apiKeyFromConfig = agentSttConfig.openai.api_key;
          console.log('🔑 Loading OpenAI transcriber API key from MongoDB config');
        }
      }
      
      // Fallback to UI format (flattened) if not found in MongoDB
      if (!apiKeyFromConfig && transcriberConfiguration.transcriberApiKey) {
        apiKeyFromConfig = transcriberConfiguration.transcriberApiKey;
      } else if (!apiKeyFromConfig) {
        // Check backend format (nested objects) - check all providers
        if (transcriberConfiguration.deepgram?.api_key) {
          apiKeyFromConfig = transcriberConfiguration.deepgram.api_key;
        } else if (transcriberConfiguration.openai?.api_key) {
          apiKeyFromConfig = transcriberConfiguration.openai.api_key;
        }
      }
      
      // Set API key from config if it exists and current field is empty
      if (apiKeyFromConfig && !transcriberApiKey && !isUserChangingTranscriberApiKey) {
        setTranscriberApiKey(apiKeyFromConfig);
      } else if (!apiKeyFromConfig && !transcriberApiKey) {
        // If no API key in config and field is empty, keep it empty
        setTranscriberApiKey('');
      }
      if (transcriberConfiguration.punctuateEnabled !== undefined) {
        console.log('🔄 Setting punctuate enabled:', transcriberConfiguration.punctuateEnabled);
        setPunctuateEnabled(transcriberConfiguration.punctuateEnabled);
      }
      if (transcriberConfiguration.smartFormatEnabled !== undefined) {
        console.log('🔄 Setting smart format enabled:', transcriberConfiguration.smartFormatEnabled);
        setSmartFormatEnabled(transcriberConfiguration.smartFormatEnabled);
      }
      if (transcriberConfiguration.interimResultEnabled !== undefined) {
        console.log('🔄 Setting interim result enabled:', transcriberConfiguration.interimResultEnabled);
        setInterimResultEnabled(transcriberConfiguration.interimResultEnabled);
      }
    }
  }, [voiceConfiguration, transcriberConfiguration, isUserChangingProvider, isUserChangingTranscriberProvider, isUserChangingApiKey, isUserChangingTranscriberApiKey, apiKey, transcriberApiKey]);

  // Save state to centralized state whenever it changes
  const saveStateToCentralized = useCallback((updates: any = {}) => {
    try {
      const currentState = {
        selectedVoiceProvider,
        selectedLanguage,
        speedValue,
        apiKey,
        voiceId,
        selectedVoice,
        stability,
        similarityBoost,
        responseFormat,
        selectedModel,
        ...updates
      };

      console.log('📤 VoiceConfig: Saving state to centralized config:', currentState);

      // Call parent's onConfigChange
      if (onConfigChange) {
        onConfigChange(currentState);
      }
    } catch (error) {
      console.warn('Failed to save voice config state to centralized state:', error);
    }
  }, [selectedVoiceProvider, selectedLanguage, speedValue, apiKey, voiceId, selectedVoice, stability, similarityBoost, responseFormat, selectedModel, onConfigChange]);

  // Fetch ElevenLabs voices
  const fetchElevenLabsVoices = useCallback(async () => {
    if (selectedVoiceProvider !== '11Labs' || availableVoices.length > 0) return;
    
    setIsLoadingVoices(true);
    setVoicesError('');
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }
      
      const data = await response.json();
      setAvailableVoices(data.voices || []);
      console.log('✅ Fetched ElevenLabs voices:', data.voices?.length || 0);
      console.log('🔍 Voice details:', data.voices?.map(v => ({
        name: v.name,
        hasLabels: Object.keys(v.labels || {}).length > 0,
        labels: v.labels,
        description: v.description?.substring(0, 50) + '...'
      })));
    } catch (error) {
      console.error('❌ Error fetching ElevenLabs voices:', error);
      setVoicesError(error instanceof Error ? error.message : 'Failed to fetch voices');
    } finally {
      setIsLoadingVoices(false);
    }
  }, [selectedVoiceProvider, apiKey, availableVoices.length]);

  // Load default values on component mount
  useEffect(() => {
    const defaultVoiceIds = agentConfigService.getDefaultVoiceIds();

    // Only set defaults if we don't have existing configuration
    if (!voiceConfiguration) {
      // Set default API key to empty string (user can enter their own)
      setApiKey('');
      
      // Set default voice ID based on provider
      switch (selectedVoiceProvider) {
        case 'OpenAI':
          // OpenAI doesn't use voice ID
          setVoiceId('');
          break;
        case '11Labs':
          // Set default voice ID for 11Labs
          setVoiceId('pNInz6obpgDQGcFmaJgB');
          break;
        case 'Cartesia':
          setVoiceId(defaultVoiceIds.cartesia || '');
          break;
      }
    }
  }, [selectedVoiceProvider, voiceConfiguration]);

  // Fetch ElevenLabs voices when provider changes to 11Labs
  useEffect(() => {
    if (selectedVoiceProvider === '11Labs' && apiKey) {
      fetchElevenLabsVoices();
    }
  }, [selectedVoiceProvider, apiKey, fetchElevenLabsVoices]);

  // Clear voice selection if current voice doesn't support selected language/model
  useEffect(() => {
    if (selectedVoiceProvider === '11Labs' && voiceId && availableVoices.length > 0) {
      // Get language code from selected language name
      const reverseMapping = getCurrentReverseLanguageMapping();
      const languageCode = reverseMapping[selectedLanguage] || 'en';
      
      // Check if current voice supports the selected language for the selected model
      const currentVoice = availableVoices.find((voice: any) => voice.voice_id === voiceId);
      const isSupported = currentVoice?.verified_languages?.some((lang: any) => 
        lang.model_id === selectedModel && lang.language === languageCode
      );
      
      if (!isSupported) {
        console.log('⚠️ Current voice does not support selected language/model, clearing selection');
        setVoiceId('');
        saveStateToCentralized({ voiceId: '' });
      }
    }
  }, [selectedLanguage, selectedModel, selectedVoiceProvider, voiceId, availableVoices]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (voiceFieldChangeTimeoutRef.current) {
        clearTimeout(voiceFieldChangeTimeoutRef.current);
      }
      if (providerChangeTimeoutRef.current) {
        clearTimeout(providerChangeTimeoutRef.current);
      }
    };
  }, []);

  // Load default transcriber API key when transcriber provider changes
  useEffect(() => {
    // API key defaults to empty (user can enter their own)
    if (!transcriberConfiguration?.transcriberApiKey) {
      setTranscriberApiKey('');
    }
  }, [selectedTranscriberProvider, transcriberConfiguration]);

  // Reset language when transcriber model changes
  React.useEffect(() => {
    const languageMapping = getCurrentTranscriberLanguageMapping();
    const availableLanguages = Object.keys(languageMapping);

    // If current selected language is not available for the new model, reset to first available
    if (availableLanguages.length > 0 && !availableLanguages.includes(selectedTranscriberLanguage)) {
      console.log('🔄 Resetting transcriber language for model change');
      setSelectedTranscriberLanguage(availableLanguages[0]);
    }
  }, [selectedTranscriberModel, selectedTranscriberProvider, selectedTranscriberLanguage]);

  // Save transcriber state to centralized state whenever it changes
  const saveTranscriberStateToCentralized = useCallback((updates: any = {}) => {
    try {
      const currentState = {
        selectedTranscriberProvider,
        selectedTranscriberLanguage,
        selectedTranscriberModel,
        transcriberApiKey,
        punctuateEnabled,
        smartFormatEnabled,
        interimResultEnabled,
        ...updates
      };

      console.log('📤 TranscriberConfig: Saving state to centralized config:', currentState);

      // Call parent's onTranscriberConfigChange
      if (onTranscriberConfigChange) {
        onTranscriberConfigChange(currentState);
      }
    } catch (error) {
      console.warn('Failed to save transcriber config state to centralized state:', error);
    }
  }, [selectedTranscriberProvider, selectedTranscriberLanguage, selectedTranscriberModel, transcriberApiKey, punctuateEnabled, smartFormatEnabled, interimResultEnabled, onTranscriberConfigChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (providerChangeTimeoutRef.current) {
        clearTimeout(providerChangeTimeoutRef.current);
      }
      if (transcriberProviderChangeTimeoutRef.current) {
        clearTimeout(transcriberProviderChangeTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to get display value for API key - show only first few characters
  const getApiKeyDisplayValue = (actualKey: string, isFocused: boolean) => {
    if (!actualKey) return '';
    // If focused, show actual value for editing
    if (isFocused) return actualKey;
    // If not focused, show first 8 characters + masked rest
    if (actualKey.length <= 8) return actualKey;
    const firstChars = actualKey.substring(0, 8);
    const masked = '•'.repeat(Math.min(actualKey.length - 8, 32));
    return firstChars + masked;
  };

  // Get unique languages supported by a voice for the selected model
  const getVoiceSupportedLanguages = (voice: any, modelId: string) => {
    if (!voice.verified_languages || !Array.isArray(voice.verified_languages)) {
      return [];
    }
    
    // Get unique languages that support the selected model
    const supportedLanguages = new Set<string>();
    voice.verified_languages.forEach((lang: any) => {
      if (lang.model_id === modelId && lang.language) {
        supportedLanguages.add(lang.language);
      }
    });
    
    // Convert to array and map to display names
    return Array.from(supportedLanguages)
      .map(langCode => elevenLabsLanguageMapping[langCode as keyof typeof elevenLabsLanguageMapping] || langCode)
      .filter(Boolean)
      .sort();
  };

  // Get unique genders from available voices
  const getAvailableGenders = () => {
    if (selectedVoiceProvider !== '11Labs' || availableVoices.length === 0) {
      return [];
    }
    
    const genders = new Set<string>();
    availableVoices.forEach((voice: any) => {
      if (voice.labels?.gender) {
        genders.add(voice.labels.gender);
      }
    });
    
    return Array.from(genders).sort();
  };

  // Filter voices by selected language, model, and gender
  const getFilteredVoices = () => {
    if (selectedVoiceProvider !== '11Labs' || availableVoices.length === 0) {
      return availableVoices;
    }

    // Get language code from selected language name
    const reverseMapping = getCurrentReverseLanguageMapping();
    const languageCode = reverseMapping[selectedLanguage] || 'en';
    
    // Filter voices that support the selected language for the selected model and match gender
    return availableVoices.filter((voice: any) => {
      // Filter by gender if selected
      if (selectedGender && voice.labels?.gender !== selectedGender) {
        return false;
      }
      
      if (!voice.verified_languages || !Array.isArray(voice.verified_languages)) {
        return false; // Skip voices without verified languages
      }
      
      // Check if voice supports the selected language for the selected model
      return voice.verified_languages.some((lang: any) => 
        lang.model_id === selectedModel && lang.language === languageCode
      );
    });
  };

  // Format voice display name (without gender and languages)
  const formatVoiceDisplayName = (voice: any) => {
    const { name, labels, description } = voice;
    const accent = labels?.accent || '';
    const descriptive = labels?.descriptive || '';
    const age = labels?.age || '';
    
    // Build characteristics array (excluding gender), filtering out empty values
    const characteristics = [accent, descriptive, age].filter(Boolean);
    
    // Build display string (without languages)
    let displayParts = [name];
    
    if (characteristics.length > 0) {
      displayParts.push(characteristics.join(', '));
    }
    
    // If we have parts, join them
    if (displayParts.length > 1) {
      return displayParts.join(' - ');
    }
    
    // If no characteristics but we have description, show a shortened version
    if (description) {
      const shortDesc = description.length > 50 ? description.substring(0, 50) + '...' : description;
      return `${name} - ${shortDesc}`;
    }
    
    // Fallback to just the name
    return name;
  };

  const handleSpeedChange = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue)) {
      setSpeedValue(numValue);
      saveStateToCentralized({ speedValue: numValue });
    }
  };


  // Note: Removed problematic useEffect that was causing speed fluctuation
  // Individual change handlers now handle all state updates and centralized state saving

  // Note: Removed problematic transcriber useEffect that was causing fluctuation
  // Individual change handlers now handle all state updates and centralized state saving

  // Handle provider changes with proper state management
  const handleProviderChange = (newProvider: string) => {
    console.log('🔄 Provider changing from', selectedVoiceProvider, 'to', newProvider);

    // Set flag to prevent existingConfig from overriding user selection
    setIsUserChangingProvider(true);

    // Clear any pending timeouts
    if (providerChangeTimeoutRef.current) {
      clearTimeout(providerChangeTimeoutRef.current);
    }

    // Reset model and voice when provider changes - use dynamic defaults
    let defaultModel = '';
    let defaultVoice = '';

    if (newProvider === 'OpenAI') {
      defaultModel = voiceProviders['OpenAI'][0]; // 'tts-1'
      defaultVoice = 'alloy';
    } else if (newProvider === 'Cartesia') {
      defaultModel = voiceProviders['Cartesia'][0]; // 'sonic-2'
      defaultVoice = voiceProviders['Cartesia'][0]; // 'sonic-2'
    } else if (newProvider === '11Labs') {
      defaultModel = Object.keys(elevenLabsModelNames)[0]; // 'eleven_v3'
      defaultVoice = 'alloy';
    }

    // Load the correct voice ID for the new provider
    const defaultVoiceIds = agentConfigService.getDefaultVoiceIds();

    let newApiKey = '';
    let newVoiceId = '';

    // Check if there's already a voice ID in the centralized configuration
    const existingVoiceId = voiceConfiguration?.voiceId || '';

    // Check if there's an API key in the configuration for the new provider
    // Each provider should have its own API key, so we load the one for the new provider
    // Check both the centralized UI config AND the MongoDB agent config
    let apiKeyFromConfig = '';
    
    // First check MongoDB config (agentTtsConfig) - this has the saved API keys
    if (agentTtsConfig) {
      if (newProvider === 'OpenAI' && agentTtsConfig.openai?.api_key) {
        apiKeyFromConfig = agentTtsConfig.openai.api_key;
        console.log('🔑 Found OpenAI API key in MongoDB config');
      } else if (newProvider === '11Labs' && agentTtsConfig.elevenlabs?.api_key) {
        apiKeyFromConfig = agentTtsConfig.elevenlabs.api_key;
        console.log('🔑 Found 11Labs API key in MongoDB config');
      } else if (newProvider === 'Cartesia' && agentTtsConfig.cartesian?.tts_api_key) {
        apiKeyFromConfig = agentTtsConfig.cartesian.tts_api_key;
        console.log('🔑 Found Cartesia API key in MongoDB config');
      }
    }
    
    // Fallback to centralized UI config if not found in MongoDB
    if (!apiKeyFromConfig && voiceConfiguration) {
      if (newProvider === 'OpenAI' && voiceConfiguration.openai?.api_key) {
        apiKeyFromConfig = voiceConfiguration.openai.api_key;
      } else if (newProvider === '11Labs' && voiceConfiguration.elevenlabs?.api_key) {
        apiKeyFromConfig = voiceConfiguration.elevenlabs.api_key;
      } else if (newProvider === 'Cartesia' && voiceConfiguration.cartesian?.tts_api_key) {
        apiKeyFromConfig = voiceConfiguration.cartesian.tts_api_key;
      }
    }

    switch (newProvider) {
      case 'OpenAI':
        // Load API key for the new provider from config, otherwise start empty
        newApiKey = apiKeyFromConfig || '';
        // For OpenAI, we don't use voice ID, so clear it
        newVoiceId = '';
        break;
      case '11Labs':
        // Load API key for the new provider from config, otherwise start empty
        newApiKey = apiKeyFromConfig || '';
        // Preserve existing voice ID if user has entered one, otherwise use default
        newVoiceId = existingVoiceId || '';
        break;
      case 'Cartesia':
        // Load API key for the new provider from config, otherwise start empty
        newApiKey = apiKeyFromConfig || '';
        // Preserve existing voice ID if user has entered one, otherwise use default
        newVoiceId = existingVoiceId || defaultVoiceIds.cartesia || '';
        break;
    }

    // Update the provider, model, voice, API key, and voice ID state
    setSelectedVoiceProvider(newProvider);
    setSelectedModel(defaultModel);
    setSelectedVoice(defaultVoice);
    setApiKey(newApiKey);
    setVoiceId(newVoiceId);

    console.log('🔄 Reset model to:', defaultModel, 'voice to:', defaultVoice, 'API key updated');

    // Save to centralized state with correct API key
    saveStateToCentralized({
      selectedVoiceProvider: newProvider,
      selectedModel: defaultModel,
      selectedVoice: defaultVoice,
      apiKey: newApiKey,
      voiceId: newVoiceId
    });

    console.log('✅ Provider changed to', newProvider, 'with correct API key');

    // Reset the flag after a delay
    providerChangeTimeoutRef.current = setTimeout(() => {
      setIsUserChangingProvider(false);
    }, 300);
  };



  // Handle transcriber provider changes
  const handleTranscriberProviderChange = (provider: string) => {
    console.log('🔄 Transcriber provider changing from', selectedTranscriberProvider, 'to', provider);

    // Set flag to prevent existingConfig from overriding user selection
    setIsUserChangingTranscriberProvider(true);

    // Clear any pending timeouts
    if (transcriberProviderChangeTimeoutRef.current) {
      clearTimeout(transcriberProviderChangeTimeoutRef.current);
    }

    // Check if there's an API key in the configuration for the new provider
    // Each provider should have its own API key, so we load the one for the new provider
    // Check both the centralized UI config AND the MongoDB agent config
    let apiKeyFromConfig = '';
    
    // First check MongoDB config (agentSttConfig) - this has the saved API keys
    if (agentSttConfig) {
      if (provider === 'Deepgram' && agentSttConfig.deepgram?.api_key) {
        apiKeyFromConfig = agentSttConfig.deepgram.api_key;
        console.log('🔑 Found Deepgram API key in MongoDB config');
      } else if (provider === 'OpenAI' && agentSttConfig.openai?.api_key) {
        apiKeyFromConfig = agentSttConfig.openai.api_key;
        console.log('🔑 Found OpenAI transcriber API key in MongoDB config');
      }
    }
    
    // Fallback to centralized UI config if not found in MongoDB
    if (!apiKeyFromConfig && transcriberConfiguration) {
      if (provider === 'Deepgram' && transcriberConfiguration.deepgram?.api_key) {
        apiKeyFromConfig = transcriberConfiguration.deepgram.api_key;
      } else if (provider === 'OpenAI' && transcriberConfiguration.openai?.api_key) {
        apiKeyFromConfig = transcriberConfiguration.openai.api_key;
      }
    }
    
    // Load API key for the new provider from config, otherwise start empty
    let newTranscriberApiKey = apiKeyFromConfig || '';

    // Reset model to first available model for the new provider
    const providerData = transcriberProviders[provider as keyof typeof transcriberProviders];
    let defaultModel = '';
    if (providerData && providerData.length > 0) {
      defaultModel = providerData[0];
    }

    // Reset language to first available language for the new provider
    const languageMapping = getCurrentTranscriberLanguageMapping();
    const availableLanguages = Object.keys(languageMapping);
    // For OpenAI, prefer 'en' (English), otherwise use first available
    const defaultLanguage = availableLanguages.length > 0
      ? (availableLanguages.includes('en') ? 'en' : availableLanguages[0])
      : 'en-US';

    // Update all state
    setSelectedTranscriberProvider(provider);
    setSelectedTranscriberModel(defaultModel);
    setTranscriberApiKey(newTranscriberApiKey);
    setSelectedTranscriberLanguage(defaultLanguage);

    console.log('🔄 Reset transcriber model to:', defaultModel, 'language to:', defaultLanguage, 'API key updated');

    // Save to centralized state with correct API key
    saveTranscriberStateToCentralized({
      selectedTranscriberProvider: provider,
      selectedTranscriberModel: defaultModel,
      selectedTranscriberLanguage: defaultLanguage,
      transcriberApiKey: newTranscriberApiKey
    });

    console.log('✅ Transcriber provider changed to', provider, 'with correct API key');

    // Reset the flag after a delay
    transcriberProviderChangeTimeoutRef.current = setTimeout(() => {
      setIsUserChangingTranscriberProvider(false);
    }, 300);
  };

  const renderProviderSpecificFields = () => {
    switch (selectedVoiceProvider) {
      case 'OpenAI':
        return (
          <div className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                API Key
              </label>
              <input
                type="text"
                value={getApiKeyDisplayValue(apiKey, isApiKeyFocused)}
                onChange={(e) => {
                  setIsUserChangingApiKey(true);
                  setApiKey(e.target.value);
                  saveStateToCentralized({ apiKey: e.target.value });
                  // Reset flag after a short delay to allow state to settle
                  setTimeout(() => setIsUserChangingApiKey(false), 500);
                }}
                onFocus={() => setIsApiKeyFocused(true)}
                onBlur={() => setIsApiKeyFocused(false)}
                disabled={!isEditing}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                  ? isDarkMode
                    ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                placeholder="Enter API key"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Voice
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => {
                    setSelectedVoice(e.target.value);
                    saveStateToCentralized({ selectedVoice: e.target.value });
                  }}
                  disabled={!isEditing}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                    ? isDarkMode
                      ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                >
                  {Object.entries(openaiModels).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Response Format
                </label>
                <select
                  value={responseFormat}
                  onChange={(e) => {
                    setIsUserChangingVoiceField(true);
                    setResponseFormat(e.target.value);
                    saveStateToCentralized({ responseFormat: e.target.value });
                    // allow central state to settle, then release the guard
                    setTimeout(() => setIsUserChangingVoiceField(false), 0);
                  }}
                  disabled={!isEditing}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                    ? isDarkMode
                      ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                >
                  {Object.entries(responseFormats).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      case '11Labs':
        return (
          <div className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                API Key
              </label>
              <input
                type="text"
                value={getApiKeyDisplayValue(apiKey, isApiKeyFocused)}
                onChange={(e) => {
                  setIsUserChangingApiKey(true);
                  setApiKey(e.target.value);
                  saveStateToCentralized({ apiKey: e.target.value });
                  // Reset flag after a short delay to allow state to settle
                  setTimeout(() => setIsUserChangingApiKey(false), 500);
                }}
                onFocus={() => setIsApiKeyFocused(true)}
                onBlur={() => setIsApiKeyFocused(false)}
                disabled={!isEditing}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                  ? isDarkMode
                    ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                placeholder="Enter API key"
              />
            </div>
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Gender
              </label>
              <select
                value={selectedGender}
                onChange={(e) => {
                  setSelectedGender(e.target.value);
                  // Clear voice selection when gender changes
                  if (voiceId) {
                    setVoiceId('');
                    saveStateToCentralized({ voiceId: '' });
                  }
                }}
                disabled={!isEditing || availableVoices.length === 0}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing || availableVoices.length === 0
                  ? isDarkMode
                    ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
              >
                <option value="">All Genders</option>
                {getAvailableGenders().map((gender) => (
                  <option key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Voice Selection
              </label>
              {isLoadingVoices ? (
                <div className={`w-full p-3 rounded-xl border ${isDarkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-100/50'}`}>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Loading voices...
                    </span>
                  </div>
                </div>
              ) : voicesError ? (
                <div className={`w-full p-3 rounded-xl border ${isDarkMode ? 'border-red-600 bg-red-900/20' : 'border-red-300 bg-red-50'}`}>
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-500" />
                    <span className={`text-sm ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                      {voicesError}
                    </span>
                  </div>
                </div>
              ) : (
                <select
                  value={voiceId || ''}
                  onChange={(e) => {
                    setIsUserChangingVoiceField(true);
                    setVoiceId(e.target.value);
                    lastVoiceIdRef.current = e.target.value;
                    saveStateToCentralized({ voiceId: e.target.value });
                    
                    // Clear any existing timeout
                    if (voiceFieldChangeTimeoutRef.current) {
                      clearTimeout(voiceFieldChangeTimeoutRef.current);
                    }
                    
                    // Reset the flag after a delay to prevent immediate override
                    voiceFieldChangeTimeoutRef.current = setTimeout(() => {
                      setIsUserChangingVoiceField(false);
                    }, 2000);
                  }}
                  disabled={!isEditing || getFilteredVoices().length === 0}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing || getFilteredVoices().length === 0
                    ? isDarkMode
                      ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                >
                  <option value="">
                    {(() => {
                      const filteredVoices = getFilteredVoices();
                      if (filteredVoices.length === 0) {
                        return availableVoices.length === 0 
                          ? 'No voices available' 
                          : `No voices match the selected filters`;
                      }
                      return 'Select a voice...';
                    })()}
                  </option>
                  {getFilteredVoices().map((voice) => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {formatVoiceDisplayName(voice)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Stability: {stability}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={stability}
                  onChange={(e) => {
                    setStability(parseFloat(e.target.value));
                    saveStateToCentralized({ stability: parseFloat(e.target.value) });
                  }}
                  disabled={!isEditing}
                  className={`w-full h-2 rounded-lg appearance-none ${!isEditing
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                    } ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>0.5</span>
                  <span>1</span>
                </div>
              </div>
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Similarity Boost: {similarityBoost}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={similarityBoost}
                  onChange={(e) => {
                    setSimilarityBoost(parseFloat(e.target.value));
                    saveStateToCentralized({ similarityBoost: parseFloat(e.target.value) });
                  }}
                  disabled={!isEditing}
                  className={`w-full h-2 rounded-lg appearance-none ${!isEditing
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                    } ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>0.5</span>
                  <span>1</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Cartesia':
        return (
          <div className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                API Key
              </label>
              <input
                type="text"
                value={getApiKeyDisplayValue(apiKey, isApiKeyFocused)}
                onChange={(e) => {
                  setIsUserChangingApiKey(true);
                  setApiKey(e.target.value);
                  saveStateToCentralized({ apiKey: e.target.value });
                  // Reset flag after a short delay to allow state to settle
                  setTimeout(() => setIsUserChangingApiKey(false), 500);
                }}
                onFocus={() => setIsApiKeyFocused(true)}
                onBlur={() => setIsApiKeyFocused(false)}
                disabled={!isEditing}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                  ? isDarkMode
                    ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                placeholder="Enter API key"
              />
            </div>
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Voice ID
              </label>
              <input
                type="text"
                value={voiceId ? maskApiKey(voiceId) : '••••••••••••••••••••••••••••••••'}
                readOnly
                className={`w-full p-3 rounded-xl border transition-all duration-300 cursor-not-allowed text-sm sm:text-base ${isDarkMode
                  ? 'border-gray-600 bg-gray-700/50 text-gray-400'
                  : 'border-gray-200 bg-gray-100/50 text-gray-500'
                  }`}
                placeholder="Default voice ID loaded"
              />
            </div>
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Speed: {speedValue}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={speedValue}
                  onChange={(e) => {
                    handleSpeedChange(e.target.value);
                    saveStateToCentralized({ speedValue: parseFloat(e.target.value) });
                  }}
                  disabled={!isEditing}
                  className={`flex-1 h-2 rounded-lg appearance-none ${!isEditing
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                    } ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                />
                <input
                  type="number"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={speedValue}
                  onChange={(e) => {
                    handleSpeedChange(e.target.value);
                    saveStateToCentralized({ speedValue: parseFloat(e.target.value) });
                  }}
                  disabled={!isEditing}
                  className={`w-16 p-2 rounded-lg border text-center text-sm ${!isEditing
                    ? isDarkMode
                      ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-2.0x</span>
                <span>0.0x</span>
                <span>2.0x</span>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              No additional configuration required for {selectedVoiceProvider}.
            </p>
          </div>
        );
    }
  };

  return (
    <div ref={ref} className="space-y-6">

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider and Voice Selection */}
        <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
              <Mic className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Voice Selection</h4>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Provider
              </label>
              <select
                value={selectedVoiceProvider}
                onChange={(e) => {
                  handleProviderChange(e.target.value);
                }}
                disabled={!isEditing}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                  ? isDarkMode
                    ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                    : 'bg-gray-100/50 border-gray-200 text-gray-900'
                  }`}
              >
                {Object.keys(voiceProviders).map((provider) => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  saveStateToCentralized({ selectedModel: e.target.value });
                }}
                disabled={!isEditing}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                  ? isDarkMode
                    ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
              >
                {(() => {
                  // Get models based on provider
                  let models: string[] = [];
                  if (selectedVoiceProvider === '11Labs') {
                    models = Object.keys(elevenLabsModelNames);
                  } else if (selectedVoiceProvider === 'OpenAI') {
                    models = voiceProviders['OpenAI'];
                  } else if (selectedVoiceProvider === 'Cartesia') {
                    models = voiceProviders['Cartesia'];
                  }

                  console.log('🔍 Available models for', selectedVoiceProvider, ':', models);

                  return models.map((model) => (
                    <option key={model} value={model}>
                      {selectedVoiceProvider === '11Labs' ? elevenLabsModelNames[model as keyof typeof elevenLabsModelNames] : model}
                    </option>
                  ));
                })()}
              </select>
            </div>
          </div>
        </div>

        {/* Language and Speed */}
        <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <Mic className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Voice Settings</h4>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  if (selectedVoiceProvider === 'OpenAI') {
                    return; // languages fixed for OpenAI voices
                  }
                  setSelectedLanguage(e.target.value);
                  saveStateToCentralized({ selectedLanguage: e.target.value });
                }}
                disabled={!isEditing || selectedVoiceProvider === 'OpenAI'}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm sm:text-base ${!isEditing || selectedVoiceProvider === 'OpenAI'
                  ? isDarkMode
                    ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
              >
                {(() => {
                  const languageMapping = getCurrentLanguageMapping();
                  console.log('🔍 Language Mapping for dropdown:', languageMapping);
                  console.log('🔍 Selected Language:', selectedLanguage);
                  console.log('🔍 Selected Model:', selectedModel);
                  console.log('🔍 Selected Voice Provider:', selectedVoiceProvider);

                  if (Object.keys(languageMapping).length === 0) {
                    console.warn('⚠️ No languages available for current model/provider combination');
                    return <option value="">No languages available</option>;
                  }

                  return Object.entries(languageMapping).map(([code, name]) => (
                    <option key={code} value={name}>{name}</option>
                  ));
                })()}
              </select>
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Speed: {speedValue}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.25"
                  max="4.0"
                  step="0.25"
                  value={speedValue}
                  onChange={(e) => {
                    handleSpeedChange(e.target.value);
                    saveStateToCentralized({ speedValue: parseFloat(e.target.value) });
                  }}
                  disabled={!isEditing}
                  className={`flex-1 h-2 rounded-lg appearance-none ${!isEditing
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                    } ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
                />
                <input
                  type="number"
                  min="0.25"
                  max="4.0"
                  step="0.25"
                  value={speedValue}
                  onChange={(e) => {
                    handleSpeedChange(e.target.value);
                    saveStateToCentralized({ speedValue: parseFloat(e.target.value) });
                  }}
                  disabled={!isEditing}
                  className={`w-16 p-2 rounded-lg border text-center text-sm ${!isEditing
                    ? isDarkMode
                      ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.25x</span>
                <span>2.0x</span>
                <span>4.0x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider-specific Configuration */}
      <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
            <Mic className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>
          <div>
            <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {selectedVoiceProvider} Configuration
            </h4>
          </div>
        </div>

        {renderProviderSpecificFields()}
      </div>


      {/* Transcriber Configuration Section */}
      <div className="space-y-6">
        {/* Transcriber Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-orange-900/50' : 'bg-orange-100'}`}>
            <MessageSquare className={`h-6 w-6 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Transcriber Configuration
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Configure speech-to-text settings for voice transcription
            </p>
          </div>
        </div>

        {/* Transcriber Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Provider and Language Selection */}
          <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                <Mic className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Provider & Language</h4>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Provider
                </label>
                <select
                  value={selectedTranscriberProvider}
                  onChange={(e) => handleTranscriberProviderChange(e.target.value)}
                  disabled={!isEditing}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                    ? isDarkMode
                      ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                >
                  <option value="Deepgram">Deepgram</option>
                  <option value="OpenAI">OpenAI</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Language
                </label>
                <select
                  value={selectedTranscriberLanguage}
                  onChange={(e) => {
                    setSelectedTranscriberLanguage(e.target.value);
                    saveTranscriberStateToCentralized({ selectedTranscriberLanguage: e.target.value });
                  }}
                  disabled={!isEditing}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                    ? isDarkMode
                      ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                >
                  {Object.entries(getCurrentTranscriberLanguageMapping()).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Model and API Key */}
          <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                <Settings className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div>
                <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Model & API</h4>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Model
                </label>
                <select
                  value={selectedTranscriberModel}
                  onChange={(e) => {
                    setSelectedTranscriberModel(e.target.value);
                    saveTranscriberStateToCentralized({ selectedTranscriberModel: e.target.value });
                  }}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm sm:text-base ${isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                >
                  {transcriberProviders[selectedTranscriberProvider as keyof typeof transcriberProviders]?.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  API Key
                </label>
                <input
                  type="text"
                  value={getApiKeyDisplayValue(transcriberApiKey, isTranscriberApiKeyFocused)}
                  onChange={(e) => {
                    setIsUserChangingTranscriberApiKey(true);
                    setTranscriberApiKey(e.target.value);
                    saveTranscriberStateToCentralized({ transcriberApiKey: e.target.value });
                    // Reset flag after a short delay to allow state to settle
                    setTimeout(() => setIsUserChangingTranscriberApiKey(false), 500);
                  }}
                  onFocus={() => setIsTranscriberApiKeyFocused(true)}
                  onBlur={() => setIsTranscriberApiKeyFocused(false)}
                  disabled={!isEditing}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
                    ? isDarkMode
                      ? 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200'
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  placeholder="Enter API key"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Transcriber Settings - Only show for Deepgram */}
        {selectedTranscriberProvider === 'Deepgram' && (
          <div className={`p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white/50 border-gray-200/50'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                <Settings className={`h-4 w-4 sm:h-5 sm:w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div>
                <h4 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Additional Settings</h4>
              </div>
            </div>

            <div className="space-y-4">
              {/* Punctuate Toggle */}
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                    <div>
                      <h5 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Punctuate</h5>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !punctuateEnabled;
                      setPunctuateEnabled(newValue);
                      saveTranscriberStateToCentralized({ punctuateEnabled: newValue });
                    }}
                    disabled={!isEditing}
                    className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${!isEditing
                      ? 'opacity-50 cursor-not-allowed'
                      : punctuateEnabled
                        ? (isDarkMode ? 'bg-green-600' : 'bg-green-500')
                        : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                      }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${punctuateEnabled ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>

              {/* Smart Format Toggle */}
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Smart Format</h5>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !smartFormatEnabled;
                      setSmartFormatEnabled(newValue);
                      saveTranscriberStateToCentralized({ smartFormatEnabled: newValue });
                    }}
                    disabled={!isEditing}
                    className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${!isEditing
                      ? 'opacity-50 cursor-not-allowed'
                      : smartFormatEnabled
                        ? (isDarkMode ? 'bg-green-600' : 'bg-green-500')
                        : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                      }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${smartFormatEnabled ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>

              {/* Interim Result Toggle */}
              <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Interim Results</h5>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !interimResultEnabled;
                      setInterimResultEnabled(newValue);
                      saveTranscriberStateToCentralized({ interimResultEnabled: newValue });
                    }}
                    disabled={!isEditing}
                    className={`relative inline-block w-12 h-6 transition-colors duration-200 ease-in-out rounded-full ${!isEditing
                      ? 'opacity-50 cursor-not-allowed'
                      : interimResultEnabled
                        ? (isDarkMode ? 'bg-green-600' : 'bg-green-500')
                        : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')
                      }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${interimResultEnabled ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
});

VoiceConfig.displayName = 'VoiceConfig';

export default VoiceConfig;
