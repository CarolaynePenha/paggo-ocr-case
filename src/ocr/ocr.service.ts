import { Injectable } from '@nestjs/common';
import { S3, Textract } from 'aws-sdk';
import { OcrRepository } from './ocr.repository';
import OpenAI from 'openai';

@Injectable()
export class OcrService {
  constructor(private ocrRepository: OcrRepository) {}

  async handleInvoce(invoceName: string, invoceImage: Buffer) {
    try {
      const uniqueName = invoceName + Date.now().toString();

      const s3Data = await this.postInvoceImage(uniqueName, invoceImage);

      const textDetected = await this.detectText(uniqueName);

      const responseOpenAi = await this.structuredData(textDetected);
      const parseResponseOpenAi = JSON.parse(responseOpenAi);
      const invoice = {
        ...parseResponseOpenAi.invoice,
        textRaw: textDetected,
        imageLink: s3Data.Location,
        imageName: uniqueName,
      };
      const payerData = {
        ...parseResponseOpenAi.payerData,
      };
      const receiverData = {
        ...parseResponseOpenAi.receiverData,
      };
      console.log('parseResponseOpenAi.invoice: ', parseResponseOpenAi.invoice);
      await this.ocrRepository.saveInvoiceInfos(
        invoice,
        payerData,
        receiverData,
      );
      return { invoice, payerData, receiverData };
    } catch (error) {
      console.log('Error on invoice handler:', error);
      throw error;
    }
  }

  async detectText(uniqueName: string) {
    try {
      const textract = new Textract({ region: process.env.AWS_REGION });
      const params = {
        Document: {
          S3Object: {
            Bucket: process.env.BUCKET_NAME,
            Name: uniqueName,
          },
        },
      };
      const data = await textract.detectDocumentText(params).promise();
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

  async postInvoceImage(uniqueName: string, invoceImage: Buffer) {
    try {
      const s3 = new S3();
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: uniqueName,
        Body: invoceImage,
      };
      return await s3.upload(params).promise();
    } catch (error) {
      console.log('Error uploading file:', error);
      throw error;
    }
  }

  async structuredData(textDetected: string) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

      const promptOpenAi =
        'Monte um JSON onde temos três chaves principais: invoice,payerData,receiverData. Dentro da chave invoice as chaves são: number(número da nota), totalAmount(valor total), netAmount(valor líquido), issuanceDate(data de emissao) devolva no formato dia/mês/ano, description(descricao do serviço ou produto) e bankingInfoDescription(informações bancárias), dentro da chave payerData(todas os dados em relação ao tomador/remetente/destinatário) as chaves são: name(razão social/nome), cpfCnpj(cpf/cnpj), address (endereço), phoneNumber(numero com DDD,10 ou 11 digitos, campos como tel/cel/telefone/celular),city(município/cidade), state(estado/UF, 2 caracteres em letra maiúscula),email(email/contato,sempre contem @) e dentro da chave receiverData teremos as mesmas chaves que em payerData, mas todas em relação ao prestador/emitente/quem enviou o produto ou prestou o serviço. Para phoneNumber e cpfCnpj devolva apenas os numeros, tirando os caracteres e espaços, ambos em string. Para os valores monetários, devolva em centavos(numero inteiro). Ao que não encontrar atribua null.  Retorne apenas o JSON estruturado.';

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
  // async ocrWorker(invoceImage: Buffer) {
  //   try {
  //     const worker = await createWorker('por');
  //     const res = await worker.recognize(invoceImage);
  //     await worker.terminate();
  //     const stringifyText = JSON.stringify(res.data.text);
  //     return stringifyText;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}
