import { ClassType } from ".";

/**
 * Thrown when a service was registered with the wrong number of constructor 
 * arguments. 
 * 
 * @category Errors
 */
export class ArgumentCountError extends Error {
    /** @hidden */
    constructor(ctor: ClassType<any>, passedDepCount: number) {
        super(`[Container] '${ctor.name}' requires ${ctor.length} argument(s), ${passedDepCount} given. \n\nPlease check which dependencies were passed to '${ctor.name}'.\n`);
    }
}

/**
 * Thrown when a class requires itself as a dependency - prevents infinite
 * loops. 
 * 
 * @category Errors
 */
export class CyclicalDependencyError extends Error {
    /** @hidden */
    constructor(ctor: ClassType<any>) {
        super(`[Container] Cyclical dependency for '${ctor.name}'.`);
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
        super('[Container] Container must be resolved first. Try using container.build() first.');
    }
}

/**
 * Thrown a user tries to `override()` a class when `build()` was 
 * already called.
 * 
 * @category Errors
 */
export class OverrideUserError extends Error {
    /** @hidden */
    constructor() {
        super('[Container] You can only call override() before build().');
    }
}

/**
 * Thrown when a parameter is not found. 
 * 
 * @category Errors
 */
export class ParameterNotFoundError extends Error {
    /** @hidden */
    constructor(param: string) {
        super(`[Container] Parameter not defined: '${param}'.\n\nTry using "setParameter('${param}', <value>)".\n`);
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
        super(`[Container] '${ctor.name}' is not a registered service. \n\n- Did you forget to register the service?\n- Did you forget to load an extension bundle that provides this service?\n`);
    }
}
