import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = process.hrtime.bigint();

    if (this.shouldSkip(request)) {
      return next.handle();
    }

    const record = (statusCode: number) => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      this.metrics.recordHttpRequest({
        method: request.method ?? 'UNKNOWN',
        route: this.routeName(request),
        statusCode,
        durationMs,
      });
    };

    return next.handle().pipe(
      tap(() => record(response.statusCode || 200)),
      catchError((err: unknown) => {
        record(this.statusCodeFromError(err));
        return throwError(() => err);
      }),
    );
  }

  private routeName(request: Request): string {
    const routePath = request.route?.path;
    if (typeof routePath === 'string') return routePath;
    if (routePath) return String(routePath);
    return request.path || request.url || 'unknown';
  }

  private shouldSkip(request: Request): boolean {
    const path = request.path || request.url || '';
    return path.startsWith('/metrics') || path.startsWith('/healthz');
  }

  private statusCodeFromError(err: unknown): number {
    if (typeof err === 'object' && err !== null) {
      const maybeHttp = err as { getStatus?: () => number; status?: number };
      if (typeof maybeHttp.getStatus === 'function') {
        return maybeHttp.getStatus();
      }
      if (typeof maybeHttp.status === 'number') return maybeHttp.status;
    }

    return 500;
  }
}
