"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleError = exports.handleResponse = exports.getErrorMessage = void 0;
const errorMessage = {
    400: '参数不正确！',
    401: '您未登录，或者登录已经超时，请先登录！',
    403: '您没有权限操作！',
    404: '请求地址出',
    408: '请求超时！',
    409: '系统已存在相同数据！',
    500: '服务器内部错误！',
    501: '服务未实现！',
    502: '网关错误！',
    503: '服务不可用！',
    504: '服务暂时无法访问，请稍后再试！',
    505: 'HTTP版本不受支持！'
};
function getErrorMessage(error) {
    if (error.message && error.message.includes('timeout')) {
        return '请求超时!';
    }
    if (error.message || error.error) {
        return error.message || error.error;
    }
    if (typeof error === 'string') {
        return error;
    }
    try {
        return JSON.stringify(error);
    }
    catch (error) {
        return error;
    }
}
exports.getErrorMessage = getErrorMessage;
const handleResponse = (response) => {
    const status = response.status;
    if ((status >= 200 && status <= 300) || status === 304) {
        return Promise.resolve(response);
    }
    let message = '';
    if (response.statusText) {
        message = response.statusText;
    }
    else if (response.data) {
        message = getErrorMessage(response.data);
    }
    else {
        message = errorMessage[response.status];
    }
    return Promise.reject({
        code: response.status,
        message
    });
};
exports.handleResponse = handleResponse;
const handleError = (error) => {
    if (error.response) {
        const response = error.response;
        return (0, exports.handleResponse)(response);
    }
    return Promise.reject({
        code: -1,
        message: getErrorMessage(error)
    });
};
exports.handleError = handleError;
