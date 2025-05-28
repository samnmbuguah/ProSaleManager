export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}
