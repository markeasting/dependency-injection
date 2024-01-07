
import { ParameterNotFoundError } from '.';
import { Container } from './Container';

import type { ClassType, BundleInterface, BundleConfigType } from './types';

/**
 * DI container that supports extension bundles. See {@link addExtension} and 
 * {@link getExtension}.
 * 
 * For more information, refer to {@link BundleInterface}.
 * 
 * @category Container
 */
export class ExtendableContainer extends Container {

    protected extensions      = new Map<ClassType<any>, BundleInterface<any>>();
    protected extensionConfig = new Map<ClassType<any>, any>();
    
    #extTypeMap = new Map<string, ClassType<BundleInterface<any>>>();

    /** 
     * Add an extension bundle to the container. 
     * 
     * You may pass configuration overrides via the `config` parameter. 
     * 
     * See also: {@link BundleInterface}.
     */
    public addExtension<T extends BundleInterface<any>>(
        bundleCtor: ClassType<T>,
        config?: BundleConfigType<T>
    ): this {
        if (!this.extensions.has(bundleCtor)) {
            this.extensions.set(bundleCtor, new bundleCtor());
            this.#extTypeMap.set(bundleCtor.name, bundleCtor);
        }
        
        if (config) {
            this.extensionConfig.set(bundleCtor, config);
        }

        return this;
    }
    
    /** 
     * Retrieves an extension bundle from the container. 
     * 
     * @example
     * // Basic usecase 
     * import { MyBundle } from '.';
     * const ext = container.getExtension(MyBundle); 
     * 
     * // Or use `import type` to aid tree-shaking
     * import type { MyBundle } from '.';
     * const ext = container.getExtension<MyBundle>('MyBundle'); 
     */
    public getExtension<T extends BundleInterface<any>>(
        bundle: ClassType<T> | string
    ): T | undefined {
        const ctor = this.#extTypeMap.get(
            typeof bundle === 'string' ? bundle : bundle.name
        );

        return ctor ? this.resolve(ctor, false) as T : undefined;
    }

    /** 
     * Set a *superglobal*. 
     * 
     * Can be useful for general application config. Only use this if the 
     * parameter is 'global', shared across multiple services or bundles.
     * 
     * For bundles specifically, if your parameter only applies to a single 
     * module (in a bundle), you should use the bundle's `config`, 
     * see {@link BundleInterface}. 
     */
    public setParameter(key: string, value: any): this {
        this.parameters[key] = value;

        return this;
    }

    /** 
     * Get a *superglobal*. 
     * 
     * Can be useful for general application config. Only use this if the 
     * parameter is 'global', shared across multiple services or bundles.
     * 
     * For bundles specifically, if your parameter only applies to a single 
     * module (in a bundle), you should use the bundle's `config`, 
     * see {@link BundleInterface}. 
     * 
     * @param strict When strict, can throw a {@link ParameterNotFoundError}.
     */
    public getParameter<T = any>(key: string, strict = true): T {
        if (strict && !this.parameters[key]) {
            throw new ParameterNotFoundError(key);
        }

        return this.parameters[key] as T;
    }

    /** 
     * Resolves the container. 
     * 
     * - Configures extension bundles - see {@link addExtension}.
     * - Applies implementation overrides, see {@link override}.
     */
    public build(): this {
        super.build();

        for (const [key, Bundle] of this.extensions) {
            const config = this.extensionConfig.get(key);
            Bundle.configure(config);
        }
        
        return this;
    }

    /** 
     * Configures a bundle with the given parameters. 
     * 
     * See also: {@link addExtension}. 
     */
    // public configure<T extends BundleInterface<any>>(
    //     bundleCtor: ClassType<T>, 
    //     config: BundleConfigType<T>
    // ): void {
    //     this.extensionConfig.set(bundleCtor, config);
    // }
}
