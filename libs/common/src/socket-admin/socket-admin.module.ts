import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SocketAdminConfig } from './socket-admin.config';
import { SocketAdminGateway } from './socket-admin.gateway';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SocketAdminConfig, SocketAdminGateway],
  exports: [SocketAdminConfig],
})
export class SocketAdminModule {}
