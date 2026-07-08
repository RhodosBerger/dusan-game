// packages/shared/src/core/SovereignSignalMediator.ts

export type SignalCallback = (payload: any) => void;
export type RequestHandler = (requestType: string, payload: any) => any;

/**
 * Sovereign Signal Mediator
 * Konštrukt pre prenos správ, vyžiadanie výpočtov a synchronizáciu parametrov
 * medzi rôznymi nezávislými modulmi systému bez nutnosti tesného previazania (decoupled).
 */
export class SovereignSignalMediator {
  private static instance: SovereignSignalMediator;
  private modules: Map<string, RequestHandler> = new Map();
  private subscribers: Map<string, Set<SignalCallback>> = new Map();
  private traceLog: Array<{ timestamp: number; from: string; event: string; detail: string }> = [];

  private constructor() {}

  /**
   * Získa Singleton inštanciu mediátora
   */
  public static getInstance(): SovereignSignalMediator {
    if (!SovereignSignalMediator.instance) {
      SovereignSignalMediator.instance = new SovereignSignalMediator();
    }
    return SovereignSignalMediator.instance;
  }

  /**
   * Zaregistruje modul (operáciu), ktorá poskytuje výpočty na požiadanie (Request-Response)
   */
  public registerModule(moduleName: string, handler: RequestHandler): void {
    this.modules.set(moduleName, handler);
    this.logTrace('SYSTEM', 'RegisterModule', `Modul [${moduleName}] bol zaregistrovaný do výmennej siete.`);
  }

  /**
   * Odstráni zaregistrovaný modul
   */
  public unregisterModule(moduleName: string): void {
    this.modules.delete(moduleName);
    this.logTrace('SYSTEM', 'UnregisterModule', `Modul [${moduleName}] bol odobraný.`);
  }

  /**
   * Odošle požiadavku na výpočet cieľovému modulu a vráti výsledok
   */
  public request(targetModule: string, requestType: string, payload: any): any {
    const handler = this.modules.get(targetModule);
    if (!handler) {
      this.logTrace('SYSTEM', 'RequestError', `Zlyhal dopyt na modul [${targetModule}]: Modul nie je online.`);
      throw new Error(`Target module [${targetModule}] is not registered in the mediator.`);
    }

    this.logTrace(targetModule, 'RequestReceived', `Spracováva sa dopyt typu [${requestType}].`);
    return handler(requestType, payload);
  }

  /**
   * Prihlási odberateľa na konkrétnu udalosť / signál (Pub-Sub)
   */
  public subscribe(event: string, callback: SignalCallback): void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);
  }

  /**
   * Zruší odber udalosti
   */
  public unsubscribe(event: string, callback: SignalCallback): void {
    const set = this.subscribers.get(event);
    if (set) {
      set.delete(callback);
    }
  }

  /**
   * Publikuje signál / informáciu pre všetkých prihlásených odberateľov
   */
  public publish(event: string, payload: any): void {
    this.logTrace('PUBLISHER', 'PublishEvent', `Publikovaná udalosť [${event}].`);
    const set = this.subscribers.get(event);
    if (set) {
      set.forEach(cb => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[MEDIATOR ERROR] Failed executing subscriber for event [${event}]:`, e);
        }
      });
    }
  }

  /**
   * Zapíše prenos informácie do vnútorného trace logu pre telemetriu
   */
  private logTrace(from: string, event: string, detail: string): void {
    this.traceLog.push({
      timestamp: Date.now(),
      from,
      event,
      detail
    });
  }

  /**
   * Vráti kompletnú históriu prenosov signálov
   */
  public getTraceHistory() {
    return this.traceLog;
  }

  /**
   * Vyčistí históriu a registrované moduly
   */
  public clear(): void {
    this.modules.clear();
    this.subscribers.clear();
    this.traceLog = [];
  }
}
