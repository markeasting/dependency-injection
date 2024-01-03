import { ClassType } from ".";

/**
 * Thrown when a class references itself as a dependency - prevents infinite
 * loops. 
 */
export class CyclicalDependencyError extends Error {
    constructor(ctor: ClassType<any>) {
        super(`Cyclical dependency for ${ctor.name}`);
    }
}

/**
 * Thrown when a user tries to `get()` an instance from the container, before
 * having compiled the container via `build()`. 
 */
export class ContainerNotResolvedError extends Error {
    constructor() {
        super('Container must be resolved first. Try using container.build() first.');
    }
}

/**
 * Thrown a user tries to `override()` a class when `build()` was already called.
 */
export class ContainerOverrideUserError extends Error {
    constructor() {
        super('Container was already compiled. You can only call override() before build().');
    }
}

/**
 * Thrown when a service is not found by the container. 
 */
export class ServiceNotFoundError extends Error {
    constructor(ctor: ClassType<any>) {
        super(`'${ctor.name}' is not a registered service. Did you forget to call 'container.register(${ctor.name})'? Or did you forget to load a bundle?`);
    }
};
