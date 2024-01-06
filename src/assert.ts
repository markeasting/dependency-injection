/**
 * Check whether or not some dependencies were passed (in runtime). 
 * 
 * @example
 * constructor(private dep1: Dep1, private dep2: Dep2) {
 *      assert(dep1, dep2);
 * }
 * 
 * @TODO Skip this entire check when building for production
 */
export function assert<T>(...args: any[]) {

    const errors: Error[] = [];

    for (var i = 0; i < args.length; i++) {
        if (args[i] === undefined) {
            const err = new ReferenceError(`Variable not found: argument ${i}`);
            errors.push(err);
        }
    }

    if (errors.length) {
        throw new ReferenceError(`Expected ${args.length} arguments, but received ${JSON.stringify(args)}. Did you forget to wire one of the services?`);
    }
}
