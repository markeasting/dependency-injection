import { Injectable } from ".";

/** The 'name' of a class, rather than an instance. E.g. `MyClass` instead of `new MyClass()` */
export type ClassType<T> = { new (...args: any[]): T };

/** Dependency, alias for {@link ClassType} */
export type Dependency<T> = ClassType<T>;

/** Utility type - convert everything that is `Injectable` to it's corresponding `ClassType` */
type MapToClassType<Type> = {
    [Property in keyof Type]: 
        Type[Property] extends Injectable
            ? Dependency<Type[Property]>
            : Type[Property] 
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
