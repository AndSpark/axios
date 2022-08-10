import { AxiosResponse } from 'axios';
export declare function getErrorMessage(error: any): any;
export declare const handleResponse: (response: AxiosResponse) => Promise<AxiosResponse<any, any>>;
export declare const handleError: (error: any) => Promise<AxiosResponse<any, any>>;
