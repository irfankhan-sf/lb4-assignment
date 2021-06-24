import {/* inject, */ BindingScope, injectable} from '@loopback/core';
import winston, {Logger} from 'winston';

@injectable({scope: BindingScope.SINGLETON})
export class LoggerService {
  private logger: Logger;

  constructor() {
    const logger = winston.createLogger({
      level: process.env.LOGGER_LEVEL ?? 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(info => {
              return `[${info.timestamp}]  ${info.level}: ${info.message}`;
            }),
          ),
        }),
      ],
    });

    this.logger = logger;
  }

  info(message: string, ...meta: any[]) {
    this.logger.info(message, meta);
  }
  debug(message: string, ...meta: any[]) {
    this.logger.debug(message, meta);
  }
  error(message: string, ...meta: any[]) {
    this.logger.error(message, meta);
  }
}
