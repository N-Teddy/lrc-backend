import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { IUploadDriver } from '../interfaces/upload-driver.interface';
import { UploadResult } from '../interfaces/upload-result.interface';

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
}

@Injectable()
export class CloudinaryDriver implements IUploadDriver, OnModuleInit {
  private readonly logger = new Logger(CloudinaryDriver.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    const publicId = `${folder}/${Date.now()}`;

    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: `lrc/${folder}`,
              public_id: publicId,
              resource_type: 'image',
            },
            // @ts-expect-error cloudinary has no type declarations
            (error: Error | null, result: CloudinaryUploadResult | null) => {
              if (error) reject(error);
              else if (result) resolve(result);
            },
          )
          .on('error', reject);
      },
    );

    this.logger.log(`File uploaded to Cloudinary: ${result.public_id}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
    this.logger.log(`File deleted from Cloudinary: ${publicId}`);
  }
}
