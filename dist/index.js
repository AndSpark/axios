"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const handleResponse_1 = require("./handleResponse");
class Request {
    constructor(axiosService) {
        this.options = {
            injectToken: false,
            localTokenKey: 'token',
            authorization: 'authorization',
            contentType: 'Content-Type',
            cancelMultipleRequest: true
        };
        this.pendingPool = [];
        this.matchConfigKeys = ['url', 'data', 'params', 'method'];
        this.injectToken = (config) => {
            const token = localStorage.getItem(this.options.localTokenKey);
            if (token) {
                if (config.headers) {
                    config.headers[this.options.authorization] = token;
                }
                else {
                    config.headers = {
                        [this.options.authorization]: token
                    };
                }
            }
            return config;
        };
        this.axiosService = axiosService;
        this.loadOptions();
        this.instance = axios_1.default.create(this.axiosService.config);
        this.instance.interceptors.request.use(request => {
            this.format(request);
            if (this.options.injectToken) {
                this.injectToken(request);
            }
            if (this.options.requestInterceptor) {
                this.options.requestInterceptor(request);
            }
            return request;
        });
        this.instance.interceptors.response.use(response => {
            if (this.options.cancelMultipleRequest) {
                this.clearPendingRequest(response);
            }
            if (this.options.responseInterceptor) {
                this.options.responseInterceptor(response);
            }
            return (0, handleResponse_1.handleResponse)(response);
        }, error => {
            return (0, handleResponse_1.handleError)(error);
        });
    }
    request(config) {
        const pendingRequest = this.pendingPool.find(item => {
            return this.matchConfigKeys.every(key => item.config[key] === config[key]);
        });
        if (pendingRequest)
            return pendingRequest.request;
        const source = axios_1.default.CancelToken.source();
        const request = this.instance
            .request(Object.assign(Object.assign({}, config), { cancelToken: source.token }))
            .then(res => {
            return res.data;
        })
            .catch(err => {
            return err;
        });
        this.pendingPool.push({
            config,
            canceler: source.cancel,
            request
        });
        return request;
    }
    useCancelRequest(config) {
        const request = this.request(config);
        const req = this.pendingPool.find(v => v.config === config);
        return [request, req.canceler];
    }
    loadOptions() {
        let key;
        if (this.axiosService.options) {
            for (key in this.axiosService.options) {
                //@ts-ignore
                this.options[key] = this.axiosService.options[key];
            }
        }
    }
    clearPendingRequest(response) {
        const pendingRequestIndex = this.pendingPool.findIndex(item => this.matchConfigKeys.every(key => item.config[key] === response.config[key]));
        if (pendingRequestIndex !== -1) {
            this.pendingPool.splice(pendingRequestIndex, 1);
        }
    }
    clearPendingPool() {
        this.pendingPool.forEach(v => v.canceler('手动取消'));
        this.pendingPool = [];
    }
    format(request) {
        if (request.headers &&
            request.headers[this.options.contentType] === 'application/x-www-form-urlencoded') {
            if (request.transformRequest && Array.isArray(request.transformRequest)) {
                request.transformRequest.push(data => {
                    return Request.createFormData(data);
                });
            }
            else {
                request.transformRequest = data => {
                    return Request.createFormData(data);
                };
            }
        }
    }
    static createFormData(input) {
        return Object.keys(input || {}).reduce((formData, key) => {
            const property = input[key];
            formData.append(key, property instanceof Blob
                ? property
                : typeof property === 'object' && property !== null
                    ? JSON.stringify(property)
                    : `${property}`);
            return formData;
        }, new FormData());
    }
}
exports.default = Request;
