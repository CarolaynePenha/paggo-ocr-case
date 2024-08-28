import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { createWorker } from 'tesseract.js';

@Injectable()
export class OcrService {
  async handleInvoce(invoceName: string, invoceImage: Buffer) {
    const response = await this.ocrWorker(invoceImage);
    this.structuredSummary(response);
    // await this.postInvoceImage(invoceName, invoceImage);

    return response;
  }

  async postInvoceImage(invoceName: string, invoceImage: Buffer) {
    console.log('invoceImage: ', invoceImage);
    console.log('invoceName: ', invoceName);
    try {
      const s3 = new S3({
        region: 'us-east-2',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: invoceName,
        Body: invoceImage,
      };
      const data = await s3.upload(params).promise();
      return;
    } catch (error) {
      console.log('Error uploading file:', error);
      throw error;
    }
  }

  async ocrWorker(invoceImage: Buffer) {
    try {
      const worker = await createWorker('por');
      const res = await worker.recognize(invoceImage);
      await worker.terminate();
      const stringifyText = JSON.stringify(res.data.text);
      return stringifyText;
    } catch (error) {
      throw error;
    }
  }

  structuredSummary(text: string) {}
}
