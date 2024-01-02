
export enum InjectableType {

    /** The same instance will be passed when injected into a class. */
    SHARED = 'SHARED',

    /** A new instance of the class must be constructed each time. */
    TRANSIENT = 'TRANSIENT'
}

/** 
 * The static 'name' of a class, rather than an instance. 
 * E.g. `MyClass` instead of `new MyClass()`. 
 */
export type ClassType<T> = { new (...args: any[]): T };

/**
 * Alias of {@link ClassType}. 
 */
export type DependsOn<T> = T | ClassType<T>;

type MapDependencies<T> = {
    [P in keyof T]: DependsOn<T[P]>
};

/**
 * Get the dependency types of a class, based on it's constructor parameters.
 */
export type Dependencies<T extends ClassType<any>> 
    = MapDependencies<ConstructorParameters<T>>

/**
 * Interface for extension bundles. 
 * You may define your own configuration object type. 
 */
export interface BundleInterface<T extends object> {
    config: T;
    configure(config: T): void;
}

/** Maps the correct configuration type hints from a given BundleInterface. */
export type BundleConfigType<T> 
    = T extends BundleInterface<infer X> ? X : never;
