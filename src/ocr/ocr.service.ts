import { Injectable } from '@nestjs/common';
import { Textract } from '@aws-sdk/client-textract';
import { OcrRepository } from './ocr.repository';
import OpenAI from 'openai';
import { OpenAiResponse, ReqInfos } from './ocr.interfaces';

@Injectable()
export class OcrService {
  constructor(private ocrRepository: OcrRepository) {}

  async handleInvoce({ uniqueName, userName, email }: ReqInfos) {
    const userInfos = { userName, email };
    try {
      const textDetected = await this.detectText(uniqueName);
      const responseOpenAi = await this.structuredData(textDetected);
      const parseResponseOpenAi: OpenAiResponse = JSON.parse(responseOpenAi);
      const invoice = {
        ...parseResponseOpenAi.invoice,
        textRaw: textDetected,
        imageLink: process.env.AWS_URL_SAVED_INVOICE + uniqueName,
        imageName: uniqueName,
      };

      const payerData = {
        ...parseResponseOpenAi.payerData,
      };
      const receiverData = {
        ...parseResponseOpenAi.receiverData,
      };
      const bankInfo = {
        ...parseResponseOpenAi.bankInfo,
      };
      await this.ocrRepository.saveInvoiceInfos(
        invoice,
        payerData,
        receiverData,
        bankInfo,
        userInfos,
      );
      return { invoice, payerData, receiverData, bankInfo };
    } catch (error) {
      console.log('Error on invoice handler:', error);
      throw error;
    }
  }

  async detectText(uniqueName: string) {
    try {
      const textract = new Textract({
        region: process.env.AWS_REGION,
        // @ts-ignore:next-line
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });
      const params = {
        Document: {
          S3Object: {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Name: uniqueName,
          },
        },
      };
      const data = await textract.detectDocumentText(params);
      let text = '';

      for (const item of data.Blocks) {
        if (item.BlockType === 'LINE') {
          text = text + ' ' + item.Text;
        }
      }
      return text;
    } catch (error) {
      console.log('Error detecting document text:', error);
      throw error;
    }
  }

  async structuredData(textDetected: string) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

      const promptOpenAi = `Monte um JSON onde temos quatro chaves principais: invoice, payerData, receiverData e bankInfo.
      Dentro da chave invoice as chaves são: number(número da nota), totalAmount(valor total), netAmount(valor líquido), issuanceDate(data de emissao) devolva no formato dia/mês/ano, description(descricao do serviço ou produto).
      Dentro da chave payerData(todas os dados em relação ao tomador/remetente/destinatário) as chaves são: name(razão social/nome), cpfCnpj(cpf/cnpj), address (endereço), phoneNumber(numero com DDD,10 ou 11 digitos, campos como tel/cel/telefone/celular),city(município/cidade), state(estado/UF, 2 caracteres em letra maiúscula),email(email/contato,sempre contem @).
      Dentro da chave receiverData teremos as mesmas chaves que em payerData, mas todas em relação ao prestador/emitente/quem enviou o produto ou prestou o serviço.
      Dentro da chave bankInfo(informações bancárias de pagamento) as chaves são: bankName(nome do banco), agency(número da agência em string), account(número da conta em string) e pixKey(chave pix em string).
      Para phoneNumber e cpfCnpj devolva apenas os numeros, tirando os caracteres e espaços, ambos em string.
      Para os valores monetários, devolva em centavos(numero inteiro).
      Ao que não encontrar atribua null.
      Retorne apenas o JSON estruturado.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: promptOpenAi },
          {
            role: 'user',
            content: textDetected,
          },
        ],
        response_format: { type: 'json_object' },
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.log('Error structuring data:', error);
      throw error;
    }
  }
}
