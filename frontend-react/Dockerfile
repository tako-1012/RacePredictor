# Node.js 18 Alpine ベースイメージ
FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# アプリケーションコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm run build

# 非rootユーザーを作成
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# ファイルの所有者を変更
RUN chown -R nextjs:nodejs /app
USER nextjs

# ポートを公開
EXPOSE 3000

# 環境変数を設定
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://backend:8000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# アプリケーションを起動
CMD ["npm", "start"]
