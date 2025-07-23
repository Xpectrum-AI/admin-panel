#!/bin/bash
# Script to create all required SSM parameters for the admin panel deployment
# Usage: bash create-ssm-params.sh

set -e

# --- Frontend ---
aws ssm put-parameter --name "/admin-panel/frontend/NEXT_PUBLIC_PROPELAUTH_API_KEY" --value "ad39ddd2967143bea4f4405e5f6dc4d0f5183c63a027add992e99a71cd80ab6c1ce07889f5ee6364f21abb40c827d29c" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/frontend/NEXT_PUBLIC_API_KEY" --value "xpectrum-ai@123" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/frontend/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" --value "pk_test_your_stripe_publishable_key_here" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/frontend/NEXT_PUBLIC_GOOGLE_CLIENT_ID" --value "441654168539-9tfk7ibkt2r9tbsoohpjjfmjjn8u4lf0.apps.googleusercontent.com" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/frontend/NEXT_PUBLIC_MONGODB_URL" --value "mongodb+srv://mongo_access:3gfaAKMQsCwEjIXG@cluster0.4os5zqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" --type "SecureString" --overwrite

# --- Backend ---
aws ssm put-parameter --name "/admin-panel/backend/API_KEY" --value "xpectrum-ai@123" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/backend/LIVE_API_KEY" --value "xpectrum-ai@123" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/backend/PROPELAUTH_API_KEY" --value "5c1b57840f4d4ec7265d0622cf68dd63e028b78d8482b21b8fb00395bb6ee3c59a1fde5f9288d373b1a315e591bd8723" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/backend/STRIPE_SECRET_KEY" --value "sk_test_51RaX9pBTMxLlaTtWg74455SOBukRu3gQsEY3SfP17rkMOHy3Aoh7SHvuoMqV5Kk1wdsEf9yCeoROtu66SulV1YKW00YGErU4Pq" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/backend/STRIPE_PUBLISHABLE_KEY" --value "pk_test_your_stripe_publishable_key_here" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/backend/MONGODB_URL" --value "mongodb+srv://mongo_access:3gfaAKMQsCwEjIXG@cluster0.4os5zqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/backend/SESSION_SECRET" --value "your_session_secret_change_this_in_production" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/backend/JWT_SECRET" --value "your_jwt_secret_change_this_in_production" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/backend/SMTP_USER" --value "your_email@gmail.com" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/backend/SMTP_PASS" --value "your_app_password" --type "SecureString" --overwrite

# --- Calendar Backend ---
aws ssm put-parameter --name "/admin-panel/calendar/GOOGLE_CLIENT_ID" --value "441654168539-9tfk7ibkt2r9tbsoohpjjfmjjn8u4lf0.apps.googleusercontent.com" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/calendar/GOOGLE_CLIENT_SECRET" --value "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" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/calendar/SECRET_KEY" --value "your_secret_key_for_sessions_change_this_in_production" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/calendar/MONGODB_URL" --value "mongodb+srv://mongo_access:3gfaAKMQsCwEjIXG@cluster0.4os5zqa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/calendar/PROPELAUTH_API_KEY" --value "ad39ddd2967143bea4f4405e5f6dc4d0f5183c63a027add992e99a71cd80ab6c1ce07889f5ee6364f21abb40c827d29c" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/calendar/JWT_SECRET" --value "your_jwt_secret_change_this_in_production" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/calendar/SMTP_USER" --value "your_email@gmail.com" --type "SecureString" --overwrite
aws ssm put-parameter --name "/admin-panel/calendar/SMTP_PASS" --value "your_app_password" --type "SecureString" --overwrite

echo "All SSM parameters created or updated successfully." 