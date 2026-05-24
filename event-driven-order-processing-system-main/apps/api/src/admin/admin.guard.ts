import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const header = req.headers['x-admin-key'];
    const headerKey = Array.isArray(header) ? header[0] : header;

    const expectedKey = this.config.get<string>('ADMIN_API_KEY');
    if (!expectedKey) throw new Error('ADMIN_API_KEY not configured');

    if (!headerKey || headerKey !== expectedKey) {
      throw new UnauthorizedException('Invalid admin key');
    }

    return true;
  }
}
