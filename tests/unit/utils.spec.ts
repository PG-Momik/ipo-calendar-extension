import { describe, it, expect } from 'vitest';
import { getAuthHeaders, handleApiResponse } from '../../utils';

describe('utils', () => {
  // Test for getAuthHeaders
  describe('getAuthHeaders', () => {
    it('should return default headers when no token is provided', () => {
      const headers = getAuthHeaders();
      expect(headers).toEqual({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      });
    });

    it('should return headers with Authorization token when provided', () => {
      const token = 'test-token-123';
      const headers = getAuthHeaders(token);
      expect(headers).toEqual({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      });
    });

    it('should handle null token gracefully', () => {
      const headers = getAuthHeaders(null);
      expect(headers).toEqual({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      });
    });

    it('should handle undefined token gracefully', () => {
      const headers = getAuthHeaders(undefined);
      expect(headers).toEqual({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      });
    });
  });

  // Test for handleApiResponse
  describe('handleApiResponse', () => {
    it('should return JSON data for a successful response (response.ok = true, status = success)', async () => {
      const mockData = { status: 'success', data: { message: 'Success!' } };
      const mockResponse = new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await handleApiResponse(mockResponse);
      expect(result).toEqual(mockData);
    });

    it('should throw an error for a non-ok HTTP response', async () => {
      const mockErrorData = { status: 'error', message: 'Not Found' };
      const mockResponse = new Response(JSON.stringify(mockErrorData), {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(handleApiResponse(mockResponse)).rejects.toThrow('Not Found');
    });

    it('should throw an error for an ok HTTP response but with "error" status in JSON', async () => {
      const mockErrorData = { status: 'error', message: 'Internal Server Error' };
      const mockResponse = new Response(JSON.stringify(mockErrorData), {
        status: 200, // HTTP OK, but application error
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(handleApiResponse(mockResponse)).rejects.toThrow('Internal Server Error');
    });

    it('should throw "Unexpected server error" if error message is missing in JSON', async () => {
      const mockErrorData = { status: 'error' }; // No message field
      const mockResponse = new Response(JSON.stringify(mockErrorData), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(handleApiResponse(mockResponse)).rejects.toThrow('Unexpected server error');
    });

    it('should throw "Unexpected server error" if JSON is malformed for error case', async () => {
      const mockResponse = new Response('not json', {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
      // Mocking response.json() to throw if content is not JSON
      mockResponse.json = async () => { throw new Error('SyntaxError'); };

      await expect(handleApiResponse(mockResponse)).rejects.toThrow(/SyntaxError|Unexpected server error/);
    });
  });
});