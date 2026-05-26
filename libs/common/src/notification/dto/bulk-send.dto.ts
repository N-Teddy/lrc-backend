import { IsArray, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SendNotificationDto } from './send-notification.dto';

export class BulkSendNotificationDto extends SendNotificationDto {
  @ApiProperty({ description: 'Array of user IDs to send notification to' })
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];
}
