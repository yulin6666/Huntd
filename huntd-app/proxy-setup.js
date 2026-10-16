// 在 Next.js 启动前设置全局代理
const { setGlobalDispatcher, ProxyAgent } = require('undici')

const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || 'http://127.0.0.1:7897'

console.log('🔧 设置全局代理:', proxyUrl)

const proxyAgent = new ProxyAgent({
  uri: proxyUrl,
  keepAliveTimeout: 10000,
  keepAliveMaxTimeout: 10000,
})

setGlobalDispatcher(proxyAgent)

console.log('✅ 代理配置完成')
