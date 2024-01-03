/* Test imports, you can ignore these */
import { expect, spyOn, test } from "bun:test"; const c = spyOn(console, 'log');

/* Containers.ts */
const container = new ExtendableContainer();
const container2 = new ExtendableContainer();

/* Logger.ts */
import type { BundleInterface } from '../src';

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

/* Database.ts */
class Database {

    constructor(public logger: LoggerService) {}

    connect() {
        this.logger.log('Success!');
    }
}

/* MyBundle.ts */
import { Container, ExtendableContainer } from "../src";

class MyBundleConfig {
    logLevel: LogLevel = LogLevel.WARNING;
}

class MyBundle implements BundleInterface<MyBundleConfig> {

    constructor(public database: Database) {}

    configure(overrides: Partial<MyBundleConfig>): void {

        const config = {...new MyBundleConfig(), ...overrides};

        container.transient(LoggerService, [config.logLevel]);
        container.singleton(Database, [LoggerService]);

        container.register(MyBundle, [Database]);
    }
}

/* BaseApp.ts */
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
        const myBundle = container.getExtension<MyBundle>('MyBundle');

        if (myBundle) {
            this.database = myBundle.database; 
            // Or alternatively, `this.database = container1.get(Database)`

            this.database.connect();
        }
    }
}

/**
 * Test case / example
 */
test('Application entrypoint', () => {

    /** 
     * main.ts - This would be your application entrypoint.
     */
    container.addExtension(MyBundle, {
        logLevel: LogLevel.DEBUG
    });

    container.singleton(BaseApp, []);
    container.build();

    const app = container.get(BaseApp); // The app is now initialized and running. 

    /* Thats it! */

    /* Test cases */
    expect(app).toBeInstanceOf(BaseApp);
    expect(app.database).toBeInstanceOf(Database);
    expect(app.database?.logger).toBeInstanceOf(LoggerService);

    expect(c).toHaveBeenCalledWith('DEBUG - Success!');
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

