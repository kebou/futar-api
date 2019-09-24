'use strict';

const FUTAR_URL = 'https://futar.bkk.hu/api/query/v1/ws/otp/api/where/';
const DEFAULT_VERSION = 3;
const DEFAULT_KEY = '';

const rp = require('request-promise').defaults({ baseUrl: FUTAR_URL });
const moment = require('moment');

/**
 * BKK Futár API kliens
 * @return {Futar} Futár API kliens példány
 */
class Futar {
    /**
     * Új BKK Futár API kliens létrehozása
     * @param {object} config a konfigurációs paramétereket tartalmazó objektum
     * @param {string} config.apiKey API kulcs
     * @param {number} [config.apiVersion = 3] API verzió
     * @param {boolean} [config.includeReferences = true] referenciák megjelenítése a válaszokban
     */
    constructor(config) {
        if (typeof config === 'undefined') config = {};
        this.config = this._validateConfig(config);
    }

    /**
     * A válasz callback
     * @callback Futar~requestCallback
     * @param {Error} err a lekérdezés közben törénő hibát jelző Error objektum
     * @param {object} data a Futár API válasza
     */

    /**
     * Egy megálló induló és érkező járatainak lekérdezése
     * @param {(object|string)} opts a lekérdezés paramétereit tartalmazó objektum vagy a stopId stringje
     * @param {string} opts.stopId a megálló azonosítója 
     * @param {number} [opts.minutesBefore = 0] perccel korábban
     * @param {number} [opts.minutesAfter = 30] perccel később
     * @param {boolean} [opts.onlyDepartures = true] csak az induló járatok lekérdezése
     * @param {boolean} [opts.includeReferences = config.includeReferences] referenciák megjelenítése a válaszban
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    arrivalsAndDeparturesForStop(opts, cb) {
        return new Promise((resolve, reject) => {
            const { stopId, minutesBefore, minutesAfter, onlyDepartures, includeReferences, version } = this._validateStop(opts);

            const params = {
                stopId,
                minutesBefore: minutesBefore || 0,
                minutesAfter: minutesAfter || 30,
                onlyDepartures: onlyDepartures || true,
                includeReferences: includeReferences || this.config.includeReferences,
                version: version || this.config.apiVersion
            };

            this.sendRequest('/arrivals-and-departures-for-stop.json', params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Egy helytől adott sugáron belül lévő megállók lekérdezése
     * @param {object} opts a lekérdezés paramétereit tartalmazó objektum
     * @param {number} opts.lat a hely szélességi foka
     * @param {number} opts.lon a hely hosszúsági foka
     * @param {number} opts.radius a hely körüli keresési sugár
     * @param {boolean} [opts.includeReferences = config.includeReferences] referenciák megjelenítése a válaszban
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    stopsForLocation(opts, cb) {
        return new Promise((resolve, reject) => {
            if (!opts || !opts.lat || !opts.lon || !opts.radius) {
                const err = new Error('A lat, lon és radius megadása kötelező!');
                err.name = 'InvalidArgumentError';
                throw err;
            }

            const { lat, lon, radius, includeReferences } = opts;

            const params = {
                lat,
                lon,
                radius,
                includeReferences: includeReferences || this.config.includeReferences,
                version: this.config.apiVersion
            };

            this.sendRequest('/stops-for-location.json', params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Egy megálló menetrendjének lekérdezése
     * @param {(object|string)} opts a lekérdezés paramétereit tartalmazó objektum vagy a stopId stringje
     * @param {string} opts.stopId a megálló azonosítója
     * @param {string} [opts.day = aktuális nap] a menetrend napja 'YYYY-MM-DD' formátumban
     * @param {boolean} [opts.includeReferences = config.includeReferences] referenciák megjelenítése a válaszban
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    scheduleForStop(opts, cb) {
        return new Promise((resolve, reject) => {
            const { stopId, day, includeReferences } = this._validateStop(opts);

            const params = {
                stopId,
                day: day || moment().format('YYYY-MM-DD'),
                includeReferences: includeReferences || this.config.includeReferences,
                version: this.config.apiVersion
            };

            this.sendRequest('/schedule-for-stop.json', params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Egy megállót érintő viszonylatok részletei
     * @param {(object|string)} opts a lekérdezés paramétereit tartalmazó objektum vagy a stopId stringje
     * @param {string} opts.stopId a megálló azonosítója
     * @param {boolean} [opts.includeReferences = config.includeReferences] referenciák megjelenítése a válaszban
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    routeDetailsForStop(opts, cb) {
        return new Promise((resolve, reject) => {
            const { stopId, includeReferences } = this._validateStop(opts);

            const params = {
                stopId,
                includeReferences: includeReferences || this.config.includeReferences
            };

            this.sendRequest('/route-details-for-stop.json', params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Egy megállót érintő járművek részletei
     * @param {(object|string)} opts a lekérdezés paramétereit tartalmazó objektum vagy a stopId stringje
     * @param {string} opts.stopId a megálló azonosítója
     * @param {number} [opts.ifModifiedSince = 0] új adatok visszaadása, ha azok változtak a megadott időpont óta (unix timestamp)
     * @param {boolean} [opts.includeReferences = config.includeReferences] referenciák megjelenítése a válaszban
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    vechiclesForStop(opts, cb) {
        return new Promise((resolve, reject) => {
            const { stopId, ifModifiedSince, includeReferences } = this._validateStop(opts);

            const params = {
                stopId,
                ifModifiedSince: ifModifiedSince || 0,
                includeReferences: includeReferences || this.config.includeReferences,
                version: this.config.apiVersion
            };

            this.sendRequest('/vehicles-for-stop.json', params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Egy megálló információi
     * @param {(object|string)} opts a lekérdezés paramétereit tartalmazó objektum vagy a stopId stringje
     * @param {string} opts.stopId a megálló azonosítója
     * @param {boolean} [opts.includeReferences = config.includeReferences] referenciák megjelenítése a válaszban
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    stop(opts, cb) {
        return new Promise((resolve, reject) => {
            const { stopId, includeReferences } = this._validateStop(opts);

            const params = {
                includeReferences: includeReferences || this.config.includeReferences,
                version: this.config.apiVersion
            };

            this.sendRequest(`/stop/${stopId}.json`, params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Egy viszonylat információi
     * @param {(object|string)} opts a lekérdezés paramétereit tartalmazó objektum vagy a routeId stringje
     * @param {string} opts.routeId a viszonylat azonosítója
     * @param {boolean} [opts.includeReferences = config.includeReferences] referenciák megjelenítése a válaszban
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    route(opts, cb) {
        return new Promise((resolve, reject) => {
            const { routeId, includeReferences } = this._validateRoute(opts);

            const params = {
                includeReferences: includeReferences || this.config.includeReferences,
                version: this.config.apiVersion
            };

            this.sendRequest(`/route/${routeId}.json`, params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Egy viszonylat részletes információi
     * @param {(object|string)} opts a lekérdezés paramétereit tartalmazó objektum vagy a routeId stringje
     * @param {string} opts.routeId a viszonylat azonosítója
     * @param {boolean} [opts.related = false] kapcsolódó adatok mutatása
     * @param {boolean} [opts.includeReferences = config.includeReferences] referenciák megjelenítése a válaszban
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    routeDetails(opts, cb) {
        return new Promise((resolve, reject) => {
            const { routeId, related, includeReferences } = this._validateRoute(opts);

            const params = {
                routeId,
                related: related || false,
                includeReferences: includeReferences || this.config.includeReferences,
                version: this.config.apiVersion
            };

            this.sendRequest('/route-details.json', params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Megállók, viszonylatok keresése
     * @param {(object|string)} opts a lekérdezés paramétereit tartalmazó objektum vagy a query stringje
     * @param {string} opts.query a keresést tartalmazó string
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    search(opts, cb) {
        return new Promise((resolve, reject) => {
            if (!opts || (typeof opts === 'object') && !opts.query) {
                const err = new Error('A query megadása kötelező!');
                err.name = 'InvalidArgumentError';
                throw err;
            }

            if (typeof opts === 'string') {
                const query = opts;
                opts = { query };
            }

            const { query, includeReferences } = opts;

            const params = {
                query,
                includeReferences: includeReferences || this.config.includeReferences,
                version: this.config.apiVersion
            };

            this.sendRequest('/search.json', params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Metaadatok lekérdezése
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    metadata(cb) {
        return new Promise((resolve, reject) => {
            const params = { includeReferences: false, version: this.config.apiVersion };

            this.sendRequest('/metadata.json', params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Bubi terminálok adatainak lekérdezése
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    bicycleRental(cb) {
        return new Promise((resolve, reject) => {
            const params = { includeReferences: false, version: this.config.apiVersion };

            this.sendRequest('/bicycle-rental.json', params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Forgalmi változások lekérdezése
     * @param {(object|string)} opts a lekérdezés paramétereit tartalmazó objektum vagy a query stringje
     * @param {string=} opts.query a megálló azonosítója, melyet érintő forgalmi változások kerülnek visszaadásra, ha nincs megadva, az összes forgalmi változás visszaadásra kerül
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    alertSearch(opts, cb) {
        return new Promise((resolve, reject) => {

            if (typeof opts === 'string') {
                const query = opts;
                opts = { query };
            }

            if (typeof opts === 'function' && cb === undefined) {
                cb = opts;
                opts = undefined;
            }

            if (opts === undefined || typeof opts === 'function') {
                opts = {};
            }

            const { query, includeReferences } = opts;

            const params = {
                query: query || '',
                includeReferences: includeReferences || this.config.includeReferences,
                version: this.config.apiVersion
            };

            this.sendRequest('/alert-search.json', params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Utazás tervezése
     * @param {object} opts a tervezés paramétereit tartalmazó objektum
     * @param {number} opts.fromLat a indulási hely szélességi foka
     * @param {number} opts.fromLon a indulási hely hosszúsági foka
     * @param {number} opts.toLat az érkezési hely szélességi foka
     * @param {number} opts.toLon az érkezési hely hosszúsági foka
     * @param {string} [opts.fromName] a indulási hely neve
     * @param {string} [opts.toName] az érkezési hely neve
     * @param {number} [opts.maxTransfers = 5] maximális átszállások száma
     * @param {boolean} [opts.showIntermediateStops = true] köztes megállók megjelenítése
     * @param {number} [opts.dateTime = aktuális idő] indulási/érkezési idő (Unix Timestamp)
     * @param {boolean} [opts.arriveBy = false] ha igaz, akkor a dateTime mező érkezési, ha hamis akkor indulási időpontnak számít
     * @param {number} [opts.maxWalkDistance = 3000] maximális séta hossza méterben
     * @param {boolean} [opts.wheelchair = false] tervezés akadálymentes járatokkal
     * @param {number} [opts.numItineraries = 10] lehetséges útvonalak maximális száma
     * @param {string} [opts.optimize = 'QUICK'] az utazástervezés optimalizálásának típusa ('QUICK' - leggyorsabb útvonal, 'TRANSFERS' - legkevesebb átszállás, 'WALK' - legkevesebb séta, 'TRIANGLE' - kerékpáros tervezés)
     * @param {string} [opts.mode = 'WALK,SUBWAY,RAIL,FERRY,TRAM,TROLLEYBUS,BUS'] a tervezés során felhasználandó közlekedési módok vesszővel elválasztva (lehetőségek: BICYCLE, WALK, SUBWAY, RAIL, FERRY, TRAM, TROLLEYBUS, BUS)
     * @param {number} [opts.triangleSafetyFactor = 1] kerékpáros tervezés estén (optimize = TRIANGLE) mennyire számít az út kerékpáros barát mivolta (0...1)
     * @param {number} [opts.triangleTimeFactor = 0] kerékpáros tervezés estén (optimize = TRIANGLE) mennyire számít az idő (0...1)
     * @param {number} [opts.triangleSlopeFactor = 0] kerékpáros tervezés estén (optimize = TRIANGLE) mennyire számít a meredekség (0...1)
     * @param {boolean} [opts.ignoreRealtimeUpdates = false] valós idejű menetrendi információk figylemen kívül hagyása
     * @param {boolean} [opts.includeReferences = config.includeReferences] referenciák megjelenítése a válaszban
     * @param {Futar~requestCallback} [cb] a választ kezelő callback függvény
     * @return {Promise} Promise, ha nincs callback paraméter
     */
    planTrip(opts, cb) {
        return new Promise((resolve, reject) => {
            if (!opts || !opts.fromLat || !opts.fromLon || !opts.toLat || !opts.toLon) {
                const err = new Error('A fromLat, fromLon, toLat és toLon megadása kötelező!');
                err.name = 'InvalidArgumentError';
                throw err;
            }

            const { fromLat, fromLon, toLat, toLon, fromName, toName, maxTransfers, showIntermediateStops, dateTime, arriveBy, maxWalkDistance, wheelchair, numItineraries, optimize, mode, triangleSafetyFactor, triangleTimeFactor, triangleSlopeFactor, ignoreRealtimeUpdates, includeReferences } = opts;

            const fromPlace = `${fromLat},${fromLon}`;
            const toPlace = `${toLat},${toLon}`;

            const params = {
                fromPlace: fromName ? `${fromName}::${fromPlace}` : fromPlace,
                toPlace: toName ? `${toName}::${toPlace}` : toPlace,
                maxTransfers: maxTransfers || 5,
                numItineraries: numItineraries || 10,
                showIntermediateStops: showIntermediateStops || true,
                arriveBy: arriveBy || false,
                maxWalkDistance: maxWalkDistance || 3000,
                wheelchair: wheelchair || false,
                ignoreRealtimeUpdates: ignoreRealtimeUpdates || false,
                optimize: optimize || 'QUICK',
                mode: mode || 'WALK,SUBWAY,RAIL,FERRY,TRAM,TROLLEYBUS,BUS',
                includeReferences: includeReferences || this.config.includeReferences,
                version: this.config.apiVersion
            };

            if (dateTime) {
                params.date = moment(dateTime).format('YYYY-MM-DD');
                params.time = moment(dateTime).format('HH:mm');
            }

            if (optimize === 'TRIANGLE') {
                params.triangleSafetyFactor = triangleSafetyFactor || 1;
                params.triangleTimeFactor = triangleTimeFactor || 0;
                params.triangleSlopeFactor = triangleSlopeFactor || 0;
            }

            this.sendRequest('/plan-trip.json', params)
                .then(data => {
                    if (cb) cb(null, data);
                    return resolve(data);
                })
                .catch(err => {
                    if (cb) cb(err);
                    return reject(err);
                });
        });
    }

