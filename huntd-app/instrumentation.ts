export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setGlobalDispatcher, ProxyAgent } = await import('undici')

    const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy
    if (proxyUrl) {
      console.log('🔧 设置全局代理:', proxyUrl)
      const proxyAgent = new ProxyAgent(proxyUrl)
      setGlobalDispatcher(proxyAgent)
    }
  }
}
