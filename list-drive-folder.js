import 'dotenv/config';
import { google } from 'googleapis';
const auth=new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,process.env.GOOGLE_REDIRECT_URI);
auth.setCredentials({refresh_token:process.env.GOOGLE_REFRESH_TOKEN});
const drive=google.drive({version:'v3',auth});
const folder='16VnD4AOgcpPpZK-81FNRAVFVD3gpuruX';
const q = `'${folder}' in parents and trashed=false`;
const r=await drive.files.list({q,fields:'files(name)',pageSize:30,orderBy:'name'});
console.log(r.data.files.map(f=>f.name).slice(0,12).join('\n'));
