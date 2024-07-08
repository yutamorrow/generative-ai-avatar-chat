import React, { useCallback, useState, useEffect } from 'react';

import { Engine, Scene } from 'react-babylonjs';
import { Color4, Vector3 } from '@babylonjs/core';
import Avatar from './components/Avatar';
import useAvatar from './hooks/useAvatar';
import InputQuestion from './components/InputQuestion';
import { produce } from 'immer';
import Select from './components/Select';
import { PiGlobe } from 'react-icons/pi';
import './i18n';
import { LANGUAGE_OPTIONS } from './i18n';
import { useTranslation } from 'react-i18next';
import { useTranscribeStreamingState } from './hooks/useTranscribeStreaming';
import VoiceOutputToggle from './components/VoiceOutputToggle';
import useQuestion, { useQuestionState } from './hooks/useQuestion'; // 1行でインポート

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('日本語');
  const [questionedContents, setQuestionedContents] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);

  const { recording } = useTranscribeStreamingState();

  const { startThinking, stopThinking, startSpeech, startIdle } = useAvatar();
  const { answerJson, question } = useQuestion();
  const { setVoiceOutputEnabled, voiceOutputEnabled } = useQuestionState(); // voiceOutputEnabledとsetVoiceOutputEnabledを取得

  useEffect(() => {
    startIdle();
  }, [startIdle]);

  const onSendQuestion = useCallback(
    (questionContent: string) => {
      setIsLoading(true);
      setContent('');
      setQuestionedContents(
        produce(questionedContents, (draft) => {
          draft[draft.length - 1] = questionContent;
          draft.push('');
        })
      );
      startThinking();
      try {
        question(
          questionContent,
          language,
          LANGUAGE_OPTIONS.filter((l) => l.value === language)[0].code,
          startSpeech
        ).finally(() => {
          setIsLoading(false);
        });
      } catch (e) {
        console.log(e);
        stopThinking();
      }
    },
    [
      language,
      question,
      questionedContents,
      startSpeech,
      startThinking,
      stopThinking,
    ]
  );
  const onChangeLanguage = useCallback(
    (lang: string) => {
      setLanguage(lang);
      i18n.changeLanguage(
        LANGUAGE_OPTIONS.filter((l) => l.value === lang)[0].code
      );
    },
    [i18n]
  );

  const handleVoiceOutputToggle = (value: boolean) => {
    setVoiceOutputEnabled(value);
  };

  useEffect(() => {
    if (answerJson.message === t('message.initial')) {
      setQuestionedContents(['']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerJson.message]);

  return (
    <div className="bg-background-white text-text-black relative">
      <div className="relative h-screen w-screen">
        {/* 言語選択 */}
        <div className="absolute right-5 top-5 z-30 flex items-center">
          <PiGlobe className="mr-2 text-4xl" />
          <Select
            className="w-36"
            options={LANGUAGE_OPTIONS}
            disabled={recording}
            value={language}
            onChange={onChangeLanguage}
          />
          <VoiceOutputToggle
            initialValue={voiceOutputEnabled} // 初期値をvoiceOutputEnabledから取得
            onToggle={handleVoiceOutputToggle}
          />
        </div>
        {/* メッセージングバー */}
        <div className="absolute top-20 z-10 flex w-full flex-col items-center text-4xl">
          {answerJson.message === '' && (
            <>
              <div className="bg-primary text-text-white rounded-md p-5">
                {t('message.initial')
                  .split('\n')
                  .map((s) => (
                    <div key={s}>{s}</div>
                  ))}
              </div>
              <div className="border-t-primary h-8 w-8 border-[20px] border-transparent"></div>
            </>
          )}

          <div className="flex w-3/4 flex-col items-center">
            {questionedContents.map((qc, idx) => (
              <React.Fragment key={idx}>
                {idx >= questionedContents.length - 2 && (
                  <div
                    className={`${
                      qc === ''
                        ? 'translate-y-[70vh] opacity-0'
                        : 'translate-y-0'
                    } transision border-primary/50  mb-5 w-4/5 rounded-md border-2 bg-white/50 p-3 duration-500`}>
                    {qc}
                  </div>
                )}
              </React.Fragment>
            ))}

            {answerJson.message !== '' && (
              <>
                <div className="bg-primary text-text-white -mt-10 rounded-md p-5">
                  {answerJson.message}
                </div>
                <div className="border-t-primary h-8 w-8 border-[20px] border-transparent"></div>
              </>
            )}
          </div>
        </div>

        {/* VRキャラクター */}
        <div className="absolute h-full w-full">
          <Engine antialias adaptToDeviceRatio width="100%" height="100%">
            <Scene clearColor={new Color4(0.95, 0.95, 0.95)}>
              <arcRotateCamera
                name="Camera"
                alpha={1.55}
                beta={1.5}
                radius={2.5}
                target={new Vector3(0, -0.55, 1)}
              />
              <Avatar />
            </Scene>
          </Engine>
        </div>
      </div>
      <div className="fixed bottom-16 z-10 m-2 w-full  flex justify-center text-4xl">
        <InputQuestion
          className=" w-[90%]"
          transcribeLanguageCode={
            LANGUAGE_OPTIONS.filter((l) => l.value === language)[0]
              .transcribeCode
          }
          content={content}
          disabled={isLoading}
          onChange={setContent}
          onSend={onSendQuestion}
        />
      </div>
      <div className="bg-primary fixed bottom-0 h-10 w-full" />
    </div>
  );
};

export default App;
