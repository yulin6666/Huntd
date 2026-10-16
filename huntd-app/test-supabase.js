const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('测试 Supabase 连接...')
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Key 前缀:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function test() {
  console.log('\n测试查询 global_companies 表...')
  const { data, error } = await supabase
    .from('global_companies')
    .select('id, name')
    .limit(3)

  if (error) {
    console.error('❌ 错误:', error)
  } else {
    console.log('✅ 成功! 查询到', data.length, '条记录')
    console.log('数据示例:', data)
  }
}

test()
