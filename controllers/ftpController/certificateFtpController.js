const ftp = require('basic-ftp');
const path = require('path');
const streamifier = require('streamifier');

const FTP_HOST = "193.203.185.45";
const FTP_USER = "u507723469";
const FTP_PASSWORD ="@EtableApp1312"
const REMOTE_DIR = "/domains/digitalcreations.co.in/public_html/athleap/Certificate"; 
const FTP_SECURE = false;
const BASE_URL = "https://digitalcreations.co.in"; 

async function uploadCertificate(buffer, remoteFileName) {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  client.ftp.timeout = 10000;

  try {
    // Connect to FTP server
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: FTP_SECURE,
    });
    console.log("Connected to FTP server");

    // Ensure the directory exists on the remote server
    await client.ensureDir(REMOTE_DIR);

    // Create a readable stream from the buffer
    const stream = streamifier.createReadStream(buffer);

    // Construct the full remote file path
    const remoteFilePath = path.posix.join(REMOTE_DIR, remoteFileName);

    // Upload the file to the FTP server
    await client.uploadFrom(stream, remoteFilePath);

    // Set appropriate file permissions
    await client.send(`SITE CHMOD 644 ${remoteFilePath}`);

    // Dynamically create the file URL
    const fileExtension = path.extname(remoteFileName).toLowerCase();
    let fileUrl = '';

    if (['.pdf', '.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'].includes(fileExtension)) {
      fileUrl = `${BASE_URL}/athleap/Certificate/${remoteFileName}`;
    }

    console.log("File uploaded successfully, accessible at:", fileUrl);
    return fileUrl;

  } catch (err) {
    console.error("FTP upload failed:", err);
    throw err;
  } finally {
    // Close the FTP connection
    console.log("Closing FTP connection.");
    client.close();
  }
}


module.exports = uploadCertificate;
