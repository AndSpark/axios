import { AxiosRequestConfig, AxiosResponse } from 'axios';
interface AxiosOptions {
    injectToken?: boolean;
    localTokenKey?: string;
    authorization?: string;
    contentType?: string;
    cancelMultipleRequest?: boolean;
    requestInterceptor?: (request: AxiosRequestConfig<any>) => any;
    responseInterceptor?: (respone: AxiosResponse<any, any>) => any;
}
interface AxiosService {
    config: AxiosRequestConfig;
    options?: AxiosOptions;
}
export default class Request {
    private instance;
    private axiosService;
    private options;
    private pendingPool;
    private matchConfigKeys;
    constructor(axiosService: AxiosService);
    request<T = any>(config: AxiosRequestConfig): Promise<T>;
    useCancelRequest<T = any>(config: AxiosRequestConfig): [Promise<T>, (message?: string) => void];
    private loadOptions;
    private injectToken;
    clearPendingRequest(response: AxiosResponse): void;
    clearPendingPool(): void;
    format(request: AxiosRequestConfig): void;
    static createFormData(input: Record<string, unknown>): FormData;
}
export {};
