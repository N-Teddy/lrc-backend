import { UploadResult } from './upload-result.interface';

export interface IUploadDriver {
  upload(file: Express.Multer.File, folder: string): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}
