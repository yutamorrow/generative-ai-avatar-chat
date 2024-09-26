import { Handler } from 'aws-lambda';
import api from './utils/bedrockApi';
import kendraApi from './utils/kendraApi';
import ragPrompt from './prompts/ragPrompt';
import translateApi from './utils/translateApi';
import { QuestionRequest, TQuestionResponse } from 'rag-avatar-demo';

const INIT_RESPONSE: TQuestionResponse ={
  message: 'test',
}

export const handler = async (event: any) => {
  const RESPONSE: TQuestionResponse = { ...INIT_RESPONSE };
  console.log('langcode',event.questionLangCode)
  try {
    let question = event.question;
    if (event.questionLangCode !== 'ja') {
      const { TranslatedText } = await translateApi.translateText(
        event.question,
        event.questionLangCode,
        'ja'
      );
      question = TranslatedText ?? '';
    }

    console.log('question', question);
    const documents = (await kendraApi.retrieve(question)).ResultItems ?? [];
    console.log('documents', documents);
    const prompt = ragPrompt.qaPrompt(documents, question, event.questionLang);
    console.log('prompt', prompt);

    let fullResponse = '';
    for await (const token of api.invokeStream(prompt)) {
      fullResponse += token;
    }

    console.log('fullResponse',fullResponse)
    let response = fullResponse;
    if (event.questionLangCode !== 'ja') {
      const translationResult = await translateApi.translateText(
        fullResponse,
        'ja',
        event.questionLangCode
      );
      console.log('translationResult', translationResult);
      response = translationResult.TranslatedText ?? '';
    }

    RESPONSE.message = response; // 全体のメッセージ


    console.log(response)
    return RESPONSE
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};