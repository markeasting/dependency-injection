
/**
 * Defines the lifetime of a service. 
 * 
 * Shared services are always the same instance, while transient services
 * are injected as new instances wherever they are requested. 
 */
export enum Lifetime {

    /** There is only one (shared) instance that is passed during injection. */
    SHARED = 'SHARED',

    /** A new instance of the class is constructed each time it is injected. */
    TRANSIENT = 'TRANSIENT'
}

/** 
 * The static 'name' of a class, rather than an instance. 
 * E.g. `MyClass` instead of `new MyClass()`. 
 * 
 * @param <T> Any constructable class.
 */
export type ClassType<T> = { new (...args: any[]): T };

/**
 * A 'nice to read' alias for the depenency mapping. 
 * Can be T or the {@link ClassType} of T. 
 * 
 * @param <T> Any constructable class.
 */
export type DependsOn<T> = T | ClassType<T>;

type MapDependencies<T> = {
    [P in keyof T]: DependsOn<T[P]>
};

/**
 * Get the dependency types of a class, based on it's 
 * {@link ConstructorParameters}.
 * 
 * @param <T> Any {@link ClassType}. 
 */
export type Dependencies<T extends ClassType<any>> 
    = MapDependencies<ConstructorParameters<T>>

/**
 * Interface for extension bundles. 
 * The type argument states which configuration object type / class is used - 
 * see {@link BundleConfigType}. 
 */
export interface BundleInterface<T extends object> {
    configure(overrides: T): void;
}

/** 
 * Provides type hints for a given {@link BundleInterface}. 
 * 
 * @param <T> Inferred based on the passed {@link BundleInterface}.
 */
export type BundleConfigType<T> 
    = T extends BundleInterface<infer X> ? X : never;
