import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUploadDriver } from './interfaces/upload-driver.interface';
import { LocalDriver } from './drivers/local.driver';
import { CloudinaryDriver } from './drivers/cloudinary.driver';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from './constants/upload.constants';
import { UploadResult } from './interfaces/upload-result.interface';

export const APP_CODE = 'UPLOAD_APP_CODE';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly driver: IUploadDriver;

  constructor(
    private readonly configService: ConfigService,
    @Inject(APP_CODE) private readonly appCode: string,
    localDriver: LocalDriver,
    cloudinaryDriver: CloudinaryDriver,
  ) {
    const driver = this.configService.get<string>('STORAGE_DRIVER', 'local');
    this.driver = driver === 'cloudinary' ? cloudinaryDriver : localDriver;
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    this.logger.log(`Uploading file to ${this.appCode} folder`);

    return this.driver.upload(file, this.appCode.toLowerCase());
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!publicId) {
      return;
    }
    await this.driver.delete(publicId);
  }
}
