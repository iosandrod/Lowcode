import 'reflect-metadata'
import dataSource from './data-source.js'

async function testConnection() {
  try {
    await dataSource.initialize()
    console.log('✅ 数据库连接成功！')
    console.log(`📊 数据库: ${dataSource.options.database}`)
    console.log(`🔌 主机: ${dataSource.options.host}:${dataSource.options.port}`)

    // 测试查询
    const result = await dataSource.query('SELECT NOW() as current_time')
    console.log(`🕐 服务器时间: ${result[0].current_time}`)

    await dataSource.destroy()
    console.log('🔌 连接已关闭')
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    process.exit(1)
  }
}

testConnection()
