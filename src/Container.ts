import { ClassType, Dependencies, SharedDep } from ".";
import { Injectable, InjectableType } from "./Injectable";

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

    private services        = new Map<ClassType<any>, any>();
    private dependencies    = new Map<ClassType<any>, ClassType<any>[]>();

    constructor() {
        this.services.set(Container, this);
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
    private createInstance<T extends Injectable>(ctor: SharedDep<T>): T {

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
