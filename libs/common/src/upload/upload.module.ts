import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadService, APP_CODE } from './upload.service';
import { LocalDriver } from './drivers/local.driver';
import { CloudinaryDriver } from './drivers/cloudinary.driver';

@Module({})
export class UploadModule {
  static forApp(appCode: string): DynamicModule {
    return {
      module: UploadModule,
      imports: [ConfigModule],
      providers: [
        LocalDriver,
        CloudinaryDriver,
        {
          provide: APP_CODE,
          useValue: appCode,
        },
        UploadService,
      ],
      exports: [UploadService],
    };
  }
}
