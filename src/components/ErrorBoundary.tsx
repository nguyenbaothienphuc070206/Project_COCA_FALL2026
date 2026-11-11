'use client';

/**
 * Tính năng: Error Boundary bắt lỗi hiển thị giao diện React mà không bao giờ lộ stack trace thô.
 * Trường hợp sử dụng: Bọc toàn bộ khung ứng dụng để hiển thị thông báo thân thiện và nút khôi phục khi có sự cố bất ngờ.
 */

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage:
        error?.message || 'Đã xảy ra sự cố hiển thị không mong muốn.',
    };
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-[320px] flex flex-col items-center justify-center p-8 text-center bg-[#FBF9F5] dark:bg-[#0E1015] text-[#181614] dark:text-[#F5F2EB] border border-[#E4DEC8] dark:border-[#2A2F3D] rounded-xl my-6 mx-auto max-w-xl"
        >
          <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400 mb-4" aria-hidden="true" />
          <h2 className="text-xl font-serif-display font-semibold mb-2">
            Giao diện tạm thời gián đoạn / Interface Interrupted
          </h2>
          <p className="text-sm text-[#57524B] dark:text-[#B8B2A6] mb-6 max-w-md">
            Hệ thống đã ghi nhận sự cố hiển thị cục bộ. Dữ liệu kệ sách của bạn vẫn an toàn trong trình duyệt.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Khôi phục giao diện / Restore View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
