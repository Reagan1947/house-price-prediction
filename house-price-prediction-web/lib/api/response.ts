export type ApiResponse<T> = {
  code: number;
  msg: string;
  data: T | null;
};

export async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();

  if (!text) {
    return {
      code: response.status,
      msg: response.statusText || "Request failed",
      data: null,
    };
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      code: response.status,
      msg: response.statusText || "Request failed",
      data: null,
    };
  }
}
