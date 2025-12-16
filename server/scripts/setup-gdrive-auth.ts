import { google } from 'googleapis';
import readline from 'readline';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

async function setupGDriveAuth() {
    console.log('🔐 Google Drive Backup Authorization Setup');
    console.log('==========================================\n');
    console.log('This script will help you generate the REFRESH_TOKEN needed for backups.\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const question = (query: string): Promise<string> =>
        new Promise((resolve) => rl.question(query, resolve));

    try {
        const clientId = await question('Enter your Client ID: ');
        const clientSecret = await question('Enter your Client Secret: ');

        if (!clientId || !clientSecret) {
            console.error('❌ Client ID and Client Secret are required.');
            process.exit(1);
        }

        const oAuth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            'https://developers.google.com/oauthplayground' // Common redirect URI for manual token generation
        );

        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent' // Force consent to ensure we get a refresh token
        });

        console.log('\n🔗  Authorize this app by visiting this url:');
        console.log(authUrl);
        console.log('\n⚠️  IMPORTANT: When asking for the code, you might be redirected to "https://developers.google.com/oauthplayground".');
        console.log('    Copy the "authorization code" from the input box on that page (or from the URL bar if it redirects elsewhere).');

        const code = await question('\n👉 Enter the code from that page here: ');

        const { tokens } = await oAuth2Client.getToken(code);

        if (!tokens.refresh_token) {
            console.error('\n❌ Error: No refresh token returned. Did you approve access?');
            console.error('   Note: You might need to add your email to "Test Users" in Google Cloud Console if the app is in "Testing" mode.');
            process.exit(1);
        }

        console.log('\n✅ Authorization Successful!');
        console.log('\n📝 Add these lines to your .env file on the server:');
        console.log('---------------------------------------------------');
        console.log(`GOOGLE_DRIVE_CLIENT_ID=${clientId}`);
        console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${clientSecret}`);
        console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('---------------------------------------------------');
        console.log('\n(You can remove GOOGLE_DRIVE_CREDENTIALS if you replace it with these)');

    } catch (error: any) {
        console.error('\n❌ Error retrieving access token:', error.message);
    } finally {
        rl.close();
    }
}

setupGDriveAuth();
