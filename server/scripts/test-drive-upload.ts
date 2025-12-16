import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testDriveUpload() {
  console.log('🚀 Starting Google Drive Upload Test...');

  // 1. Check Configuration
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const credentials = process.env.GOOGLE_DRIVE_CREDENTIALS;

  console.log(`📂 Folder ID: ${folderId ? 'Found' : 'MISSING'}`);
  console.log(`🔑 Credentials: ${credentials ? 'Found' : 'MISSING'}`);

  if (!folderId || !credentials) {
    console.error('❌ Missing configuration. Please check .env file.');
    return;
  }

  try {
    // 2. Auth
    console.log('🔐 Authenticating with Google...');

    let auth;
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
      console.log('   Using OAuth2 credentials from .env');
      const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oAuth2Client.setCredentials({ refresh_token: refreshToken });
      auth = oAuth2Client;
    } else {
      console.log('   Using Service Account credentials from .env');
      const credentialsJson = JSON.parse(credentials!);
      auth = new google.auth.GoogleAuth({
        credentials: credentialsJson,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
    }

    const drive = google.drive({ version: 'v3', auth });

    // 3. Create Dummy File
    const fileName = `test-upload-${Date.now()}.txt`;
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, 'This is a test file to verify Google Drive permissions.');
    console.log(`📄 Created test file: ${fileName}`);

    // 4. Upload
    console.log('KZ Uploading to Drive...');
    const fileMetadata = {
      name: fileName,
      parents: [folderId!],
    };

    const media = {
      mimeType: 'text/plain',
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, userPermission',
    });

    console.log('\n✅ Upload Successful!');
    console.log(`   File ID: ${response.data.id}`);
    console.log(`   Name: ${response.data.name}`);
    console.log(`   Link: ${response.data.webViewLink}`);

    // 5. Cleanup
    fs.unlinkSync(filePath);
    console.log('🧹 Cleaned up local test file.');

  } catch (error: any) {
    console.error('\n❌ Upload Test FAILED:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Status Text: ${error.response.statusText}`);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    console.error('\nTips:');
    console.error('1. Check if the Service Account email is added as an "Editor" to the Google Drive folder.');
    console.error('2. Verify the Folder ID in .env matches the URL of the shared folder.');
    console.error('3. Ensure the Service Account JSON in .env is valid and not truncated.');
  }
}

testDriveUpload();
