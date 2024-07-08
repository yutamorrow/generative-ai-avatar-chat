import { create } from 'zustand';
import useQuestionApi from './useQuestionApi';
import { useTranslation } from 'react-i18next';
import { TQuestionResponse } from 'rag-avatar-demo';
import { useRef } from 'react';
import { speakText } from './usePollyApi';
import { VoiceId } from '@aws-sdk/client-polly';


export const useQuestionState = create<{
  // answerText: string;
  setAnswerText: (s: string) => void;
  answerJson: TQuestionResponse;
  setAnswerJson: (o: TQuestionResponse) => void;
  voiceOutputEnabled: boolean; // 新しい状態を追加
  setVoiceOutputEnabled: (value: boolean) => void; // 新しい状態更新関数を追加
}>((set, get) => {
  return {
    answerJson: { message: '' },
    setAnswerText: (s) => {
      set({ answerJson: { ...get().answerJson, message: s } });
    },
    setAnswerJson: (o) => {
      set({ answerJson: o });
    },
    voiceOutputEnabled: true, // 初期値はtrueに設定
    setVoiceOutputEnabled: (value) => set({ voiceOutputEnabled: value }),
  };
});

const useQuestion = () => {
  const { setAnswerText, answerJson, setAnswerJson, voiceOutputEnabled } = useQuestionState();

  const { questionStream } = useQuestionApi();

  const { t } = useTranslation();

  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  return {
    // answerText,
    answerJson,
    question: async (
      content: string,
      language: string,
      languageCode: string,
      speechAction: () => void
    ) => {
      clearTimeout(timerRef.current);
      try {
        setAnswerJson({ ...answerJson});
        setAnswerText(t('message.thinking'));

        const stream = questionStream({
          question: content,
          questionLang: language,
          questionLangCode: languageCode,
        });

        let isFirstChunk = true;

        console.log(languageCode)
        let voiceId: VoiceId;
        if (languageCode === 'ja') {
          voiceId = 'Tomoko';
        } else if (languageCode === 'en') {
          voiceId = 'Salli';  // 英語のVoiceIdとして'Joanna'を使用
        } else {
          throw new Error(`Unsupported language code: ${languageCode}`);
        }

        // 発言を更新
        for await (const chunk of stream) {
          if (isFirstChunk) {
            setAnswerText('');
            isFirstChunk = false;
            speechAction();
          }
          const questionResponse: TQuestionResponse = JSON.parse(chunk);
          setAnswerJson(questionResponse);
          if (voiceOutputEnabled) { // 音声出力が有効な場合のみspeakTextを呼び出す
            speakText(questionResponse.message!,voiceId);
          }
        }

        timerRef.current = setTimeout(() => {
          setAnswerJson({ message: t('message.initial') });
        }, 600000);  // 1 min

      } catch (e) {
        console.error(e);
        setAnswerText(t('message.apiError'));
        throw e;
      }
    },
  };
};

export default useQuestion;
