import { NextRequest, NextResponse } from 'next/server';
import { error } from './response';

type ParseResult<T> = { success: true; data: T } | { success: false; response: NextResponse };

/**
 * Safely parses the JSON body of a request.
 * Returns a 400 error response if the body is missing or malformed,
 * instead of throwing or returning a generic 500.
 *
 * Usage:
 * ```ts
 * const parsed = await parseJson(request);
 * if (!parsed.success) return parsed.response;
 * const body = parsed.data;
 * ```
 */
export async function parseJson<T = unknown>(request: NextRequest): Promise<ParseResult<T>> {
  try {
    const data = await request.json();
    return { success: true, data: data as T };
  } catch {
    return {
      success: false,
      response: error('Invalid or malformed JSON body', 400, 'INVALID_JSON'),
    };
  }
}
