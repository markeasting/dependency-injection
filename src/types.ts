
export enum InjectableType {

    /** The same instance will be passed when injected into a class. */
    SHARED = 'SHARED',

    /** A new instance of the class must be constructed each time. */
    TRANSIENT = 'TRANSIENT'
}

/**
 * The DI {@link Container} will resolve classes that implement this interface.
 */
export interface Injectable {
    __inject: InjectableType;

    // configure?(config: any): void;
}

/** 
 * The 'name' of a class, rather than an instance. 
 * E.g. `MyClass` instead of `new MyClass()`. 
 */
export type ClassType<T> = { new (...args: any[]): T };

/**
 * Interface for extension bundles. 
 * You may define your own configuration object type. 
 */
export interface BundleInterface<T extends object> extends Injectable {
    config: T;
    configure(config: T): void;
}

/** Maps the correct configuration type hints from a given BundleInterface. */
export type BundleConfigType<T> 
    = T extends BundleInterface<infer X> ? X : never;

// type GenericOf<T> = T extends Injectable<infer X> ? X : never;
type IsInjectable<T> = T extends Injectable ? T : false;
type GetInjectableType<T> = T extends { __inject: infer X } ? X : never;

type MapToClassType<T> = {
    [P in keyof T]: 
        IsInjectable<T[P]> extends Injectable
            ? GetInjectableType<T[P]> extends InjectableType.SHARED 
                ? ClassType<T[P]> 
                : T[P]
            : T[P]
};

/**
 * Get the dependency types of a class, based on it's constructor parameters.
 */
export type Dependencies<T extends ClassType<any>> 
    = MapToClassType<ConstructorParameters<T>>
