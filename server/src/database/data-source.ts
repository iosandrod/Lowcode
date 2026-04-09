import { DataSource, DataSourceOptions } from 'typeorm'

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '123456',
  database: 'directus',
  entities: [],
  synchronize: false,
  logging: ['query', 'error']
}

const dataSource = new DataSource(dataSourceOptions)

export default dataSource
