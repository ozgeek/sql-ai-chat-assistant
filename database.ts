import { Pool } from 'pg';

export interface DatabaseConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}

export class DatabaseService {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool(config);
  }

  async testConnection() {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      throw error;
    }
  }

  async query(query: string) {
    try {
      const result = await this.pool.query(query);
      return result;
    } catch (error) {
      console.error('Error querying database:', error);
      throw error;
    }
  }

  async exportSchema() {
    try {
      const schemaQuery = `
        SELECT 
          'CREATE TABLE ' || schemaname || '.' || tablename || ' (' ||
          array_to_string(
            array_agg(
              column_name || ' ' ||  type || ' ' || 
              CASE  
                WHEN character_maximum_length IS NOT NULL 
                THEN '(' || character_maximum_length || ')'
                ELSE ''
              END || 
              CASE  
                WHEN is_nullable = 'NO' THEN ' NOT NULL'
                ELSE ''
              END
            ), 
            ','
          ) || ');'
        FROM (
          SELECT 
            c.column_name, 
            c.is_nullable,
            c.character_maximum_length,
            t.schemaname,
            t.tablename,
            c.udt_name as type
          FROM 
            pg_tables t
            JOIN information_schema.columns c 
              ON t.schemaname = c.table_schema 
              AND t.tablename = c.table_name
          WHERE 
            t.schemaname NOT IN ('pg_catalog', 'information_schema')
          ORDER BY 
            t.schemaname, 
            t.tablename, 
            c.ordinal_position
        ) AS t
        GROUP BY 
          schemaname, 
          tablename;
      `;

      const result = await this.pool.query(schemaQuery);
      
      let schemaOutput = '-- PostgreSQL Database Schema\n\n';
      result.rows.forEach(row => {
        schemaOutput += row['?column?'] + '\n\n';
      });

      return schemaOutput;
    } catch (error) {
      console.error('Error exporting schema:', error);
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
} 