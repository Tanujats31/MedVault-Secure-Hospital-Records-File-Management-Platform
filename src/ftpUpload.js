// src/ftpUpload.js
// Pushes an uploaded file to the File Server over FTPS, into /medvault/uploads,
// using the dedicated "portal_uploader" technical account (see the setup guide,
// Step 2). This reuses the exact same vsftpd service and validation pipeline
// built in Phases 6 and 7 - nothing about the File Server changes.

const ftp = require('basic-ftp');

async function uploadFileToFileServer(localFilePath, remoteFileName) {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      secure: true,
      secureOptions: {
        // The File Server uses a self-signed certificate (Phase 6, Step B2).
        // In production with a CA-issued certificate, remove this line.
        rejectUnauthorized: false,
      },
    });
    await client.uploadFrom(localFilePath, remoteFileName);
  } finally {
    client.close();
  }
}

module.exports = { uploadFileToFileServer };
