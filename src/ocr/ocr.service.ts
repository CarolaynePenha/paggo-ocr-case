import { Injectable } from '@nestjs/common';
import { S3, Textract } from 'aws-sdk';

@Injectable()
export class OcrService {
  async handleInvoce(invoceName: string, invoceImage: Buffer) {
    const uniqueName = invoceName + Date.now().toString();

    await this.postInvoceImage(uniqueName, invoceImage);
    const response = await this.detectText(uniqueName);

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

  structuredSummary(text: string) {}
}
