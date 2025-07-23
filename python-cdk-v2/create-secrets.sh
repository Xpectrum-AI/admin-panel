#!/bin/bash
set -e

# --- Frontend Secret ---
aws secretsmanager create-secret --name admin-panel-frontend --secret-string '{
  "NEXT_PUBLIC_PROPELAUTH_API_KEY": "ad39ddd2967143bea4f4405e5f6dc4d0f5183c63a027add992e99a71cd80ab6c1ce07889f5ee6364f21abb40c827d29c",
  "NEXT_PUBLIC_API_KEY": "xpectrum-ai@123",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_test_your_stripe_publishable_key_here",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID": "441654168539-9tfk7ibkt2r9tbsoohpjjfmjjn8u4lf0.apps.googleusercontent.com",
  "NEXT_PUBLIC_MONGODB_URL": "mongodb+srv://mongo_access:3gfaAKMQsCwEjIXG@cluster0.4os5zqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
}' || aws secretsmanager put-secret-value --secret-id admin-panel-frontend --secret-string '{
  "NEXT_PUBLIC_PROPELAUTH_API_KEY": "ad39ddd2967143bea4f4405e5f6dc4d0f5183c63a027add992e99a71cd80ab6c1ce07889f5ee6364f21abb40c827d29c",
  "NEXT_PUBLIC_API_KEY": "xpectrum-ai@123",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "pk_test_your_stripe_publishable_key_here",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID": "441654168539-9tfk7ibkt2r9tbsoohpjjfmjjn8u4lf0.apps.googleusercontent.com",
  "NEXT_PUBLIC_MONGODB_URL": "mongodb+srv://mongo_access:3gfaAKMQsCwEjIXG@cluster0.4os5zqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
}'

# --- Backend Secret ---
aws secretsmanager create-secret --name admin-panel-backend --secret-string '{
  "API_KEY": "xpectrum-ai@123",
  "LIVE_API_KEY": "xpectrum-ai@123",
  "PROPELAUTH_API_KEY": "5c1b57840f4d4ec7265d0622cf68dd63e028b78d8482b21b8fb00395bb6ee3c59a1fde5f9288d373b1a315e591bd8723",
  "STRIPE_SECRET_KEY": "sk_test_51RaX9pBTMxLlaTtWg74455SOBukRu3gQsEY3SfP17rkMOHy3Aoh7SHvuoMqV5Kk1wdsEf9yCeoROtu66SulV1YKW00YGErU4Pq",
  "STRIPE_PUBLISHABLE_KEY": "pk_test_your_stripe_publishable_key_here",
  "MONGODB_URL": "mongodb+srv://mongo_access:3gfaAKMQsCwEjIXG@cluster0.4os5zqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  "SESSION_SECRET": "your_session_secret_change_this_in_production",
  "JWT_SECRET": "your_jwt_secret_change_this_in_production",
  "SMTP_USER": "your_email@gmail.com",
  "SMTP_PASS": "your_app_password"
}' || aws secretsmanager put-secret-value --secret-id admin-panel-backend --secret-string '{
  "API_KEY": "xpectrum-ai@123",
  "LIVE_API_KEY": "xpectrum-ai@123",
  "PROPELAUTH_API_KEY": "5c1b57840f4d4ec7265d0622cf68dd63e028b78d8482b21b8fb00395bb6ee3c59a1fde5f9288d373b1a315e591bd8723",
  "STRIPE_SECRET_KEY": "sk_test_51RaX9pBTMxLlaTtWg74455SOBukRu3gQsEY3SfP17rkMOHy3Aoh7SHvuoMqV5Kk1wdsEf9yCeoROtu66SulV1YKW00YGErU4Pq",
  "STRIPE_PUBLISHABLE_KEY": "pk_test_your_stripe_publishable_key_here",
  "MONGODB_URL": "mongodb+srv://mongo_access:3gfaAKMQsCwEjIXG@cluster0.4os5zqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  "SESSION_SECRET": "your_session_secret_change_this_in_production",
  "JWT_SECRET": "your_jwt_secret_change_this_in_production",
  "SMTP_USER": "your_email@gmail.com",
  "SMTP_PASS": "your_app_password"
}'

# --- Calendar Backend Secret ---
aws secretsmanager create-secret --name admin-panel-calendar --secret-string '{
  "GOOGLE_CLIENT_ID": "441654168539-9tfk7ibkt2r9tbsoohpjjfmjjn8u4lf0.apps.googleusercontent.com",
  "GOOGLE_CLIENT_SECRET": "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",
  "SECRET_KEY": "your_secret_key_for_sessions_change_this_in_production",
  "MONGODB_URL": "mongodb+srv://mongo_access:3gfaAKMQsCwEjIXG@cluster0.4os5zqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  "PROPELAUTH_API_KEY": "ad39ddd2967143bea4f4405e5f6dc4d0f5183c63a027add992e99a71cd80ab6c1ce07889f5ee6364f21abb40c827d29c",
  "JWT_SECRET": "your_jwt_secret_change_this_in_production",
  "SMTP_USER": "your_email@gmail.com",
  "SMTP_PASS": "your_app_password"
}' || aws secretsmanager put-secret-value --secret-id admin-panel-calendar --secret-string '{
  "GOOGLE_CLIENT_ID": "441654168539-9tfk7ibkt2r9tbsoohpjjfmjjn8u4lf0.apps.googleusercontent.com",
  "GOOGLE_CLIENT_SECRET": "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",
  "SECRET_KEY": "your_secret_key_for_sessions_change_this_in_production",
  "MONGODB_URL": "mongodb+srv://mongo_access:3gfaAKMQsCwEjIXG@cluster0.4os5zqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
  "PROPELAUTH_API_KEY": "ad39ddd2967143bea4f4405e5f6dc4d0f5183c63a027add992e99a71cd80ab6c1ce07889f5ee6364f21abb40c827d29c",
  "JWT_SECRET": "your_jwt_secret_change_this_in_production",
  "SMTP_USER": "your_email@gmail.com",
  "SMTP_PASS": "your_app_password"
}'

echo "All Secrets Manager secrets created or updated successfully." 