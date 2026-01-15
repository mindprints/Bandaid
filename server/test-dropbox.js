// Quick test script to check Dropbox access
import { Dropbox } from 'dropbox';
import dotenv from 'dotenv';

dotenv.config();

const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });

console.log('Testing Dropbox connection...');
console.log('Token length:', process.env.DROPBOX_ACCESS_TOKEN?.length);

// Try to list root folder
try {
  console.log('\nListing root folder (empty string):');
  const rootResponse = await dbx.filesListFolder({ path: '' });
  console.log('Found', rootResponse.result.entries.length, 'items at root:');
  rootResponse.result.entries.forEach(entry => {
    console.log(' -', entry['.tag'], entry.name, entry.path_display);
  });
} catch (error) {
  console.error('Error listing root:', error.status, error.error?.error_summary);
}

// Try to list /AF_SHOW_2026
try {
  console.log('\nListing /AF_SHOW_2026:');
  const folderResponse = await dbx.filesListFolder({ path: '/AF_SHOW_2026', recursive: false });
  console.log('Found', folderResponse.result.entries.length, 'items:');
  folderResponse.result.entries.slice(0, 5).forEach(entry => {
    console.log(' -', entry['.tag'], entry.name, entry.path_display);
  });
} catch (error) {
  console.error('Error listing /AF_SHOW_2026:', error.status, error.error?.error_summary);
}

// Try to check account info
try {
  console.log('\nGetting account info:');
  const account = await dbx.usersGetCurrentAccount();
  console.log('Account type:', account.result.account_type['.tag']);
  console.log('Email:', account.result.email);
} catch (error) {
  console.error('Error getting account:', error.status, error.error?.error_summary);
}

process.exit(0);
