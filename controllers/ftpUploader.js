const ftp = require('basic-ftp');
const path = require('path');
const streamifier = require('streamifier');

const FTP_HOST = "193.203.185.45";
const FTP_USER = "u507723469";
const FTP_PASSWORD = "@EtableApp1312";
const REMOTE_DIR = "/files/public_html/athleap/otr"; // Correct FTP path
const FTP_SECURE = false;

async function uploadToFTP(buffer, remoteFileName) {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  client.ftp.timeout = 10000;

  try {
    console.log("Attempting to connect to FTP server...");

    try {
      await client.access({
        host: FTP_HOST,
        user: FTP_USER,
        password: FTP_PASSWORD,
        secure: FTP_SECURE,
      });
      console.log("Connected to FTP server");

      // Ensure the directory exists and create if necessary
      console.log(`Ensuring remote directory exists: ${REMOTE_DIR}`);
      await ensureRemoteDir(client, REMOTE_DIR);
      console.log(`Directory ${REMOTE_DIR} ensured`);

      // Verify if buffer size is received correctly
      console.log(`Buffer received. Size: ${buffer.length} bytes`);

      const stream = streamifier.createReadStream(buffer);
      console.log("Buffer successfully converted to stream", stream);

      const remoteFilePath = path.posix.join(REMOTE_DIR, remoteFileName);
      console.log(`Uploading file to FTP server at ${remoteFilePath}...`);

      try {
        await client.uploadFrom(stream, remoteFilePath);
        await client.send(`SITE CHMOD 644 ${remoteFilePath}`);

        // Checking if the upload was successful
        console.log(`File uploaded successfully to ${remoteFilePath}`);

      } catch (uploadErr) {
        console.error("Error occurred during file upload:", uploadErr);
        throw uploadErr;
      }

      // Generate file URL
      const fileUrl = `https://srv1127-files.hstgr.io/b26b2d4143357769/files/public_html/athleap/otr/${remoteFileName}`;
      console.log(`Generated file URL: ${fileUrl}`);

      return fileUrl;

    } catch (err) {
      console.error("FTP connection failed:", err);
      throw err;
    }
  } catch (err) {
    console.error("FTP upload failed:", err);
    throw err;
  } finally {
    console.log("Closing FTP connection.");
    client.close();
  }
}

// Ensure remote directory exists and create if not
async function ensureRemoteDir(client, remoteDir) {
  const dirs = remoteDir.split('/');
  let currentDir = '';

  for (const dir of dirs) {
    currentDir += `/${dir}`;
    try {
      console.log(`Checking directory: ${currentDir}`);
      await client.cd(currentDir); // Try to change to the directory
    } catch (err) {
      if (err.code === 550) {
        // Directory doesn't exist, create it
        console.log(`Directory ${currentDir} not found. Creating...`);
        await client.makeDir(currentDir); // Create the directory
      } else {
        // Unexpected error while trying to change directory
        throw err;
      }
    }
  }
}

module.exports = uploadToFTP;
