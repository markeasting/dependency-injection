
/**
 * Defines the lifetime of a service. 
 * 
 * - Shared services are always the same instance.
 * - Transient services are constructed each time wherever they are injected. 
 * 
 * See {@link Container.singleton} and {@link Container.transient} to define 
 * which lifetime a class should have. 
 * 
 * @category Container
 */
export enum Lifetime {

    /** 
     * There is only one (shared) instance that is passed during injection.
     * 
     * See {@link Container.singleton} to register a shared service.
     * 
     * @example
     * container.singleton(MyService, [LoggerService]);
     */
    SHARED = 'SHARED',

    /** 
     * A new instance of the class is constructed each time it is injected. 
     * 
     * See {@link Container.transient} to register a transient service.
     * 
     * @example
     * container.transient(LoggerService);
     */
    TRANSIENT = 'TRANSIENT'
}

/** 
 * The static 'name' of a class, rather than an instance. 
 * E.g. `MyClass` instead of `new MyClass()`. 
 * 
 * @typeParam T Any constructable class.
 */
export type ClassType<T> = { new (...args: any[]): T };

/**
 * A 'nice to read' alias for the depenency mapping. 
 * Can be T or the {@link ClassType} of T. 
 * 
 * @typeParam T Any constructable class.
 */
export type DependsOn<T> = T | ClassType<T>;

/** @hidden */
type MapDependencies<T> = {
    [P in keyof T]: DependsOn<T[P]>
};

/**
 * Get the dependency types of a class, based on it's 
 * {@link ConstructorParameters}.
 * 
 * @typeParam T Any {@link ClassType}. 
 */
export type Dependencies<T extends ClassType<any>> 
    = MapDependencies<ConstructorParameters<T>>

/**
 * Interface for extension bundles. 
 * 
 * @category Extension Bundles
 * @typeParam T Refers to the type of bundle configuration. 
 *            See {@link BundleConfigType}. 
 * 
 * @example  
 * class MyBundle implements BundleInterface<MyBundleConfig> {
 * 
 *     constructor(public database: Database) {}
 * 
 *     configure(overrides: Partial<MyBundleConfig>): void {
 *          // See configure() below
 *     }
 * }
 */
export interface BundleInterface<T extends object> {

    /**
     * In this method, you can 'wire' the services that your bundle provides. 
     *  
     * @param overrides Bundle configuration overrides.
     * 
     * @example 
     * 
     * // Let's say that this bundle provides a `Database` and `DTO` class. 
     * configure(overrides: Partial<MyBundleConfig>): void {
     * 
     *      // Merge bundle configuration with the given defaults and overrides
     *      const config = {...new MyBundleConfig(), ...overrides}
     *      
     *      // Get some container parameter (could also be passed via config)
     *      const db_uri = container.getParameter('db_uri');
     *      
     *      // Wire the services in this bundle 
     *      container.transient(LoggerService, [config.logLevel]);
     *      container.singleton(Database, [db_uri, LoggerService]);
     *      container.singleton(SomeDTO, [Database]);
     * 
     *      // Register 'self'
     *      container.register(MyBundle, [Database, SomeDTO]); 
     * }
     */
    configure(overrides: T): void;
}

/** 
 * Provides type hints for a given {@link BundleInterface}. 
 * 
 * @category Extension Bundles
 * @typeParam T Inferred based on the passed {@link BundleInterface}.
 */
export type BundleConfigType<T> 
    = T extends BundleInterface<infer X> ? X : never;
