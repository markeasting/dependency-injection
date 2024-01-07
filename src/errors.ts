import { ClassType } from ".";

/**
 * Thrown when a service was registered with the wrong number of constructor 
 * arguments. 
 * 
 * @example
 * class Database {
 *      constructor(public logger: LoggerService);
 * }
 * 
 * // container.register(Database, [LoggerService]); // OK!
 * 
 * container.register(Database, []); // Error: Database requires 1 argument
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
 * Thrown when a service requires itself as a dependency (prevents infinite 
 * loops). 
 * 
 * @example
 * container.register(Foo, [Foo, Bar]); // Error: Cyclical dependency for 'Foo'
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
 * @example
 * container.register(Foo);
 * 
 * // container.build(); // Should be called here
 * 
 * container.get(Foo); // Error: Container not ready!
 * 
 * @category Errors
 */
export class ContainerNotReadyError extends Error {
    /** @hidden */
    constructor() {
        super('[Container] Container is not ready. Try using container.build() first.');
    }
}

/**
 * Thrown a user tries to `override()` a class when `build()` was 
 * already called.
 * 
 * @example
 * container.build(); // 'Build' was already called
 * 
 * container.override(IFoo, ConcreteFoo); // Error: Overrides already applied!
 * 
 * @category Errors
 */
export class OverrideUserError extends Error {
    /** @hidden */
    constructor() {
        super('[Container] Overrides were already applied by build(). Please call override() before build().');
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
 * Usually, {@link Container.register} wasn't called.
 * 
 * Or, the bundle that provides the service was not loaded, 
 * see {@link ExtendableContainer.addExtension}. 
 * 
 * @example
 * // container.register(Tractor, []); // Should have been called 
 * 
 * container.get(Tractor); // Error 'Tractor' is not a registered service!
 * 
 * @category Errors
 */
export class ServiceNotFoundError extends Error {
    /** @hidden */
    constructor(ctor: ClassType<any>) {
        super(`[Container] '${ctor.name}' is not a registered service. \n\n- Did you forget to register the service?\n- Did you forget to load an extension bundle that provides this service?\n`);
    }
}
