import { CompilerOverrideUserError, ContainerNotResolvedError, ServiceNotFoundError } from "./errors";

import type { Injectable, InjectableType, ClassType, Dependencies } from './types';

/**
 * Very minimal Dependency Injection container. 
 * 
 * In the past, static classes / globals / singletons caused 
 * lots of 'spaghetti' (e.g. hidden or cyclical dependencies).
 * 
 * The main point of this container is to expose the dependencies 
 * of (sub)systems more explicitely. 
 * 
 * https://www.baeldung.com/cs/dependency-injection-vs-service-locator
 */
export class Container implements Injectable {

    __inject: InjectableType.SHARED;

    protected dependencies    = new Map<ClassType<any>, ClassType<any>[]>();
    protected services        = new Map<ClassType<any>, any>();
    protected overides        = new Map<ClassType<any>, ClassType<any>>();

    protected compiled = false;

    constructor() {
        this.services.set(Container, this);
    }

    /** Register a class as a shared service */
    public register<T extends ClassType<Injectable>>(
        ctor: T, 
        dependencies: Dependencies<T>
    ) {

        const deps = dependencies as any[];

        if (deps.includes(ctor)) {
            throw new Error(`Cyclical dependency for ${ctor.name}`);
        }

        this.services.set(ctor, null);
        this.dependencies.set(ctor, deps);
    }

    /** 
     * Resolves the container. 
     * 
     * - Applies implementation overrides, see {@link override()} 
     */
    public build() {
        this.compiled = true;

        this.overides.forEach((impl, key) => {
            this.services.set(key, this.createInstance(impl));
        });
    }

    /** 
     * Override a service with another concrete implementation. 
     * You may omit 'dependencies' to match the deps of the overridden class. 
     */
    public override<T extends ClassType<Injectable>>(
        ctor: T,
        overrideCtor: T, 
        dependencies?: Dependencies<T>
    ) {
        if (this.compiled) {
            throw new CompilerOverrideUserError;
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
     * Get a service from the container with resolved dependencies 
     * @TODO currently, this also returns transients services if requested. 
     * Will be fixed at some point. 
     */
    public get<T extends object>(ctor: ClassType<T>): T {
        return this.resolve(ctor as ClassType<Injectable>, true) as T;
    }

    /** 
     * Resolve an instance of the given class. 
     * In strict mode, will throw {@link ServiceNotFoundError}
     */
    public resolve<T extends Injectable>(ctor: ClassType<T>, strict = true): T|undefined {
        if (!this.compiled) {
            throw new ContainerNotResolvedError();
        }
        if (this.services.has(ctor)) {
            let instance = this.services.get(ctor);
            if (!instance) {
                instance = this.createInstance(ctor);
                this.services.set(ctor, instance);
            }
            return instance;
        }
        if (strict)
            throw new ServiceNotFoundError(ctor);
    }

    /** 
     * Create a new service instance and inject dependencies 
     */
    private createInstance<T extends Injectable>(ctor: ClassType<T>): T {

        /* Resolve dependencies */
        const depsCtors = this.dependencies.get(ctor) || [];
        const depsInstances = depsCtors.map(d => d?.name ? this.resolve(d) : d);
        
        return new ctor(...depsInstances);
    }
}

// export class MissingBundleConfigurationError extends Error {
//     constructor(ctor: ClassType<any>) {
//         super(`'${ctor.name}' is registered as a bundle, but no static 'configure' method was found.`);
//     }
// };

