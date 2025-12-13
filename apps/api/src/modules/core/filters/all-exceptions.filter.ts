import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Ignore Next.js internal routes silently (HMR, webpack, etc.)
        if (request.url.startsWith('/_next/') || request.url.startsWith('/_vercel/')) {
            response.status(404).end();
            return;
        }

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : 'Internal server error';

        let errorMessage: string | object = message;

        // Handle NestJS default validation error structure
        if (typeof message === 'object' && (message as any).message) {
            errorMessage = (message as any).message;
        }

        if (exception instanceof Error) {
            this.logger.error(`Http Status: ${status} Error Message: ${JSON.stringify(errorMessage)}`, exception.stack);
        } else {
            this.logger.error(`Http Status: ${status} Error Message: ${JSON.stringify(errorMessage)}`);
        }

        const errorResponse: ApiResponse<null> = {
            success: false,
            data: null,
            message: Array.isArray(errorMessage) ? errorMessage.join(', ') : (errorMessage as string),
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        response.status(status).json(errorResponse);
    }
}
