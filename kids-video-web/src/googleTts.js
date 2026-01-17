const apiBase = import.meta.env.VITE_API_BASE_URL || '';
const getEndpoint = () => {
  if (!apiBase) {
    return '/api/tts';
  }
  return `${apiBase.replace(/\/$/, '')}/api/tts`;
};

const base64ToBlob = (base64, mimeType) => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
};

export const synthesizeSpeech = async (text, options = {}) => {
  const {
    languageCode = 'en-US',
    voiceName = 'en-US-Neural2-D',
    ssmlGender = 'MALE',
    speakingRate = 0.95,
    pitch = -1.0,
    audioEncoding = 'MP3',
  } = options;

  const response = await fetch(getEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      languageCode,
      voiceName,
      ssmlGender,
      audioEncoding,
      speakingRate,
      pitch,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Google TTS request failed (${response.status}). ${errorText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await response.json();
    if (data?.audioUrl) {
      return data.audioUrl;
    }
    if (!data || !data.audioContent) {
      throw new Error('TTS API returned no audio.');
    }
    const encoding = (data?.audioEncoding || audioEncoding || '').toUpperCase();
    const mimeType = data?.mimeType || (encoding === 'MP3' ? 'audio/mpeg' : 'audio/wav');
    const blob = base64ToBlob(data.audioContent, mimeType);
    return URL.createObjectURL(blob);
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error('TTS API returned empty audio.');
  }
  return URL.createObjectURL(blob);
};
