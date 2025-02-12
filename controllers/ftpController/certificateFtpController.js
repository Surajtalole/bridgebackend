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
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: FTP_SECURE });
    console.log("Connected to FTP server");
    await client.ensureDir(REMOTE_DIR);
    const stream = streamifier.createReadStream(buffer);
    const remoteFilePath = path.posix.join(REMOTE_DIR, remoteFileName);
    await client.uploadFrom(stream, remoteFilePath);
    await client.send(`SITE CHMOD 644 ${remoteFilePath}`);
    const fileUrl = `${BASE_URL}/athleap/Certificate/${remoteFileName}`;
    console.log("File uploaded successfully, accessible at:", fileUrl);
    return fileUrl;
  } catch (err) {
    console.error("FTP upload failed:", err);
    throw err;
  } finally {
    console.log("Closing FTP connection.");
    client.close();
  }
}


module.exports = uploadCertificate;
