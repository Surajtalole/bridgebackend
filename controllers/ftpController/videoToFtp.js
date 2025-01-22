const ftp = require('basic-ftp');
const path = require('path');
const streamifier = require('streamifier');

const FTP_HOST = "193.203.185.45";
const FTP_USER = "u507723469";
const FTP_PASSWORD ="@EtableApp1312"
const REMOTE_DIR = "/domains/digitalcreations.co.in/public_html/athleap/ChallengeVideos"; // Profile folder path
const FTP_SECURE = false;
const BASE_URL = "https://digitalcreations.co.in"; // Your website's base URL

async function uploadVideoToFTP(buffer, remoteFileName) {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    client.ftp.timeout = 30000; // Increased timeout to handle large files
    
    try {
      console.log("Attempting to connect to FTP server...");
  
      // Connect to FTP server
      await client.access({
        host: FTP_HOST,
        user: FTP_USER,
        password: FTP_PASSWORD,
        secure: FTP_SECURE,
      });
      console.log("Connected to FTP server");
  
      // Ensure the directory exists on the remote server
      console.log(`Ensuring directory exists: ${REMOTE_DIR}`);
      await client.ensureDir(REMOTE_DIR);
      console.log(`Directory confirmed: ${REMOTE_DIR}`);
  
      // Create a readable stream from the buffer
      const stream = streamifier.createReadStream(buffer);
      console.log("Created readable stream from buffer");
  
      // Construct the full remote file path
      const remoteFilePath = path.posix.join(REMOTE_DIR, remoteFileName);
      console.log(`Uploading file to path: ${remoteFilePath}`);
  
      // Upload the file to the FTP server
      await client.uploadFrom(stream, remoteFilePath);
      console.log("File uploaded successfully to FTP server");
  
      // Set appropriate file permissions
      console.log(`Setting file permissions for: ${remoteFilePath}`);
      await client.send(`SITE CHMOD 644 ${remoteFilePath}`);
      console.log("File permissions set successfully");
  
      // Generate the file URL
      const fileUrl = `${BASE_URL}/athleap/ChallengeVideos/${remoteFileName}`;
      console.log("Video uploaded successfully, accessible at:", fileUrl);
  
      return fileUrl;
    } catch (err) {
      console.error("FTP upload failed:", err.message);
      throw err;
    } finally {
      try {
        client.close();
        console.log("FTP client connection closed");
      } catch (closeErr) {
        console.error("Error closing FTP connection:", closeErr.message);
      }
    }
  }
  

module.exports = uploadVideoToFTP;
