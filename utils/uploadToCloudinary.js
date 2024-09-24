import { v2 as cloudinary } from 'cloudinary';

export const uploadToCloudinary = async (bufferToUpload) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { format: 'jpeg', folder: 'supplement-food' },
        function (error, result) {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        }
      )
      .end(bufferToUpload);
  });
};
