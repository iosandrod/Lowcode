//节流装饰器


export function debounce(wait: number) {
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        let timeout: any;
        descriptor.value = function (...args: any[]) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                originalMethod.apply(this, args);
            }, wait);
        };
        return descriptor;
    };
}