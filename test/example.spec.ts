/* Test imports, you can ignore these */
import { expect, spyOn, test } from "bun:test"; const c = spyOn(console, 'log');

/* Containers.ts ------------------------------------------------------------ */
import { ExtendableContainer } from "../src";

const container = new ExtendableContainer();
const container2 = new ExtendableContainer();

/* Logger.ts ---------------------------------------------------------------- */

enum LogLevel {
    WARNING = 'WARNING',
    DEBUG = 'DEBUG'
}

class LoggerService {

    constructor(public logLevel: LogLevel) {}

    log(string: string) {
        console.log(`${this.logLevel} - ${string}`);
    }
}

/* Database.ts -------------------------------------------------------------- */

class Database {

    constructor(
        public dbUri: string,
        public logger: LoggerService
    ) {}

    connect() {
        this.logger.log('Success!');
    }
}

/* DbBundle.ts -------------------------------------------------------------- */
import type { BundleInterface } from '../src';

class MyBundleConfig {
    dbUri: string;
}

class DbBundle implements BundleInterface<MyBundleConfig> {

    constructor(public database: Database) {}

    configure(overrides: Partial<MyBundleConfig>): void {

        const config = {...new MyBundleConfig(), ...overrides};

        // Get some container parameter (could also be passed via config)
        const logLevel = container.getParameter('logger.loglevel');
        
        // Wire the services in this bundle 
        container.transient(LoggerService, [logLevel]);
        container.singleton(Database, [config.dbUri, LoggerService]);

        // Register 'self'
        container.register(DbBundle, [Database]);
    }
}

/* BaseApp.ts --------------------------------------------------------------- */
class BaseApp {

    database?: Database;

    constructor(
        /**
         * Empty constructor - use the container as a service locator here.
         * 
         * This allows easier sub-classing / extending of the App class 
         * e.g. only a super() call, without dependencies.
         */
    ) {
        /** 
         * Example of a feature toggle: 
         * we can only use the Database feature from MyBundle if added it. 
         */
        const bundle = container.getExtension<DbBundle>('DbBundle');

        if (bundle) {
            this.database = bundle.database; 
            // Or alternatively, `this.database = container.get(Database)`
        }
    }

    init() {
        this.database?.connect();
    }
}

/* Test case / example ------------------------------------------------------ */
test('Application entrypoint', () => {
    
    /* Your application entrypoint - main.ts or some bootstrap function. */
    container.setParameter('logger.loglevel', LogLevel.DEBUG);

    container.addExtension(DbBundle, {
        dbUri: 'mongodb://...'
    });

    container.singleton(BaseApp, []);
    container.build();

    /* Thats it! */
    
    const app = container.get(BaseApp); // The app instance is now ready. 

    app.init();

    /* Test cases */
    expect(app).toBeInstanceOf(BaseApp);
    expect(app.database).toBeInstanceOf(Database);
    expect(app.database?.logger).toBeInstanceOf(LoggerService);

    expect(c).toHaveBeenCalledTimes(1);
    expect(c.mock.lastCall).toEqual(['DEBUG - Success!']);
});

/**
 * Now with MyBundle disabled. 
 * Note: you must change `container` to `container2` in BaseApp for this to work. 
 */
// test('Disabled bundle', () => {
    
//     /** 
//      * main.ts - This would be your application entrypoint.
//      */
//     container2.singleton(BaseApp, []);
//     container2.build();

//     const app = container2.get(BaseApp); // The app is now initialized and running. 

//     /* Test cases */
//     expect(app).toBeInstanceOf(BaseApp);

//     // MyBundle is not loaded, so the database is unavailable in this configuration!
//     expect(app.database).toBeUndefined();
//     expect(app.database?.logger).toBeUndefined();
// });

