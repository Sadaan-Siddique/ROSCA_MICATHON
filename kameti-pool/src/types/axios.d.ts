import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** When true, skip global error toast (handle locally). */
    silent?: boolean;
  }
}
