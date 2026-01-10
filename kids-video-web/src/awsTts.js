import AWS from 'aws-sdk';

const region = import.meta.env.VITE_AWS_REGION;
const identityPoolId = import.meta.env.VITE_AWS_IDENTITY_POOL_ID;

let pollyClient = null;

const getPollyClient = () => {
  if (!region || !identityPoolId) {
    throw new Error('Missing VITE_AWS_REGION or VITE_AWS_IDENTITY_POOL_ID.');
  }

  if (!pollyClient) {
    AWS.config.region = region;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: identityPoolId,
    });

    pollyClient = new AWS.Polly({ apiVersion: '2016-06-10' });
  }

  return pollyClient;
};

export const synthesizeSpeech = async (text, options = {}) => {
  const {
    voiceId = 'Joanna',
    engine = 'neural',
    outputFormat = 'mp3',
  } = options;

  const polly = getPollyClient();
  const params = {
    OutputFormat: outputFormat,
    Text: text,
    VoiceId: voiceId,
  };

  if (engine) {
    params.Engine = engine;
  }

  const result = await polly.synthesizeSpeech(params).promise();
  if (!result || !result.AudioStream) {
    throw new Error('Polly returned no audio.');
  }

  const mimeType = outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav';
  const blob = new Blob([result.AudioStream], { type: mimeType });
  return URL.createObjectURL(blob);
};
