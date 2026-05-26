import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import chalk from 'chalk';
import 'winston-daily-rotate-file';
import { DatabaseTransport } from './database.transport';
import { DataSource } from 'typeorm';

type ChalkColor = (text: string) => string;

export const createLoggerConfig = (
  serviceName: string,
  dataSource?: DataSource,
) => {
  const colorMap: Record<string, ChalkColor> = {
    Auth: chalk.green,
    JRS: chalk.cyan,
    Finance: chalk.yellow,
    App: chalk.magenta,
  };

  // Safe color resolver
  const getServiceColor = (name: string) => {
    try {
      return colorMap[name] || chalk.blue;
    } catch {
      return (text: string) => text;
    }
  };

  const serviceColor = getServiceColor(serviceName);

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.ms(),

        winston.format.printf((info) => {
          const { timestamp, level, message, context, ms } = info;
          try {
            const coloredLevel = winston.format
              .colorize()
              .colorize(level, level.toUpperCase().padEnd(7));
            const coloredService =
              typeof serviceColor === 'function'
                ? serviceColor(`[${serviceName}]`)
                : `[${serviceName}]`;
            const contextLabel =
              typeof context === 'string' && context ? context : 'App';
            const coloredContext = chalk.yellow(`[${contextLabel}]`);
            const dimmedTimestamp = chalk.gray(timestamp as string);
            const coloredMs = chalk.gray(ms as string);

            return (
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              `${dimmedTimestamp} ${coloredLevel} ${coloredService} ${coloredContext} ${message} ${coloredMs}`
            );
          } catch {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            return `[${level.toUpperCase()}] [${serviceName}] [App] ${message}`;
          }
        }),
      ),
    }),
    new winston.transports.DailyRotateFile({
      filename: `logs/${serviceName}-error-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '3d',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new winston.transports.DailyRotateFile({
      filename: `logs/${serviceName}-combined-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '3d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ];

  if (dataSource) {
    transports.push(new DatabaseTransport(dataSource, { level: 'info' }));
  }

  return WinstonModule.createLogger({
    level: 'info',
    defaultMeta: { service: serviceName },
    transports: transports,
  });
};
