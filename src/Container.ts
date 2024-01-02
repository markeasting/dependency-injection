import { ContainerOverrideUserError, ContainerNotResolvedError, CyclicalDependencyError, ServiceNotFoundError } from "./errors";

import { Lifetime, ClassType, Dependencies } from './types';

/**
 * Very minimal Dependency Injection container. 
 * 
 * In the past, static classes / globals / singletons caused 
 * lots of 'spaghetti' (e.g. hidden or cyclical dependencies).
 * 
 * The main point of this container is to expose the dependencies 
 * of (sub)systems more explicitely. 
 */
export class Container {

    /** Can be used for application globals / config. */
    protected parameters: Record<string, any> = {};

    protected dependencies    = new Map<ClassType<any>, ClassType<any>[]>();
    protected services        = new Map<ClassType<any>, any>();
    protected overides        = new Map<ClassType<any>, ClassType<any>>();

    #serviceLifetimes         = new Map<ClassType<any>, Lifetime>();

    #compiled = false;

    constructor() {
        this.services.set(Container, this);
    }

    /** See {@link parameters}. */
    public setParameter(key: string, value: any): void {
        this.parameters[key] = value;
    }

    /** See {@link parameters}. */
    public getParameter<T = any>(key: string): T {
        return this.parameters[key] as T;
    }

    /** Registers a class as a service. */
    public register<T extends ClassType<any>>(
        ctor: T, 
        dependencies: Dependencies<T>,
        lifetime: Lifetime = Lifetime.SHARED
    ): void {

        const deps = dependencies as any[];

        if (deps.includes(ctor)) {
            throw new CyclicalDependencyError(ctor);
        }

        this.services.set(ctor, null);
        this.dependencies.set(ctor, deps);
        this.#serviceLifetimes.set(ctor, lifetime);
    }

    /** Registers a class as a singleton service. */
    public singleton<T extends ClassType<any>>(
        ctor: T, 
        dependencies: Dependencies<T>
    ): void {
        this.register(ctor, dependencies, Lifetime.SHARED);
    }

    /** Registers a class as a transient service. */
    public transient<T extends ClassType<any>>(
        ctor: T, 
        dependencies: Dependencies<T>
    ): void {
        this.register(ctor, dependencies, Lifetime.TRANSIENT);
    }

    /** 
     * Resolves the container. 
     * 
     * Also applies implementation overrides that were set 
     * via {@link override()}.
     */
    public build(): void {
        this.#compiled = true;

        this.overides.forEach((impl, key) => {
            this.services.set(key, this.createInstance(impl));
        });
    }

    /** 
     * Overrides a service with another concrete implementation. 
     * 
     * You may omit the 'dependencies' argument to match the 
     * constructor signature of the overridden class. 
     */
    public override<T extends ClassType<any>>(
        ctor: T,
        overrideCtor: T, 
        dependencies?: Dependencies<T>
    ): void {
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
    }

    /** 
     * Retrieves a service from the container with resolved dependencies. 
     * 
     * Will throw a {@link ServiceNotFoundError} if the service was not 
     * registered via {@link register()}.
     */
    public get<T>(ctor: ClassType<T>): T {
        return this.resolve(ctor, true) as T;
    }

    /** 
     * Resolves an instance of the given class. 
     * 
     * In strict mode, will throw a {@link ServiceNotFoundError}.
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
