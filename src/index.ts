import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { handleError, handleResponse } from './handleResponse'

interface AxiosOptions {
	injectToken?: boolean
	localTokenKey?: string
	authorization?: string
	contentType?: string
	cancelMultipleRequest?: boolean
	requestInterceptor?: (request: AxiosRequestConfig<any>) => any
	responseInterceptor?: (respone: AxiosResponse<any, any>) => any
}

interface AxiosService {
	config: AxiosRequestConfig
	options?: AxiosOptions
}

interface pendingRequest {
	config: AxiosRequestConfig
	request: Promise<any>
	canceler: (message?: string) => void
}

export default class Request {
	private instance: AxiosInstance

	private axiosService: AxiosService

	private options: AxiosOptions = {
		injectToken: false,
		localTokenKey: 'token',
		authorization: 'authorization',
		contentType: 'Content-Type',
		cancelMultipleRequest: true
	}

	private pendingPool: pendingRequest[] = []

	private matchConfigKeys: ['url', 'data', 'params', 'method'] = ['url', 'data', 'params', 'method']

	constructor(axiosService: AxiosService) {
		this.axiosService = axiosService

		this.loadOptions()

		this.instance = axios.create(this.axiosService.config)

		this.instance.interceptors.request.use(request => {
			this.format(request)

			if (this.options.injectToken) {
				this.injectToken(request)
			}

			if (this.options.requestInterceptor) {
				this.options.requestInterceptor(request)
			}
			return request
		})

		this.instance.interceptors.response.use(
			response => {
				if (this.options.cancelMultipleRequest) {
					this.clearPendingRequest(response)
				}
				if (this.options.responseInterceptor) {
					this.options.responseInterceptor(response)
				}
				return handleResponse(response)
			},
			error => {
				return handleError(error)
			}
		)
	}

	public request<T = any>(config: AxiosRequestConfig): Promise<T> {
		const pendingRequest = this.pendingPool.find(item => {
			return this.matchConfigKeys.every(key => item.config[key] === config[key])
		})
		if (pendingRequest) return pendingRequest.request
		const source = axios.CancelToken.source()
		const request = this.instance
			.request({ ...config, cancelToken: source.token })
			.then(res => {
				return res.data
			})
			.catch(err => {
				return err
			})

		this.pendingPool.push({
			config,
			canceler: source.cancel,
			request
		})
		return request
	}

	public useCancelRequest<T = any>(
		config: AxiosRequestConfig
	): [Promise<T>, (message?: string) => void] {
		const request = this.request(config)
		const req = this.pendingPool.find(v => v.config === config)
		return [request, req!.canceler]
	}

	private loadOptions() {
		let key: keyof AxiosOptions
		if (this.axiosService.options) {
			for (key in this.axiosService.options) {
				//@ts-ignore
				this.options[key] = this.axiosService.options[key]
			}
		}
	}

	private injectToken = (config: AxiosRequestConfig): AxiosRequestConfig => {
		const token = localStorage.getItem(this.options.localTokenKey!)
		if (token) {
			if (config.headers) {
				config.headers[this.options.authorization!] = token
			} else {
				config.headers = {
					[this.options.authorization!]: token
				}
			}
		}
		return config
	}

	public clearPendingRequest(response: AxiosResponse) {
		const pendingRequestIndex = this.pendingPool.findIndex(item =>
			this.matchConfigKeys.every(key => item.config[key] === response.config[key])
		)
		if (pendingRequestIndex !== -1) {
			this.pendingPool.splice(pendingRequestIndex, 1)
		}
	}

	public clearPendingPool() {
		this.pendingPool.forEach(v => v.canceler('手动取消'))
		this.pendingPool = []
	}

	format(request: AxiosRequestConfig) {
		if (
			request.headers &&
			request.headers[this.options.contentType!] === 'application/x-www-form-urlencoded'
		) {
			if (request.transformRequest && Array.isArray(request.transformRequest)) {
				request.transformRequest.push(data => {
					return Request.createFormData(data)
				})
			} else {
				request.transformRequest = data => {
					return Request.createFormData(data)
				}
			}
		}
	}

	static createFormData(input: Record<string, unknown>): FormData {
		return Object.keys(input || {}).reduce((formData, key) => {
			const property = input[key]
			formData.append(
				key,
				property instanceof Blob
					? property
					: typeof property === 'object' && property !== null
					? JSON.stringify(property)
					: `${property}`
			)
			return formData
		}, new FormData())
	}
}
