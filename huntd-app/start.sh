#!/bin/bash
# Huntd 本地开发快速启动脚本

echo "🚀 Huntd 启动检查..."

# 检查环境变量
if [ ! -f ".env.local" ]; then
  echo "❌ 缺少 .env.local 文件"
  echo "请复制 .env.local.example 并填写 Supabase 密钥"
  exit 1
fi

# 检查是否配置了真实的 Supabase 密钥
if grep -q "your_supabase_url_here" .env.local; then
  echo "⚠️  警告：.env.local 中 Supabase 密钥为占位符"
  echo "   应用可以启动，但无法连接数据库"
  echo ""
  read -p "是否继续？(y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "✓ 环境变量已配置"

# 检查依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  npm install
fi

echo "✓ 依赖已安装"

# 启动开发服务器
echo ""
echo "🎯 启动开发服务器..."
echo "   访问 http://localhost:3000"
echo ""
npm run dev
