'use client';

import React, { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Volume2, Settings, Loader2, RefreshCw, MessageSquare, Zap } from 'lucide-react';
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
}

const VoiceConfig = forwardRef<HTMLDivElement, VoiceConfigProps>(({ 
  agentName = 'default', 
  onConfigChange, 
  onTranscriberConfigChange, 
  isEditing = false,
  voiceConfiguration,    // Add this
  transcriberConfiguration  // Add this
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
  const providerChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastConfigRef = useRef<string>('');

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
    '11Labs': ['eleven_v3', 'eleven_ttv_v3', 'scribe_v1', 'scribe_v1_experimental', 'eleven_multilingual_v2', 'eleven_flash_v2_5', 'eleven_flash_v2', 'eleven_turbo_v2_5', 'eleven_turbo_v2', 'eleven_multilingual_sts_v2', 'eleven_multilingual_ttv_v2', 'eleven_english_sts_v2'],
    'Cartesia': ['sonic-2.0', 'sonic-turbo', 'sonic']
  });

  const transcriberProviders = {
    'Deepgram': ['nova-2', 'nova-3'],
    'OpenAI': ['tts-1', 'tts-1-hd', 'gpt-4o-mini-tts', 'gpt-4o-mini-transcribe']
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
    'eleven_v3': ['afr', 'ara', 'hye', 'asm', 'aze', 'bel', 'ben', 'bos', 'bul', 'cat', 'ceb', 'nya', 'hrv', 'ces', 'dan', 'nld', 'eng', 'est', 'fil', 'fin', 'fra', 'glg', 'kat', 'deu', 'ell', 'guj', 'hau', 'heb', 'hin', 'hun', 'isl', 'ind', 'gle', 'ita', 'jpn', 'jav', 'kan', 'kaz', 'kir', 'kor', 'lav', 'lin', 'lit', 'ltz', 'mkd', 'msa', 'mal', 'cmn', 'mar', 'nep', 'nor', 'pus', 'fas', 'pol', 'por', 'pan', 'ron', 'rus', 'srp', 'snd', 'slk', 'slv', 'som', 'spa', 'swa', 'swe', 'tam', 'tel', 'tha', 'tur', 'ukr', 'urd', 'vie', 'cym'],
    'eleven_ttv_v3': ['afr', 'ara', 'hye', 'asm', 'aze', 'bel', 'ben', 'bos', 'bul', 'cat', 'ceb', 'nya', 'hrv', 'ces', 'dan', 'nld', 'eng', 'est', 'fil', 'fin', 'fra', 'glg', 'kat', 'deu', 'ell', 'guj', 'hau', 'heb', 'hin', 'hun', 'isl', 'ind', 'gle', 'ita', 'jpn', 'jav', 'kan', 'kaz', 'kir', 'kor', 'lav', 'lin', 'lit', 'ltz', 'mkd', 'msa', 'mal', 'cmn', 'mar', 'nep', 'nor', 'pus', 'fas', 'pol', 'por', 'pan', 'ron', 'rus', 'srp', 'snd', 'slk', 'slv', 'som', 'spa', 'swa', 'swe', 'tam', 'tel', 'tha', 'tur', 'ukr', 'urd', 'vie', 'cym'],
    'scribe_v1': ['afr', 'amh', 'ara', 'hye', 'asm', 'ast', 'aze', 'bel', 'ben', 'bos', 'bul', 'mya', 'yue', 'cat', 'ceb', 'nya', 'hrv', 'ces', 'dan', 'nld', 'eng', 'est', 'fil', 'fin', 'fra', 'ful', 'glg', 'lug', 'kat', 'deu', 'ell', 'guj', 'hau', 'heb', 'hin', 'hun', 'isl', 'ibo', 'ind', 'gle', 'ita', 'jpn', 'jav', 'kea', 'kan', 'kaz', 'khm', 'kor', 'kur', 'kir', 'lao', 'lav', 'lin', 'lit', 'luo', 'ltz', 'mkd', 'msa', 'mal', 'mlt', 'zho', 'mri', 'mar', 'mon', 'nep', 'nso', 'nor', 'oci', 'ori', 'pus', 'fas', 'pol', 'por', 'pan', 'ron', 'rus', 'srp', 'sna', 'snd', 'slk', 'slv', 'som', 'spa', 'swa', 'swe', 'tam', 'tgk', 'tel', 'tha', 'tur', 'ukr', 'umb', 'urd', 'uzb', 'vie', 'cym', 'wol', 'xho', 'zul'],
    'scribe_v1_experimental': ['afr', 'amh', 'ara', 'hye', 'asm', 'ast', 'aze', 'bel', 'ben', 'bos', 'bul', 'mya', 'yue', 'cat', 'ceb', 'nya', 'hrv', 'ces', 'dan', 'nld', 'eng', 'est', 'fil', 'fin', 'fra', 'ful', 'glg', 'lug', 'kat', 'deu', 'ell', 'guj', 'hau', 'heb', 'hin', 'hun', 'isl', 'ibo', 'ind', 'gle', 'ita', 'jpn', 'jav', 'kea', 'kan', 'kaz', 'khm', 'kor', 'kur', 'kir', 'lao', 'lav', 'lin', 'lit', 'luo', 'ltz', 'mkd', 'msa', 'mal', 'mlt', 'zho', 'mri', 'mar', 'mon', 'nep', 'nso', 'nor', 'oci', 'ori', 'pus', 'fas', 'pol', 'por', 'pan', 'ron', 'rus', 'srp', 'sna', 'snd', 'slk', 'slv', 'som', 'spa', 'swa', 'swe', 'tam', 'tgk', 'tel', 'tha', 'tur', 'ukr', 'umb', 'urd', 'uzb', 'vie', 'cym', 'wol', 'xho', 'zul'],
    'eleven_multilingual_v2': ['en', 'ja', 'zh', 'de', 'hi', 'fr', 'ko', 'pt', 'it', 'es', 'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru'],
    'eleven_flash_v2_5': ['en', 'ja', 'zh', 'de', 'hi', 'fr', 'ko', 'pt', 'it', 'es', 'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru', 'hu', 'no', 'vi'],
    'eleven_flash_v2': ['en'],
    'eleven_turbo_v2_5': ['en', 'ja', 'zh', 'de', 'hi', 'fr', 'ko', 'pt', 'it', 'es', 'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru', 'hu', 'no', 'vi'],
    'eleven_turbo_v2': ['en'],
    'eleven_multilingual_sts_v2': ['en', 'ja', 'zh', 'de', 'hi', 'fr', 'ko', 'pt', 'it', 'es', 'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru'],
    'eleven_multilingual_ttv_v2': ['en', 'ja', 'zh', 'de', 'hi', 'fr', 'ko', 'pt', 'it', 'es', 'id', 'nl', 'tr', 'fil', 'pl', 'sv', 'bg', 'ro', 'ar', 'cs', 'el', 'fi', 'hr', 'ms', 'sk', 'da', 'ta', 'uk', 'ru'],
    'eleven_english_sts_v2': ['en']
  };

  // 11Labs Model Display Names
  const elevenLabsModelNames = {
    'eleven_v3': 'Eleven v3',
    'eleven_ttv_v3': 'Eleven TTV v3',
    'scribe_v1': 'Scribe v1',
    'scribe_v1_experimental': 'Scribe v1 Experimental',
    'eleven_multilingual_v2': 'Eleven Multilingual v2',
    'eleven_flash_v2_5': 'Eleven Flash v2.5',
    'eleven_flash_v2': 'Eleven Flash v2',
    'eleven_turbo_v2_5': 'Eleven Turbo v2.5',
    'eleven_turbo_v2': 'Eleven Turbo v2',
    'eleven_multilingual_sts_v2': 'Eleven Multilingual STS v2',
    'eleven_multilingual_ttv_v2': 'Eleven Multilingual TTV v2',
    'eleven_english_sts_v2': 'Eleven English STS v2'
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
    'mp3': 'MP3',
    'opus': 'Opus',
    'aac': 'AAC',
    'flac': 'FLAC',
    'wav': 'WAV',
    'pcm': 'PCM'
  };

  const responseFormats = {
    'alloy': 'Alloy',
    'ash': 'Ash',
    'ballad': 'Ballad',
    'coral': 'Coral',
    'echo': 'Echo',
    'fable': 'Fable',
    'nova': 'Nova',
    'onyx': 'Onyx',
    'sage': 'Sage',
    'shimmer': 'Shimmer'
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
      // For OpenAI STT, use the same language mapping as TTS
      return openaiLanguageMapping;
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
      isUserChangingTranscriberProvider
    });
    
    // Load from centralized configuration
    if (voiceConfiguration && !isUserChangingProvider) {
      console.log('🔄 Loading voice state from centralized configuration:', voiceConfiguration);
      
      if (voiceConfiguration.selectedVoiceProvider) {
        console.log('🔄 Setting voice provider:', voiceConfiguration.selectedVoiceProvider);
        setSelectedVoiceProvider(voiceConfiguration.selectedVoiceProvider);
      }
      if (voiceConfiguration.selectedLanguage) {
        console.log('🔄 Setting language:', voiceConfiguration.selectedLanguage);
        setSelectedLanguage(voiceConfiguration.selectedLanguage);
      }
      if (voiceConfiguration.speedValue !== undefined) {
        console.log('🔄 Setting speed:', voiceConfiguration.speedValue);
        setSpeedValue(voiceConfiguration.speedValue);
      }
      if (voiceConfiguration.apiKey) {
        console.log('🔄 Setting API key');
        setApiKey(voiceConfiguration.apiKey);
      }
      if (voiceConfiguration.voiceId) {
        console.log('🔄 Setting voice ID');
        setVoiceId(voiceConfiguration.voiceId);
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
    if (transcriberConfiguration && !isUserChangingTranscriberProvider) {
      console.log('🔄 Loading transcriber state from centralized configuration:', transcriberConfiguration);
      
      if (transcriberConfiguration.selectedTranscriberProvider) {
        console.log('🔄 Setting transcriber provider:', transcriberConfiguration.selectedTranscriberProvider);
        setSelectedTranscriberProvider(transcriberConfiguration.selectedTranscriberProvider);
      }
      if (transcriberConfiguration.selectedTranscriberLanguage) {
        console.log('🔄 Setting transcriber language:', transcriberConfiguration.selectedTranscriberLanguage);
        setSelectedTranscriberLanguage(transcriberConfiguration.selectedTranscriberLanguage);
      }
      if (transcriberConfiguration.selectedTranscriberModel) {
        console.log('🔄 Setting transcriber model:', transcriberConfiguration.selectedTranscriberModel);
        setSelectedTranscriberModel(transcriberConfiguration.selectedTranscriberModel);
      }
      if (transcriberConfiguration.transcriberApiKey) {
        console.log('🔄 Setting transcriber API key');
        setTranscriberApiKey(transcriberConfiguration.transcriberApiKey);
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
  }, [voiceConfiguration, transcriberConfiguration, isUserChangingProvider, isUserChangingTranscriberProvider]);

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

  // Load default values on component mount
  useEffect(() => {
    const defaultApiKeys = agentConfigService.getFullApiKeys();
    const defaultVoiceIds = agentConfigService.getDefaultVoiceIds();

    // Set default API key based on selected provider
    switch (selectedVoiceProvider) {
      case 'OpenAI':
        setApiKey(defaultApiKeys.openai || '');
        break;
      case '11Labs':
        setApiKey(defaultApiKeys.elevenlabs || '');
        setVoiceId(defaultVoiceIds.elevenlabs || '');
        break;
      case 'Cartesia':
        setApiKey(defaultApiKeys.cartesia || '');
        setVoiceId(defaultVoiceIds.cartesia || '');
        break;
    }
  }, [selectedVoiceProvider]);

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

  // Helper function to get display value for API key
  const getApiKeyDisplayValue = (actualKey: string) => {
    if (!actualKey) return '••••••••••••••••••••••••••••••••';
    return maskApiKey(actualKey);
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

    // Reset model and voice when provider changes
    let defaultModel = 'tts-1';
    let defaultVoice = 'alloy';
    
    if (newProvider === 'OpenAI') {
      defaultModel = 'tts-1';
      defaultVoice = 'alloy';
    } else if (newProvider === 'Cartesia') {
      defaultModel = 'cartesia-xtts-v2';
      defaultVoice = 'sonic-2.0';
    } else if (newProvider === '11Labs') {
      defaultModel = 'eleven_v3';
      defaultVoice = 'alloy';
    }

    // Update the provider, model, and voice state
    setSelectedVoiceProvider(newProvider);
    setSelectedModel(defaultModel);
    setSelectedVoice(defaultVoice);

    console.log('🔄 Reset model to:', defaultModel, 'and voice to:', defaultVoice);

    // Save to centralized state
    saveStateToCentralized({
      selectedVoiceProvider: newProvider,
      selectedModel: defaultModel,
      selectedVoice: defaultVoice
    });

    console.log('✅ Provider changed to', newProvider, 'with reset model and voice');

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

    setSelectedTranscriberProvider(provider);

    // Reset model to first available model for the new provider
    const providerData = transcriberProviders[provider as keyof typeof transcriberProviders];
    if (providerData && providerData.length > 0) {
      setSelectedTranscriberModel(providerData[0]);
      saveTranscriberStateToCentralized({
        selectedTranscriberProvider: provider,
        selectedTranscriberModel: providerData[0]
      });
    }

    console.log('✅ Transcriber provider changed to', provider, 'with reset model');

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
                value={getApiKeyDisplayValue(apiKey)}
                readOnly
                className={`w-full p-3 rounded-xl border transition-all duration-300 cursor-not-allowed text-sm sm:text-base ${isDarkMode
                  ? 'border-gray-600 bg-gray-700/50 text-gray-400'
                  : 'border-gray-200 bg-gray-100/50 text-gray-500'
                  }`}
                placeholder="Default API key loaded"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Voice
                </label>
                <select
                  value={responseFormat}
                  onChange={(e) => {
                    setResponseFormat(e.target.value);
                    saveStateToCentralized({ responseFormat: e.target.value });
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
              <div>
                <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Response Format
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
                  {Object.entries(openaiModels).map(([key, value]) => (
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
                value={getApiKeyDisplayValue(apiKey)}
                readOnly
                className={`w-full p-3 rounded-xl border transition-all duration-300 cursor-not-allowed text-sm sm:text-base ${isDarkMode
                  ? 'border-gray-600 bg-gray-700/50 text-gray-400'
                  : 'border-gray-200 bg-gray-100/50 text-gray-500'
                  }`}
                placeholder="Default API key loaded"
              />
            </div>
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Voice ID
              </label>
              <input
                type="text"
                value={voiceId ? maskApiKey(voiceId) : 'pNInz6obpgDQGcFmaJgB'}
                readOnly
                className={`w-full p-3 rounded-xl border transition-all duration-300 cursor-not-allowed text-sm sm:text-base ${isDarkMode
                  ? 'border-gray-600 bg-gray-700/50 text-gray-400'
                  : 'border-gray-200 bg-gray-100/50 text-gray-500'
                  }`}
                placeholder="Default voice ID (Adam voice)"
              />
            </div>
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Model ID
              </label>
              <input
                type="text"
                value="eleven_monolingual_v1"
                readOnly
                className={`w-full p-3 rounded-xl border transition-all duration-300 cursor-not-allowed text-sm sm:text-base ${isDarkMode
                  ? 'border-gray-600 bg-gray-700/50 text-gray-400'
                  : 'border-gray-200 bg-gray-100/50 text-gray-500'
                  }`}
                placeholder="Default model ID (free tier)"
              />
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
                value={getApiKeyDisplayValue(apiKey)}
                readOnly
                className={`w-full p-3 rounded-xl border transition-all duration-300 cursor-not-allowed text-sm sm:text-base ${isDarkMode
                  ? 'border-gray-600 bg-gray-700/50 text-gray-400'
                  : 'border-gray-200 bg-gray-100/50 text-gray-500'
                  }`}
                placeholder="Default API key loaded"
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
                    models = Object.keys(openaiModels);
                  } else if (selectedVoiceProvider === 'Cartesia') {
                    models = ['cartesia-xtts-v2']; // Cartesia has only one model
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
                  setSelectedLanguage(e.target.value);
                  saveStateToCentralized({ selectedLanguage: e.target.value });
                }}
                disabled={!isEditing}
                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 text-sm sm:text-base ${!isEditing
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
                  value={getApiKeyDisplayValue(transcriberApiKey)}
                  readOnly
                  className={`w-full p-3 rounded-xl border transition-all duration-300 cursor-not-allowed text-sm sm:text-base ${isDarkMode
                    ? 'border-gray-600 bg-gray-700/50 text-gray-400'
                    : 'border-gray-200 bg-gray-100/50 text-gray-500'
                    }`}
                  placeholder="Default API key loaded"
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
                    setPunctuateEnabled(!punctuateEnabled);
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
                    setSmartFormatEnabled(!smartFormatEnabled);
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
                    setInterimResultEnabled(!interimResultEnabled);
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
