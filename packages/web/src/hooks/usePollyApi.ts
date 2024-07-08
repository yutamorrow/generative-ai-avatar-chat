import { Polly , VoiceId } from '@aws-sdk/client-polly';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';

const region = import.meta.env.VITE_APP_REGION;
const idPoolId = import.meta.env.VITE_APP_IDENTITY_POOL_ID;

const cognito = new CognitoIdentityClient({ region });

async function getPollyClient() {
  const credentials = await fromCognitoIdentityPool({
    client: cognito,
    identityPoolId: idPoolId,
  });

  return new Polly({ region, credentials });
}

async function initPolly() {
  const polly = await getPollyClient();
  return polly;
}

const pollyPromise = initPolly();

let audioContext: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;

export async function speakText(text: string, voiceId: VoiceId) {
  stopSpeech(); 
  audioContext = new AudioContext();
  const polly = await pollyPromise;

  console.log('polly:',text)

  try {
    const data = await polly.synthesizeSpeech({
      OutputFormat: 'mp3',
      Text: text,
      VoiceId: voiceId,
      Engine: 'neural'
    });

    const audioBuffer = await data.AudioStream;
    audioContext.decodeAudioData(await new Response(audioBuffer as BodyInit).arrayBuffer(), (buffer) => {
      const source = audioContext!.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext!.destination);
      source.start();
    });
  } catch (err) {
    console.error('エラーが発生しました:', err);
  }
}

export function stopSpeech() {
  if (source) {
    source.stop();
    source.disconnect();
    source = null;
  }
  if (audioContext) {
    audioContext.close(); 
    audioContext = null; 
  }
}