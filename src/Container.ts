import { OverrideUserError, ContainerNotReadyError, CyclicalDependencyError, ServiceNotFoundError, ArgumentCountError } from "./errors";

import { Lifetime, ClassType, Dependencies } from './types';

/**
 * Minimal Dependency Injection container. 
 * 
 * @example
 * import { Container } from "@wildsea/dependency-injection";
 * 
 * const container = new Container();
 * 
 * // Or import a globally available container instance directly:
 * // import { container } from "@wildsea/dependency-injection";
 * 
 * // 1) LoggerService depends on some log level constant
 * container.transient(LoggerService, [LogLevel.DEBUG]);
 * 
 * // 2) Database depends on an instance of LoggerService
 * container.singleton(Database, [LoggerService]); 
 * 
 * // 3) Register 'MyApp'
 * container.singleton(MyApp, [Database, LoggerService]); 
 * 
 * // 3) Build the container
 * container.build();
 * 
 * // Get an instance - dependencies will be injected here 
 * const app = container.get(MyApp); 
 * 
 * @category Container
 */
export class Container {

    protected parameters: Record<string, any> = {};

    protected dependencies    = new Map<ClassType<any>, ClassType<any>[]>();
    protected services        = new Map<ClassType<any>, any>();
    protected overides        = new Map<ClassType<any>, ClassType<any>>();

    #serviceLifetimes         = new Map<ClassType<any>, Lifetime>();

    #compiled = false;

    /**
     * Creates a new DI Container and registers itself. 
     * 
     * You may also use the globally available instance, see {@link container}.
     */
    constructor() {
        this.services.set(Container, this);
    }

    /** 
     * Registers a class as a service. You can also use {@link singleton} and 
     * {@link transient}.
     * 
     * Throws {@link ArgumentCountError} if the given dependencies do not match 
     * the required constructor arguments. 
     * 
     * Throws {@link CyclicalDependencyError} if there is a self-referencing 
     * constructor argument. 
     * 
     * @example
     * 
     * // Logger depends on some log level constant
     * container.register(LoggerService, [LogLevel.DEBUG]);
     * 
     * // Database depends on Logger
     * container.register(Database, [LoggerService]); 
     * 
     * @param ctor The service to register - can be any class. 
     * @param dependencies Dependencies (constructor parameters) of the service
     * @param [lifetime=Lifetime.SHARED]
     */
    public register<T extends ClassType<any>>(
        ctor: T, 
        dependencies: Dependencies<T>,
        lifetime: Lifetime = Lifetime.SHARED
    ): this {

        const deps = dependencies as any[];

        if (ctor.length !== deps.length) {
            throw new ArgumentCountError(ctor, deps.length);
        }

        if (deps.includes(ctor)) {
            throw new CyclicalDependencyError(ctor);
        }

        this.services.set(ctor, null);
        this.dependencies.set(ctor, deps);
        this.#serviceLifetimes.set(ctor, lifetime);
        
        return this;
    }

    /** 
     * Registers a class as a singleton service.
     * 
     * Shortcut for {@link register} with {@link Lifetime.SHARED}. 
     * 
     * @param ctor The service to register - can be any class. 
     * @param dependencies Dependencies (constructor parameters) of the service
     */
    public singleton<T extends ClassType<any>>(
        ctor: T, 
        dependencies: Dependencies<T>
    ): this {
        this.register(ctor, dependencies, Lifetime.SHARED);
        
        return this;
    }

    /** 
     * Registers a class as a transient service.
     * 
     * Shortcut for {@link register} with {@link Lifetime.TRANSIENT}. 
     * 
     * @param ctor The service to register - can be any class. 
     * @param dependencies Dependencies (constructor parameters) of the service
     */
    public transient<T extends ClassType<any>>(
        ctor: T, 
        dependencies: Dependencies<T>
    ): this {
        this.register(ctor, dependencies, Lifetime.TRANSIENT);
        
        return this;
    }

    /** 
     * Initializes the container, after which you can request 
     * instances via {@link get}. 
     * 
     * - Applies implementation overrides that were set via {@link override}.
     */
    public build(): this {
        this.#compiled = true;

        this.overides.forEach((impl, key) => {
            this.services.set(key, this.createInstance(impl));
        });

        return this;
    }

    /** 
     * Overrides a service with another concrete implementation. 
     * 
     * Note: Javascript does not support interfaces (i.e. you cannot pass a TS 
     * interface by value). Therefore, you should first `register()` a 
     * 'base class' as a default implementation, after which you can 
     * override it using `override()`.
     * 
     * You may omit the 'dependencies' argument to match the constructor 
     * signature of the overridden class. 
     * 
     * @example
     * class IFoo {
     *     someMethod(): void {}
     * }
     * 
     * // First register the default implementation / 'base class' for IFoo.
     * container.transient(IFoo, []); 
     * 
     * container.singleton(MyService, [IFoo]); // MyService depends on IFoo
     * 
     * container.transient(ConcreteFoo, []);   // Register an override service
     * container.override(IFoo, ConcreteFoo);  // ConcreteFoo will be passed to MyService
     */
    public override<T extends ClassType<any>>(
        ctor: T,
        overrideCtor: T, 
        dependencies?: Dependencies<T>
    ): this {
        if (this.#compiled) {
            throw new OverrideUserError;
        }
        this.services.set(ctor, null);
        this.overides.set(ctor, overrideCtor);

        if (dependencies?.length) {
            this.dependencies.set(overrideCtor, dependencies as any[]);
        } else {
            const existingDeps = this.dependencies.get(ctor);

            if (existingDeps) 
                this.dependencies.set(overrideCtor, existingDeps);
        }

        return this;
    }

    /** 
     * Retrieves a service from the container, and resolves it's dependencies. 
     * 
     * Will throw a {@link ServiceNotFoundError} if the service was not 
     * registered via {@link register}.
     * 
     * @example
     * const instance = container.get(MyClass);
     */
    public get<T>(ctor: ClassType<T>): T {
        return this.resolve(ctor, true) as T;
    }

    /** 
     * Resolves an instance of the given class. 
     * 
     * @param ctor The service to resolve
     * @param strict When strict, can throw a {@link ServiceNotFoundError}.
     */
    public resolve<T>(ctor: ClassType<T>, strict = true): T|undefined {
        if (!this.#compiled) {
            throw new ContainerNotReadyError();
        }

        const type = this.#serviceLifetimes.get(ctor) || Lifetime.SHARED;

        if (type == Lifetime.SHARED) {
            if (this.services.has(ctor)) {
        
                let instance = this.services.get(ctor);
                
                if (!instance) {
                    instance = this.createInstance(ctor);
                    this.services.set(ctor, instance);
                }

                return instance;
            }
        } else {
            if (this.services.has(ctor)) {
                return this.createInstance(ctor);
            }
        }
        
        if (strict)
            throw new ServiceNotFoundError(ctor);
    }

    /** 
     * Creates a new instance of a service and resolves/injects it's dependencies.
     */
    private createInstance<T>(ctor: ClassType<T>): T {

        /* Resolve dependencies */
        const depsCtors = this.dependencies.get(ctor) || [];
        const depsInstances = depsCtors.map(d => d?.name ? this.resolve(d) : d);
        
        return new ctor(...depsInstances);
    }
}
