
import { Container } from './Container';

import type { ClassType, BundleInterface, BundleConfigType } from './types';

/**
 * DI container that supports extensions via {@link BundleInterface}.
 * 
 * You can add your own extension bundles to the container. 
 * You may use this system to add 'feature toggles' in your application. 
 * This is loosely based on the way Symfony handles bundles.
 * 
 * See {@link addExtension} and {@link getExtension}.
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
