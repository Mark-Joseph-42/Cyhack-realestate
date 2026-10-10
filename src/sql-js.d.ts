declare module 'sql.js' {
  export class Database {
    run(sql: string, params?: any[]): Database;
    prepare(sql: string): {
      bind(params?: any[]): boolean;
      step(): boolean;
      getAsObject(): Record<string, any>;
      free(): boolean;
    };
  }
  export default function initSqlJs(config?: any): Promise<{
    Database: new () => Database;
  }>;
}
