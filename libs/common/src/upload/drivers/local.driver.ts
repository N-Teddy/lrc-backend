import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { IUploadDriver } from './../interfaces/upload-driver.interface';
import { UploadResult } from './../interfaces/upload-result.interface';

@Injectable()
export class LocalDriver implements IUploadDriver {
  private readonly logger = new Logger(LocalDriver.name);
  private readonly uploadBasePath: string;
  private readonly uploadBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadBasePath = process.cwd();
    this.uploadBaseUrl = this.configService.get<string>(
      'UPLOAD_BASE_URL',
      'http://localhost:3001',
    );
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    const uploadDir = join(this.uploadBasePath, 'uploads', folder);
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    const extension = file.originalname.split('.').pop();
    const filename = `${this.generateUUID()}.${extension}`;
    const filepath = join(uploadDir, filename);
    writeFileSync(filepath, file.buffer);
    const url = `${this.uploadBaseUrl}/uploads/${folder}/${filename}`;
    const publicId = `${folder}/${filename}`;
    this.logger.log(`File uploaded to local storage: ${filename}`);
    return { url, publicId };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async delete(publicId: string): Promise<void> {
    const filepath = join(this.uploadBasePath, 'uploads', publicId);
    if (existsSync(filepath)) {
      unlinkSync(filepath);
      this.logger.log(`File deleted from local storage: ${publicId}`);
    }
  }
}
