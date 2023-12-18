/**
 * - SHARED - the same instance will be returned for each injection
 * - TRANSIENT - a new instance of the class must be constructed each time
 */
export enum InjectableType {
    SHARED = 'SHARED',
    TRANSIENT = 'TRANSIENT'
}

/**
 * The DI {@link Container} will resolve anything with this interface.
 * 
 * This interface enables the usage of {@link ClassType} in the `register()` and `get()` methods. 
 */
export interface Injectable {
    __inject: InjectableType;

    // configure?(config: any): void;
}

export interface BundleInterface extends Injectable {
    configure(config: any): void; // @TODO should actually be static, but we can't interface that
}

/** The 'name' of a class, rather than an instance. E.g. `MyClass` instead of `new MyClass()` */
export type ClassType<T> = { new (...args: any[]): T };

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
 * Get the dependency types of a class from it's constructor parameters.
 */
export type Dependencies<T extends ClassType<any>> 
    = MapToClassType<ConstructorParameters<T>>

// type ObjectsOnly<T> = {
//     [K in keyof T]: Extract<T[K], object>;
// };

// type ExcludeFromTuple<T extends readonly any[], E> =
//     T extends [infer F, ...infer R] ? [F] extends [E] ? ExcludeFromTuple<R, E> :
//     [F, ...ExcludeFromTuple<R, E>] : []

// type ExcludeNever<T extends readonly any[]> = ExcludeFromTuple<T, never>;
