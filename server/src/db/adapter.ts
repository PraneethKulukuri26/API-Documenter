export interface DbAdapter {
    connect(url: string): Promise<void>;
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    execute(sql: string, params?: any[]): Promise<void>;
    close(): Promise<void>;
}

import { MySqlAdapter } from './mysql.js';
import { PostgresAdapter } from './postgres.js';

export async function createAdapter(url: string): Promise<DbAdapter> {
    let adapter: DbAdapter;

    if (url.startsWith('mysql://')) {
        adapter = new MySqlAdapter();
    } else if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
        adapter = new PostgresAdapter();
    } else {
        throw new Error('Unsupported database protocol. Use mysql:// or postgres://');
    }

    await adapter.connect(url);
    return adapter;
}
