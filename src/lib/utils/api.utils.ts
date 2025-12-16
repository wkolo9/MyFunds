export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error && errorData.error.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      // Ignore JSON parse error, use default message
    }
    throw new ApiError(response.status, errorMessage);
  }
  // Check if response has content (for 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

