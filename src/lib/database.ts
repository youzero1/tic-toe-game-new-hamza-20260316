import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Game } from '@/entity/Game';

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  // Use in-memory sqljs database
  dataSource = new DataSource({
    type: 'sqljs',
    autoSave: false,
    entities: [Game],
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();
  return dataSource;
}
