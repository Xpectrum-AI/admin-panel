#!/usr/bin/env python3
"""
Test script for Calendar Services Backend Integration
Tests the API endpoints and verifies functionality
"""

import requests
import json
import time

# Configuration
import os
BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8086")
API_KEY = os.getenv("API_KEY", "xpectrum-ai@123")
HEADERS = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}

def test_health_check():
    """Test the health check endpoint"""
    print("🔍 Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Is it running on port 8086?")
        return False

def test_api_authentication():
    """Test API authentication"""
    print("🔐 Testing API authentication...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/services/calendar", headers=HEADERS)
        if response.status_code == 200:
            print("✅ API authentication passed")
            return True
        else:
            print(f"❌ API authentication failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API authentication error: {e}")
        return False

def test_create_service():
    """Test creating a calendar service"""
    print("➕ Testing service creation...")
    service_data = {
        "name": "Test Calendar Service",
        "description": "A test calendar service for integration testing",
        "timezone": "America/New_York"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/services/calendar",
            headers=HEADERS,
            json=service_data
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Service creation passed")
                return result.get("data", {}).get("id")
            else:
                print(f"❌ Service creation failed: {result.get('error')}")
                return None
        else:
            print(f"❌ Service creation failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Service creation error: {e}")
        return None

def test_get_services():
    """Test getting all services"""
    print("📋 Testing get services...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/services/calendar", headers=HEADERS)
        if response.status_code == 200:
            result = response.json()
            services_count = len(result.get("services", []))
            print(f"✅ Get services passed - Found {services_count} services")
            return True
        else:
            print(f"❌ Get services failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get services error: {e}")
        return False

def test_update_service(service_id):
    """Test updating a service"""
    if not service_id:
        print("⚠️ Skipping service update test - no service ID")
        return False
    
    print("✏️ Testing service update...")
    update_data = {
        "name": "Updated Test Service",
        "description": "Updated description for testing"
    }
    
    try:
        response = requests.put(
            f"{BASE_URL}/api/v1/services/calendar/{service_id}",
            headers=HEADERS,
            json=update_data
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Service update passed")
                return True
            else:
                print(f"❌ Service update failed: {result.get('error')}")
                return False
        else:
            print(f"❌ Service update failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Service update error: {e}")
        return False

def test_toggle_service_status(service_id):
    """Test toggling service status"""
    if not service_id:
        print("⚠️ Skipping status toggle test - no service ID")
        return False
    
    print("🔄 Testing status toggle...")
    status_data = {"status": "inactive"}
    
    try:
        response = requests.patch(
            f"{BASE_URL}/api/v1/services/calendar/{service_id}/status",
            headers=HEADERS,
            json=status_data
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Status toggle passed")
                return True
            else:
                print(f"❌ Status toggle failed: {result.get('error')}")
                return False
        else:
            print(f"❌ Status toggle failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Status toggle error: {e}")
        return False

def test_delete_service(service_id):
    """Test deleting a service"""
    if not service_id:
        print("⚠️ Skipping service deletion test - no service ID")
        return False
    
    print("🗑️ Testing service deletion...")
    try:
        response = requests.delete(
            f"{BASE_URL}/api/v1/services/calendar/{service_id}",
            headers=HEADERS
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Service deletion passed")
                return True
            else:
                print(f"❌ Service deletion failed: {result.get('error')}")
                return False
        else:
            print(f"❌ Service deletion failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Service deletion error: {e}")
        return False

def test_timezone_options():
    """Test getting timezone options"""
    print("🌍 Testing timezone options...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/timezone/options")
        if response.status_code == 200:
            result = response.json()
            timezones_count = len(result.get("timezones", []))
            print(f"✅ Timezone options passed - Found {timezones_count} timezones")
            return True
        else:
            print(f"❌ Timezone options failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Timezone options error: {e}")
        return False

def main():
    """Run all integration tests"""
    print("🚀 Starting Calendar Services Backend Integration Tests")
    print("=" * 60)
    
    # Test results
    tests = []
    
    # Run tests
    tests.append(("Health Check", test_health_check()))
    tests.append(("API Authentication", test_api_authentication()))
    tests.append(("Get Services", test_get_services()))
    
    # Create a test service
    service_id = test_create_service()
    tests.append(("Create Service", service_id is not None))
    
    if service_id:
        tests.append(("Update Service", test_update_service(service_id)))
        tests.append(("Toggle Status", test_toggle_service_status(service_id)))
        tests.append(("Delete Service", test_delete_service(service_id)))
    
    tests.append(("Timezone Options", test_timezone_options()))
    
    # Print results
    print("\n" + "=" * 60)
    print("📊 Test Results:")
    print("=" * 60)
    
    passed = 0
    total = len(tests)
    
    for test_name, result in tests:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print("=" * 60)
    print(f"🎯 Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend integration is working correctly.")
        print("\n📝 Next steps:")
        print("1. Start your frontend: cd frontend && npm run dev")
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        print(f"2. Access the dashboard: {frontend_url}/services")
        print("3. Create your .env.local file with the provided configuration")
    else:
        print("⚠️ Some tests failed. Please check the backend configuration.")
        print("\n🔧 Troubleshooting:")
        print("1. Ensure backend is running: cd calendar-backend && python start.py")
        print("2. Check MongoDB connection in env_config.txt")
        print("3. Verify API key matches: xpectrum-ai@123 (or set API_KEY environment variable)")

if __name__ == "__main__":
    main() 