import dprofile from "../assets/dprofile.png";

export function profileImageGetter(profileImg) {
  if(!profileImg || profileImg === null) return dprofile;
  else return import.meta.env.VITE_API_URL + "/image/profile/" + profileImg;
}

export function certImageGetter(certFileName) {
  if(!certFileName || certFileName === null) return null;
  const ext = certFileName.toLowerCase().split('.').pop();
  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
  const isPdf = ext === 'pdf';
  
  if (isImage) {
    return import.meta.env.VITE_API_URL + "/image/cert/" + certFileName;
  } else if (isPdf) {
    return import.meta.env.VITE_API_URL + "/image/cert/" + certFileName;
  }
  return null;
}

export function receiptImageGetter(receiptFileName) {
  if(!receiptFileName || receiptFileName === null) return null;
  const ext = receiptFileName.toLowerCase().split('.').pop();
  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
  const isPdf = ext === 'pdf';

  if (isImage) {
    return import.meta.env.VITE_API_URL + "/image/receipt/" + receiptFileName;
  } else if (isPdf) {
    return import.meta.env.VITE_API_URL + "/image/receipt/" + receiptFileName;
  }
  return null;
}

export function clubImageGetter(clubImg) {
  if(!clubImg || clubImg === null) return dprofile; // Usar la misma imagen por defecto que profile
  else return import.meta.env.VITE_API_URL + "/image/profile/" + clubImg;
}