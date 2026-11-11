/**
 * Tính năng: Tuyến chuẩn RFC 9116 GET /.well-known/security.txt.
 * Trường hợp sử dụng: Trả về thông tin liên hệ bảo mật (có placeholder để người vận hành điền) kèm security headers chuẩn.
 */

import { NextResponse } from 'next/server';
import { buildSecurityHeaders } from '@/server/security/securityControls';

const SECURITY_TXT_BODY = [
  '# ShelfPath Security Disclosure Policy (RFC 9116)',
  '# Replace the placeholder email and URL below with your security contact details.',
  'Contact: mailto:security@YOUR-DOMAIN-PLACEHOLDER.example',
  'Preferred-Languages: en, vi',
  'Canonical: https://YOUR-DOMAIN-PLACEHOLDER.example/.well-known/security.txt',
  'Policy: https://YOUR-DOMAIN-PLACEHOLDER.example/SECURITY.md',
  'Expires: 2027-12-31T23:59:59.000Z',
  '',
].join('\n');

export async function GET() {
  return new NextResponse(SECURITY_TXT_BODY, {
    status: 200,
    headers: {
      ...buildSecurityHeaders(),
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
