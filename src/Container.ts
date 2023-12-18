import { ClassType, Dependencies, Injectable, InjectableType } from ".";

/**
 * Very minimal Dependency Injection container. 
 * 
 * In the past, static classes / globals / singletons caused lots of 'spaghetti' (e.g. hidden or cyclical dependencies).
 * The main point of this container is to expose the dependencies of (sub)systems more explicitely. 
 * 
 * https://www.baeldung.com/cs/dependency-injection-vs-service-locator
 */
export class Container implements Injectable {

    __inject: InjectableType.SHARED;

    private overides        = new Map<ClassType<any>, any>();
    private services        = new Map<ClassType<any>, any>();
    private dependencies    = new Map<ClassType<any>, ClassType<any>[]>();

    private compiled = false;

    constructor() {
        this.services.set(Container, this);
    }

    build() {
        this.compiled = true;

        this.overides.forEach((impl, key) => {
            this.services.set(key, this.createInstance(impl));
        });
    }

    /** 
     * Override a service with another concrete implementation. 
     * You may omit 'dependencies' to use the same dependencies as the overridden class. 
     */
    override<T extends ClassType<Injectable>>(
        ctor: T,
        overrideCtor: T, 
        dependencies?: Dependencies<T>
    ) {
        if (this.compiled) {
            throw new Error('Container was already compiled. Try overriding earlier.');
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

    /** Register a class as a shared service */
    register<T extends ClassType<Injectable>>(
        ctor: T, 
        dependencies: Dependencies<T> = [] as Dependencies<T>
    ) {

        const deps = dependencies as any[];

        if (deps.includes(ctor)) {
            throw new Error(`Cyclical dependency for ${ctor.name}`);
        }

        this.services.set(ctor, null);
        this.dependencies.set(ctor, deps);
    }

    /** Get a shared service from the container - dependencies will be resolved */
    get<T extends object>(ctor: ClassType<T>): T {
        return this.resolve(ctor as ClassType<Injectable>) as T;
    }

    /** Resolve an instance of the given class */
    resolve<T extends Injectable>(ctor: ClassType<T>): T {
        if (!this.compiled && this.overides.size) {
            throw new Error('Container is has overrides. Try using container.build() first.');
        }
        if (this.services.has(ctor)) {
            let instance = this.services.get(ctor);
            if (!instance) {
                instance = this.createInstance(ctor);
                this.services.set(ctor, instance);
            }
            return instance;
        }
        throw new ServiceNotFoundError(ctor);
    }

    /** Create an instance with injected dependencies */
    private createInstance<T extends Injectable>(ctor: ClassType<T>): T {

        /* Resolve dependencies */
        const depsCtors = this.dependencies.get(ctor) || [];
        const depsInstances = depsCtors.map(d => d?.name ? this.resolve(d) : d);
        
        return new ctor(...depsInstances);
    }
}

export class ServiceNotFoundError extends Error {
    constructor(ctor: ClassType<any>) {
        super(`'${ctor.name}' is not a registered service. Please call 'container.register(${ctor.name})'`);
    }
};
