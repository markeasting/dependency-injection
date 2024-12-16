/**
 *    ____         __  _             ____     __     __  _              
 *   / __/__ ____ / /_(_)__  ___ _  / __/__  / /_ __/ /_(_)__  ___  ___ 
 *  / _// _ `(_-</ __/ / _ \/ _ `/ _\ \/ _ \/ / // / __/ / _ \/ _ \(_-< 
 * /___/\_,_/___/\__/_/_//_/\_, / /___/\___/_/\_,_/\__/_/\___/_//_/___/ 
 * 						  /___/                                        
 *
 * https://github.com/markeasting/dependency-injection
 * Created by Mark Oosting on 16/12/2024
 * Copyright (c) 2024 Easting Solutions - All rights reserved.
 */

import { ExtendableContainer } from './ExtendableContainer';

export * from './Container';
export * from './ExtendableContainer';
export * from './types';
export * from './errors';

/**
 * Globally available container instance.
 * 
 * Could be useful as a 'service locator' - should be used sparingly. 
 * 
 * Can be useful for configuring extension bundles. 
 * see {@link BundleInterface.configure}. 
 * 
 * @category Container
 */
export const container = new ExtendableContainer();
