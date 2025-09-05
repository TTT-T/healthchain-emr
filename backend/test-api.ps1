# PowerShell script to test API endpoints

$baseUrl = "http://localhost:3001"

Write-Host "🧪 Testing EMR API Endpoints..." -ForegroundColor Green
Write-Host ""

try {
    # 1. Test Health Check
    Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health Check:" -ForegroundColor Green
    $healthResponse | ConvertTo-Json -Depth 3
    Write-Host ""

    # 2. Test Authentication - Login
    Write-Host "2. Testing Authentication - Login..." -ForegroundColor Yellow
    $loginData = @{
        username = "testuser"
        password = "testpassword"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ Login successful:" -ForegroundColor Green
    Write-Host "Status: 200"
    Write-Host "User: $($loginResponse.data.user.username)"
    Write-Host "Token: Present"
    $token = $loginResponse.data.token
    Write-Host ""

    if ($token) {
        # 3. Test Patient List
        Write-Host "3. Testing Patient List..." -ForegroundColor Yellow
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $patientsResponse = Invoke-RestMethod -Uri "$baseUrl/api/medical/patients" -Method GET -Headers $headers
        Write-Host "✅ Patients List:" -ForegroundColor Green
        Write-Host "Status: 200"
        Write-Host "Count: $($patientsResponse.data.Count)"
        Write-Host "Patients:"
        $patientsResponse.data | ForEach-Object {
            Write-Host "  - ID: $($_.id), Name: $($_.firstName) $($_.lastName), HN: $($_.hospitalNumber)"
        }
        Write-Host ""

        # 4. Test Create Patient
        Write-Host "4. Testing Create Patient..." -ForegroundColor Yellow
        $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
        $newPatient = @{
            hospitalNumber = "HN$timestamp"
            firstName = "Test"
            lastName = "Patient"
            gender = "male"
            dateOfBirth = "1990-01-01"
            phone = "0812345678"
            email = "test$timestamp@example.com"
        } | ConvertTo-Json

        $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/medical/patients" -Method POST -Body $newPatient -ContentType "application/json" -Headers $headers
        Write-Host "✅ Patient Created:" -ForegroundColor Green
        Write-Host "Status: 201"
        Write-Host "Patient: ID: $($createResponse.data.id), Name: $($createResponse.data.firstName) $($createResponse.data.lastName), HN: $($createResponse.data.hospitalNumber)"
        Write-Host ""

        # 5. Test Get Patient
        if ($createResponse.data.id) {
            Write-Host "5. Testing Get Patient..." -ForegroundColor Yellow
            $getPatientResponse = Invoke-RestMethod -Uri "$baseUrl/api/medical/patients/$($createResponse.data.id)" -Method GET -Headers $headers
            Write-Host "✅ Get Patient:" -ForegroundColor Green
            Write-Host "Status: 200"
            Write-Host "Patient: ID: $($getPatientResponse.data.id), Name: $($getPatientResponse.data.firstName) $($getPatientResponse.data.lastName), HN: $($getPatientResponse.data.hospitalNumber)"
            Write-Host ""
        }
    }

    Write-Host "🎉 All API tests completed successfully!" -ForegroundColor Green

} catch {
    Write-Host "❌ API Test Error:" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)"
    }
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}
