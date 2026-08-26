import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { classifyWorkspacePreviewError } from './sign-in-page.component';

describe('workspace preview errors', () => {
  it('keeps transport failures distinct from an unrecognized workspace', () => {
    expect(classifyWorkspacePreviewError(new HttpErrorResponse({ status: 403 }))).toBe('origin');
    expect(classifyWorkspacePreviewError(new HttpErrorResponse({ status: 429 }))).toBe('rateLimited');
    expect(classifyWorkspacePreviewError(new HttpErrorResponse({ status: 503 }))).toBe('server');
    expect(classifyWorkspacePreviewError(new HttpErrorResponse({ status: 0 }))).toBe('network');
    expect(classifyWorkspacePreviewError({ name: 'TimeoutError' })).toBe('timeout');
  });

  it('maps a normal not-found response independently', () => {
    expect(classifyWorkspacePreviewError(new HttpErrorResponse({ status: 404 }))).toBe('notFound');
  });
});
