import { ClassType } from ".";

/**
 * Thrown when a class references itself as a dependency - prevents infinite
 * loops. 
 * 
 * @category Errors
 */
export class CyclicalDependencyError extends Error {
    /** @hidden */
    constructor(ctor: ClassType<any>) {
        super(`Cyclical dependency for ${ctor.name}`);
    }
}

/**
 * Thrown when a user tries to `get()` an instance from the container, before
 * calling `build()`. 
 * 
 * @category Errors
 */
export class ContainerNotResolvedError extends Error {
    /** @hidden */
    constructor() {
        super('Container must be resolved first. Try using container.build() first.');
    }
}

/**
 * Thrown a user tries to `override()` a class when `build()` was already called.
 * 
 * @category Errors
 */
export class ContainerOverrideUserError extends Error {
    /** @hidden */
    constructor() {
        super('Container was already compiled. You can only call override() before build().');
    }
}

/**
 * Thrown when a service is not found by the container. 
 * 
 * @category Errors
 */
export class ServiceNotFoundError extends Error {
    /** @hidden */
    constructor(ctor: ClassType<any>) {
        super(`'${ctor.name}' is not a registered service. Did you forget to call 'container.register(${ctor.name})'? Or did you forget to load a bundle?`);
    }
};
