import Transport from 'winston-transport';
import { DataSource } from 'typeorm';
import { SystemLog } from '@app/database/entities/log/system-log.entity';

interface WinstonLogInfo {
  level: string;
  message: string;
  context?: string;
  service: string;
  metadata?: unknown;
}

export class DatabaseTransport extends Transport {
  constructor(
    private readonly dataSource: DataSource,
    opts?: Transport.TransportStreamOptions,
  ) {
    super(opts);
  }

  async log(info: WinstonLogInfo, callback: () => void) {
    setImmediate(() => {
      void this.emit('logged', info);
    });

    if (this.dataSource.isInitialized) {
      try {
        const logRepo = this.dataSource.getRepository(SystemLog);
        const log = logRepo.create({
          level: info.level,
          message: info.message,
          context: info.context,
          service: info.service || 'unknown',
          metadata:
            info.metadata === null || info.metadata === undefined
              ? undefined
              : info.metadata,
        });
        await logRepo.save(log);
      } catch (err) {
        console.error('Failed to save log to database', err);
      }
    }

    callback();
  }
}
