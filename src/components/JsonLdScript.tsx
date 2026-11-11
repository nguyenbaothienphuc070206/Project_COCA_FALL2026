/**
 * Tính năng: Thành phần Server Component kết xuất thẻ `<script type="application/ld+json">` chứa dữ liệu có cấu trúc Schema.org (Giai đoạn 9).
 * Trường hợp sử dụng: Nhúng `WebApplication`, `Organization`, `FAQPage`, và `BreadcrumbList` vào HTML trả về từ máy chủ cho công cụ tìm kiếm, mã hóa an toàn ký tự `<` thành `\u003c` qua React 19 script children.
 */

import React from 'react';

interface JsonLdScriptProps {
  schemas: ReadonlyArray<Record<string, unknown>>;
}

export function JsonLdScript({ schemas }: JsonLdScriptProps) {
  if (!schemas || schemas.length === 0) {
    return null;
  }

  return (
    <>
      {schemas.map((schema, index) => {
        const typeName = String(schema['@type'] || index);
        const safeJson = JSON.stringify(schema).replace(/</g, '\\u003c');
        return (
          <script key={`jsonld-${typeName}-${index}`} type="application/ld+json">
            {safeJson}
          </script>
        );
      })}
    </>
  );
}
