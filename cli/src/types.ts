export type ColumnType = "string" | "integer" | "timestamp" | "boolean" | "text" | "float";

export interface Column {
  name: string;
  type: ColumnType;
  primaryKey?: boolean;
  nullable?: boolean;
  unique?: boolean;
  defaultValue?: string;
  references?: {
    table: string;
    column: string;
  };
}

export interface Table {
  name: string;
  description: string;
  columns: Column[];
}

export interface Relationship {
  from: string;
  to: string;
  type: "one-to-many" | "many-to-many" | "one-to-one";
  foreignKey: string;
  description: string;
}

export interface Schema {
  id: string;
  name: string;
  description: string;
  tables: Table[];
  relationships: Relationship[];
  createdAt: string;
}
