import { ContainerOverrideUserError, ContainerNotResolvedError, CyclicalDependencyError, ServiceNotFoundError } from "./errors";

import { Lifetime, ClassType, Dependencies } from './types';

/**
 * Minimal Dependency Injection container. 
 * 
 * The main point of this container is to expose the dependencies 
 * of (sub)systems more explicitely. 
 * 
 * Other DI solutions use decorators (which are experimental) or 
 * `reflect-metadata` (extra package). This package heavily relies on 
 * Typescript and native Javascript features instead. 
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

    /** Set a 'superglobal'. Can be useful for general application config. */
    public setParameter(key: string, value: any): this {
        this.parameters[key] = value;

        return this;
    }

    /** Get a 'superglobal'. Can be useful for general application config. */
    public getParameter<T = any>(key: string): T {
        return this.parameters[key] as T;
    }

    /** 
     * Registers a class as a service. 
     * 
     * @example
     * container.register(LoggerService, [config.logLevel]);
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

        if (deps.includes(ctor)) {
            throw new CyclicalDependencyError(ctor);
        }

        this.services.set(ctor, null);
        this.dependencies.set(ctor, deps);
        this.#serviceLifetimes.set(ctor, lifetime);
        
        return this;
    }

    /** 
     * Shortcut for {@link register} with {@link Lifetime.SHARED}. 
     * 
     * Registers a class as a singleton service.
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
     * Shortcut for {@link register} with {@link Lifetime.TRANSIENT}. 
     * 
     * Registers a class as a transient service.
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
     * Resolves the container. 
     * 
     * Also applies implementation overrides that were set via {@link override}.
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
     * You may omit the 'dependencies' argument to match the 
     * constructor signature of the overridden class. 
     * 
     * @example
     * container.transient(Foo, []);
     * container.singleton(MyService, [Foo]);
     * 
     * container.override(MyService, OverrideClass);
     */
    public override<T extends ClassType<any>>(
        ctor: T,
        overrideCtor: T, 
        dependencies?: Dependencies<T>
    ): this {
        if (this.#compiled) {
            throw new ContainerOverrideUserError;
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
     * Retrieves a service from the container with resolved dependencies. 
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
     * @param strict When strict, could throw a {@link ServiceNotFoundError}.
     */
    public resolve<T>(
        ctor: ClassType<T>, 
        strict = true
    ): T|undefined {
        if (!this.#compiled) {
            throw new ContainerNotResolvedError();
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