    /**
     * Futár API lekérdezés küldése
     * @param {string} endpoint az API endpoint URI
     * @param {object} params a lekérdezés paramétereit tartalmazó objektum
     * @return {Promise}
     */
    sendRequest(endpoint, params) {
        const rpOptions = {
            uri: endpoint,
            qs: params,
            json: true
        };

        return rp(rpOptions)
            .then(data => {
                if (data.code !== 200) {
                    const err = new Error(data.text);
                    err.code = data.code;
                    err.name = 'InvalidArgumentError';
                    throw err;
                }
                return data.data;
            });
    }

    _validateConfig(config) {
        config.apiKey = config.apiKey ? config.apiKey : DEFAULT_KEY;
        config.apiVersion = config.apiVersion ? config.apiVersion : DEFAULT_VERSION;
        config.includeReferences = (config.includeReferences !== undefined) ? config.includeReferences : true;

        return config;
    }

    _validateStop(opts) {
        if (!opts || (typeof opts === 'object') && !opts.stopId) {
            const err = new Error('A stopId megadása kötelező!');
            err.name = 'InvalidArgumentError';
            throw err;
        }

        if (typeof opts === 'string') {
            const stopId = opts;
            opts = { stopId };
        }
        return opts;
    }

    _validateRoute(opts) {
        if (!opts || (typeof opts === 'object') && !opts.routeId) {
            const err = new Error('A routeId megadása kötelező!');
            err.name = 'InvalidArgumentError';
            throw err;
        }

        if (typeof opts === 'string') {
            const routeId = opts;
            opts = { routeId };
        }
        return opts;
    }
}

module.exports = Futar;