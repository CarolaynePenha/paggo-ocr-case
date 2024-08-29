import { Injectable } from '@nestjs/common';
import { S3, Textract } from 'aws-sdk';
import { OcrRepository } from './ocr.repository';
import OpenAI from 'openai';

@Injectable()
export class OcrService {
  constructor(private ocrRepository: OcrRepository) {}
  async handleInvoce(invoceName: string, invoceImage: Buffer) {
    const uniqueName = invoceName + Date.now().toString();

    await this.postInvoceImage(uniqueName, invoceImage);
    // const textDetected = await this.detectText(uniqueName);
    const textDetected = `RECEBEMOS DE CENTRAL ARTEFATOS DE CIMENTO EIRELI os PRODUTOS CONSTANTES DA NOTA FISCAL INDICADA ABAIXO NF-e N°. 4859 DATA DE RECEBIMENTO IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR SÉRIE 1 DANFE DOCUMENTO AUXILIAR DA NOTA AlfaBlock FISCAL ELETRÔNICA 1 SAÍDA (41) 3383-0601 CHAVE DE ACESSO N°. 4859 4124 0415 6045 1200 0134 5500 1000 0048 5917 9628 8299 CENTRAL ARTEFATOS DE CIMENTO EIRELI SÉRIE 1 R. William Starostik, 418 galpao Consulta de autenticidade no portal nacional da NF-e Zacarias 83020832 Sao Jose dos Pinhais/PR FOLHA 1 de 1 www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora 4133830601 PROTOCOLO DE AUTORIZAÇÃO DE USO NATUREZA DA OPERAÇÃO 141240097360559 02/04/2024 14:42:53 Venda INSCRIÇÃO ESTADUAL INSC.ESTADUAL DO SUBST. TRIBUTÁRIO CNPJ/CPF 15604512000134 9059649849 DESTINATÁRIO / REMETENTE DATA DA EMISSÃO CNPJ/CPF NOME/RAZÃO SOCIAL 02/04/2024 10576135000153 Hyperion Empreendimentos e Incorporacoes LTDA CEP DATA DA SAÍDA/ENTRADA BAIRRO ENDEREÇO RUA LUCIO RASERA 481 Bigorrilho 80710230 02/04/2024 HORA DE SAÍDA FONE/FAX UF INSCRIÇÃO ESTADUAL MUNICÍPIO 14:42:00 Curitiba PR FATURA / DUPLICATAS Núm.: 001 Venc.: 29/04/2024 Valor: 5025.60 CÁLCULO DO IMPOSTO VALOR DO ICMS ST VALOR TOTAL DOS PRODUTOS BASE DE CÁLCULO DO ICMS VALOR DO ICMS BASE DE CÁLCULO DO ICMS ST 0,00 0,00 0,00 0,00 5.025,60 VALOR DO IPI VALOR TOTAL DA NOTA VALOR DO FRETE VALOR DO SEGURO DESCONTO OUTRAS DESPESAS 0,00 0,00 0,00 0,00 0,00 5.025,60 TRANSPORTADOR / VOLUMES TRANSPORTADOS FRETE POR CONTA CODIGO ANTT PLACA DO VEÍCULO UF CNPJ/CPF RAZÃO SOCIAL 0 - EMITENTE MUNICÍPIO UF INSCRIÇÃO ESTADUAL ENDEREÇO ESPÉCIE MARCA NUMERAÇÃO PESO BRUTO PESO LÍQUIDO QUANTIDADE 0,000 0,000 0 DADOS DO PRODUTO / SERVIÇO BASE CALC VL ICMS VL IPI % ICMS %IPI CÓDIGO DESCRIÇÃO NCM CST CFOP UNID QUANT VALOR UNIT VALOR TOT Payer cm Payer 10x20x6 cm cor natural 68010000 0101 5101 m 144,0000 34,90000 5,025.60 0,00 0,00 CÁLCULO DO ISSQN INSCRIÇÃO MUNICIPAL VALOR TOTAL DOS SERVIÇOS BASE DE CÁLCULO DO ISSQN VALOR DO ISSQN DADOS ADICIONAIS INFORMAÇÕES COMPLEMENTARES RESERVADO AO FISCO Criado a partir do Orcamento: 14909 Entrega: R. Francisco Ader, 502 Novo Mundo Curitiba Ordem do compro 377 Data: 25/03/2024 . Codigo da obra: HIGH Nome da obra: HIGH CITY HABITAT - Solicitado por: Thiago Soares "DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL*;II *NAO GERA DIREITO A CREDITO FISCAL DE ICMS, DE ISS E DE IPI* Voce pagou aproximadamento: R$ 675.94 de tributos federais R$ 603.07 de tributos estaduais Fonte: BPT/empresometro.com be D8CAC2`;
    const response = await this.structuredData(textDetected);
    return response;
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
      await s3.upload(params).promise();
      return;
    } catch (error) {
      console.log('Error uploading file:', error);
      throw error;
    }
  }

  async structuredData(textDetected: string) {
    const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });
    const promptOpenAi =
      'Monte um JSON onde temos três chaves principais: invoice,payerData,receiverData. Dentro da chave invoice as chaves são: number(número da nota), totalAmount(valor total), netAmount(valor líquido), issuanceDate(data de emissao), description(descricao do serviço ou produto) e bankingInfoDescription(informações bancárias), dentro da chave payerData(todas os dados em relação ao tomador/remetente/destinatário) as chaves são: name(razão social/nome), cpfCnpj(cpf/cnpj), address (endereço), phoneNumber(numero com DDD,10 ou 11 digitos, campos como tel/cel/telefone/celular),city(município/cidade), state(estado/UF, 2 caracteres em letra maiúscula),email(email/contato,sempre contem @) e dentro da chave receiverData teremos as mesmas chaves que em payerData, mas todas em relação ao prestador/emitente/quem enviou o produto ou prestou o serviço. Ao que não encontrar atribua null. Retorne apenas o JSON estruturado.';

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

    console.log(completion.choices[0].message);
    return completion.choices[0].message.content;
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
